// supabase/functions/cleanup-expired-invites/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("invites")
    .update({ used: true })
    .eq("used", false)
    .lt("expires_at", now)
    .select("id, email, org_id");

  if (error) {
    console.error("❌ cleanup failed", error);
    return new Response("error", { status: 500 });
  }

  console.log(`✅ expired invites closed: ${data?.length ?? 0}`);

  return new Response("ok");
});
