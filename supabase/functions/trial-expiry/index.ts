// supabase/functions/trial-expiry/index.ts

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date().toISOString();

    /* =====================================================
       1) FIND EXPIRED TRIALS (STATUS'A GÜVENME)
    ====================================================== */
    const { data: expiredTrials, error: fetchError } = await supabase
      .from("org_subscriptions")
      .select("org_id")
      .eq("plan", "trial")
      .not("expires_at", "is", null)
      .lt("expires_at", now);

    if (fetchError) {
      console.error("Fetch expired trials error:", fetchError);
      return new Response("Fetch error", { status: 500 });
    }

    if (!expiredTrials || expiredTrials.length === 0) {
      return new Response("No expired trials", { status: 200 });
    }

    const orgIds = expiredTrials.map(t => t.org_id);

    /* =====================================================
       2) DOWNGRADE SUBSCRIPTIONS
    ====================================================== */
    const { error: updateSubError } = await supabase
      .from("org_subscriptions")
      .update({
        plan: "free",
        status: "expired",
        expires_at: null,
        updated_at: now,
      })
      .in("org_id", orgIds)
      .eq("plan", "trial"); // ekstra güvenlik

    if (updateSubError) {
      console.error("Subscription downgrade error:", updateSubError);
      return new Response("Subscription update error", { status: 500 });
    }

    /* =====================================================
       3) DISABLE PREMIUM FLAG
    ====================================================== */
    const { error: updateOrgError } = await supabase
      .from("organizations")
      .update({
        is_premium: false,
        premium_activated_at: null,
        premium_activated_by: null,
      })
      .in("id", orgIds);

    if (updateOrgError) {
      console.error("Organization premium disable error:", updateOrgError);
      return new Response("Organization update error", { status: 500 });
    }

    console.log(`Expired trials processed: ${orgIds.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: orgIds.length,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Unhandled error:", err);
    return new Response("Internal error", { status: 500 });
  }
});