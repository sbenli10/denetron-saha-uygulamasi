import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const now = new Date().toISOString();

  /* =============================
     FIND EXPIRED ACTIVE TRIALS
  ============================== */
  const { data: trials, error } = await supabase
    .from("org_subscriptions")
    .select("org_id")
    .eq("plan", "trial")
    .eq("status", "active")
    .not("expires_at", "is", null)
    .lt("expires_at", now);

  if (error) {
    console.error("Trial fetch error:", error);
    return new Response("Error fetching trials", { status: 500 });
  }

  if (!trials || trials.length === 0) {
    return new Response("No expired trials", { status: 200 });
  }

  const orgIds = trials.map(t => t.org_id);

  /* =============================
     DOWNGRADE SUBSCRIPTIONS
  ============================== */
  await supabase
    .from("org_subscriptions")
    .update({
      plan: "free",
      status: "expired",
      expires_at: null,
      updated_at: now,
    })
    .in("org_id", orgIds);

  /* =============================
     DISABLE PREMIUM FEATURES
  ============================== */
  await supabase
    .from("organizations")
    .update({
      is_premium: false,
      premium_activated_at: null,
      premium_activated_by: null,
    })
    .in("id", orgIds);

  return new Response(
    `Expired trials processed: ${orgIds.length}`,
    { status: 200 }
  );
});
