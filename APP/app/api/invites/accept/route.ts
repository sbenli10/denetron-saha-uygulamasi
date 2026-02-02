// APP/app/api/invites/accept/route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = supabaseServerClient();
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ error: "Token yok." }, { status: 400 });
  }

  const { data: invite } = await supabase
    .from("invites")
    .select("*")
    .eq("token", token)
    .eq("used", false)
    .maybeSingle();

  if (!invite) {
    return NextResponse.json({ error: "Geçersiz davet." }, { status: 400 });
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "Davet süresi dolmuş." }, { status: 410 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (invite.email && invite.email !== user.email) {
    return NextResponse.json({ error: "Email uyuşmuyor." }, { status: 403 });
  }

  /* PROFILE */
  await supabase.from("profiles").upsert({
    id: user.id,
    full_name: user.user_metadata?.full_name ?? user.email?.split("@")[0],
    email: user.email,
  });

  /* MEMBER */
  await supabase.from("org_members").insert({
    id: crypto.randomUUID(),
    org_id: invite.org_id,
    user_id: user.id,
    role_id: invite.role_id,
  });

  /* AUDIT */
  await supabase.from("audit_logs").insert({
    organization_id: invite.org_id,
    user_id: user.id,
    action: "invite_accepted",
    metadata: { email: user.email, role_id: invite.role_id },
  });

  await supabase.from("invites").update({ used: true }).eq("id", invite.id);

  return NextResponse.json({ success: true });
}
