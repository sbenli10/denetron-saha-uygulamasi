//APP\app\api\invites\auto-accept\route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const reqId = crypto.randomUUID();
  console.log(`[auto-accept][${reqId}] request_started`);

  try {
    const supabase = supabaseServerClient();
    const { token } = await req.json();

    console.log(`[auto-accept][${reqId}] payload`, { token });

    if (!token) {
      console.log(`[auto-accept][${reqId}] missing_token`);
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    /* 1️⃣ AUTH USER */
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      console.log(`[auto-accept][${reqId}] auth_failed`, authErr);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`[auto-accept][${reqId}] auth_ok user=${user.id}`);

    /* 2️⃣ INVITE FETCH */
    const { data: invite, error: inviteErr } = await supabase
      .from("invites")
      .select("id, org_id, role_id, email, used, expires_at")
      .eq("token", token)
      .single();

    if (inviteErr || !invite) {
      console.log(`[auto-accept][${reqId}] invite_not_found`, inviteErr);
      return NextResponse.json({ error: "Invalid invite" }, { status: 400 });
    }

    console.log(`[auto-accept][${reqId}] invite_loaded`, invite);

    /* 3️⃣ VALIDATIONS */
    if (invite.used) {
      console.log(`[auto-accept][${reqId}] invite_already_used`);
      return NextResponse.json(
        { error: "Invite already used" },
        { status: 409 }
      );
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      console.log(`[auto-accept][${reqId}] invite_expired`);
      return NextResponse.json(
        { error: "Invite expired" },
        { status: 410 }
      );
    }

    if (invite.email && invite.email !== user.email) {
      console.log(`[auto-accept][${reqId}] email_mismatch`, {
        inviteEmail: invite.email,
        userEmail: user.email,
      });
      return NextResponse.json(
        { error: "Email mismatch" },
        { status: 403 }
      );
    }

    /* 4️⃣ ALREADY MEMBER CHECK */
    const { data: existingMember } = await supabase
      .from("org_members")
      .select("id")
      .eq("org_id", invite.org_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingMember) {
      console.log(`[auto-accept][${reqId}] user_already_member`);
      await supabase
        .from("invites")
        .update({ used: true })
        .eq("id", invite.id);

      return NextResponse.json({ success: true, alreadyMember: true });
    }

    /* 5️⃣ INSERT MEMBER */
    const { error: memberErr } = await supabase
      .from("org_members")
      .insert({
        org_id: invite.org_id,
        user_id: user.id,
        role_id: invite.role_id,
      });

    if (memberErr) {
      console.error(`[auto-accept][${reqId}] member_insert_failed`, memberErr);
      return NextResponse.json(
        { error: memberErr.message },
        { status: 500 }
      );
    }

    console.log(`[auto-accept][${reqId}] member_inserted`);

    /* 6️⃣ MARK INVITE USED */
    await supabase
      .from("invites")
      .update({ used: true })
      .eq("id", invite.id);

    console.log(`[auto-accept][${reqId}] invite_marked_used`);

    /* 7️⃣ AUDIT */
    await supabase.from("audit_logs").insert({
      organization_id: invite.org_id,
      user_id: user.id,
      action: "invite_auto_accepted",
      metadata: { invite_id: invite.id },
    });

    console.log(`[auto-accept][${reqId}] success`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`[auto-accept][${reqId}] fatal_error`, err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
