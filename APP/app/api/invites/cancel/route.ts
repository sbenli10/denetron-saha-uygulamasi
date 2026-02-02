//APP\app\api\invites\cancel\route.ts
import { NextResponse } from "next/server";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  console.log("🔴 [CANCEL] Route hit");

  const supabase = supabaseServiceRoleClient();

  const { inviteId } = await req.json();
  if (!inviteId) {
    return NextResponse.json({ error: "inviteId zorunlu" }, { status: 400 });
  }

  const { data: invite } = await supabase
    .from("invites")
    .select("*")
    .eq("id", inviteId)
    .maybeSingle();

  console.log("📨 [CANCEL] Invite before update:", invite);

  if (!invite) {
    return NextResponse.json({ error: "Davet bulunamadı" }, { status: 404 });
  }

  const { error: updateErr } = await supabase
    .from("invites")
    .update({ used: true })
    .eq("id", inviteId);

  if (updateErr) {
    console.error("❌ Update failed", updateErr);
    return NextResponse.json({ error: updateErr.message }, { status: 400 });
  }

  const { data: after } = await supabase
    .from("invites")
    .select("id, used")
    .eq("id", inviteId)
    .single();

  console.log("✅ [CANCEL] Invite after update:", after);

  await supabase.from("audit_logs").insert({
    organization_id: invite.org_id,
    user_id: invite.invited_by,
    action: "invite_cancelled",
    metadata: { invite_id: invite.id, email: invite.email },
  });

  revalidatePath("/admin/users");

  return NextResponse.json({ success: true });
}
