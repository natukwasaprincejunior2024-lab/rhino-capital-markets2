import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PLANS = ["daily", "weekly", "monthly", "yearly"];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function subscriptionStatus(status: Stripe.Subscription.Status): "active" | "past_due" | "canceled" | null {
  if (status === "active" || status === "trialing") return "active";
  if (status === "past_due" || status === "unpaid") return "past_due";
  if (status === "canceled" || status === "incomplete_expired") return "canceled";
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const signature = req.headers.get("stripe-signature");
  if (!signature) return json({ error: "Missing signature" }, 400);

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    httpClient: Stripe.createFetchHttpClient(),
  });
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch {
    return json({ error: "Invalid signature" }, 400);
  }

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const { error: logError } = await admin
      .from("stripe_events")
      .insert({ event_id: event.id, event_type: event.type });
    if (logError) {
      if (logError.code === "23505") return json({ received: true, duplicate: true });
      throw new Error(logError.message);
    }

    try {
      await handleEvent(admin, event);
    } catch (err) {
      await admin.from("stripe_events").delete().eq("event_id", event.id);
      throw err;
    }
    return json({ received: true });
  } catch (err) {
    console.error("billing-webhook failed", err);
    return json({ error: "Could not process event" }, 500);
  }
});

async function handleEvent(admin: ReturnType<typeof createClient>, event: Stripe.Event): Promise<void> {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode !== "payment" || session.payment_status !== "paid") return;

    const userId = session.metadata?.user_id;
    const kind = session.metadata?.kind;
    const units = Number(session.metadata?.units);
    if (!userId || !kind || !Number.isInteger(units) || units <= 0) {
      throw new Error(`Checkout ${session.id} is missing purchase details`);
    }

    const { error } = await admin.rpc("grant_billing_units", { p_user: userId, p_kind: kind, p_units: units });
    if (error) throw new Error(error.message);
    return;
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const sub = event.data.object as Stripe.Subscription;
    const userId = sub.metadata?.user_id;
    const plan = sub.metadata?.plan ?? "";
    if (!userId || !PLANS.includes(plan)) return;

    const status = event.type === "customer.subscription.deleted" ? "canceled" : subscriptionStatus(sub.status);
    const isActive = status === "active";
    const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

    const { error } = await admin.from("billing_accounts").upsert(
      {
        user_id: userId,
        plan: isActive ? plan : "free",
        plan_status: status ?? "none",
        plan_period_end: isActive ? periodEnd : null,
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
  }
}
