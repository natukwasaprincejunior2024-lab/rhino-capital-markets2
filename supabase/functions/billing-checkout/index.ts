import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type Product =
  | { mode: "payment"; name: string; amountCents: number; kind: "credits" | "display"; units: number }
  | { mode: "subscription"; name: string; amountCents: number; interval: "day" | "week" | "month" | "year"; plan: string };

const PRODUCTS: Record<string, Product> = {
  print_1: { mode: "payment", name: "Daily report print credit (1)", amountCents: 10, kind: "credits", units: 1 },
  print_10: { mode: "payment", name: "Daily report print credits (10)", amountCents: 80, kind: "credits", units: 10 },
  print_50: { mode: "payment", name: "Daily report print credits (50)", amountCents: 300, kind: "credits", units: 50 },
  display_hour: { mode: "payment", name: "Display board hour", amountCents: 10, kind: "display", units: 1 },
  daily: { mode: "subscription", name: "Daily plan", amountCents: 199, interval: "day", plan: "daily" },
  weekly: { mode: "subscription", name: "Weekly plan", amountCents: 599, interval: "week", plan: "weekly" },
  monthly: { mode: "subscription", name: "Monthly plan", amountCents: 999, interval: "month", plan: "monthly" },
  yearly: { mode: "subscription", name: "Yearly plan", amountCents: 7999, interval: "year", plan: "yearly" },
};

const MAX_PAYMENT_QUANTITY = 20;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function safeOrigin(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.origin : null;
  } catch {
    return null;
  }
}

async function ensurePrice(stripe: Stripe, key: string, product: Product): Promise<string> {
  const lookupKey = `rhino_${key}`;
  const existing = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
  if (existing.data[0]) return existing.data[0].id;

  const created = await stripe.products.create({ name: product.name, metadata: { app_key: key } });
  const price = await stripe.prices.create({
    product: created.id,
    currency: "usd",
    unit_amount: product.amountCents,
    lookup_key: lookupKey,
    ...(product.mode === "subscription" ? { recurring: { interval: product.interval } } : {}),
  });
  return price.id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData.user) return json({ error: "Please sign in to continue." }, 401);
    const user = userData.user;

    const body = await req.json().catch(() => null);
    const productKey = typeof body?.product === "string" ? body.product : "";
    const product = PRODUCTS[productKey];
    if (!product) return json({ error: "That product is not available." }, 400);

    const origin = safeOrigin(req.headers.get("origin"));
    if (!origin) return json({ error: "Could not determine where to return after payment." }, 400);

    const { data: account, error: accountError } = await admin
      .from("billing_accounts")
      .select("stripe_customer_id, plan, plan_status, plan_period_end")
      .eq("user_id", user.id)
      .maybeSingle();
    if (accountError) throw new Error(accountError.message);

    const hasActivePlan =
      account?.plan_status === "active" &&
      account?.plan !== "free" &&
      (!account?.plan_period_end || new Date(account.plan_period_end) > new Date());
    if (product.mode === "subscription" && hasActivePlan) {
      return json({ error: "You already have an active plan." }, 409);
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      httpClient: Stripe.createFetchHttpClient(),
    });

    let customerId = account?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } });
      customerId = customer.id;
      const { error: saveError } = await admin
        .from("billing_accounts")
        .upsert({ user_id: user.id, stripe_customer_id: customerId }, { onConflict: "user_id" });
      if (saveError) throw new Error(saveError.message);
    }

    const quantity = product.mode === "payment" ? Math.min(Math.max(Math.trunc(Number(body?.quantity) || 1), 1), MAX_PAYMENT_QUANTITY) : 1;
    const priceId = await ensurePrice(stripe, productKey, product);
    const returnUrl = `${origin}/`;

    const session = await stripe.checkout.sessions.create({
      mode: product.mode,
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity }],
      success_url: `${returnUrl}?billing=success`,
      cancel_url: `${origin}/pricing?billing=cancelled`,
      ...(product.mode === "payment"
        ? {
            metadata: {
              user_id: user.id,
              kind: product.kind,
              units: String(product.units * quantity),
            },
          }
        : {
            subscription_data: { metadata: { user_id: user.id, plan: product.plan } },
          }),
    });

    if (!session.url) throw new Error("Stripe did not return a checkout link.");
    return json({ url: session.url });
  } catch (err) {
    console.error("billing-checkout failed", err);
    return json({ error: "Could not start checkout. Please try again." }, 500);
  }
});
