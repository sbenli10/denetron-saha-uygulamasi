// APP/app/api/invites/register-from-invite/route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = supabaseServerClient();
  const { token, email, password, fullName } = await req.json();

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
    return NextResponse.json(
      { error: "Davetin süresi dolmuş." },
      { status: 410 }
    );
  }

  const { data: signUpData, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const userId = signUpData.user!.id;

  await supabase.from("profiles").insert({
    id: userId,
    full_name: fullName,
    email,
  });

  await supabase.from("org_members").insert({
    id: crypto.randomUUID(),
    org_id: invite.org_id,
    user_id: userId,
    role_id: invite.role_id,
  });

  await supabase.from("audit_logs").insert({
    organization_id: invite.org_id,
    user_id: userId,
    action: "invite_registered",
    metadata: { invite_id: invite.id },
  });

  await supabase
    .from("invites")
    .update({ used: true })
    .eq("id", invite.id);

  return NextResponse.json({ success: true });
}
