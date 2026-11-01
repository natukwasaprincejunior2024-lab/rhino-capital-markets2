import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

    const token = new URL(req.url).searchParams.get("token") ?? "";
    if (!UUID_PATTERN.test(token)) return json({ error: "Board not found" }, 404);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: link, error: linkError } = await admin
      .from("display_links")
      .select("user_id")
      .eq("token", token)
      .is("revoked_at", null)
      .maybeSingle();
    if (linkError) throw new Error(linkError.message);
    if (!link) return json({ error: "Board not found" }, 404);

    const [ratesResult, profileResult] = await Promise.all([
      admin.from("bureau_rates").select("symbol, buying, selling, updated_at").eq("user_id", link.user_id),
      admin.from("bureau_profiles").select("name, address, phone").eq("user_id", link.user_id).maybeSingle(),
    ]);
    if (ratesResult.error) throw new Error(ratesResult.error.message);
    if (profileResult.error) throw new Error(profileResult.error.message);

    const rates = (ratesResult.data ?? []).map((row) => ({
      symbol: String(row.symbol),
      buying: Number(row.buying),
      selling: Number(row.selling),
    }));
    const updatedAt = (ratesResult.data ?? [])
      .map((row) => String(row.updated_at))
      .sort()
      .at(-1) ?? null;

    return json({
      profile: {
        name: String(profileResult.data?.name ?? ""),
        address: String(profileResult.data?.address ?? ""),
        phone: String(profileResult.data?.phone ?? ""),
      },
      rates,
      updatedAt,
    });
  } catch (err) {
    console.error("display-board failed", err);
    return json({ error: "Could not load the board" }, 500);
  }
});
