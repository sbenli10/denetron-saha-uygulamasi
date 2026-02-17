// APP/app/api/invites/send/route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";
import crypto from "crypto";
import { Resend } from "resend";
import { premiumInviteTemplate } from "../email/premiumInviteTemplate";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  console.log(`[invites][${requestId}] started`);

  try {
    const supabase = supabaseServerClient();
    const body = await req.json();

    const { email, role_id, orgId, channel = "email" } = body;

    /* ---------------- VALIDATION ---------------- */
    if (!email || !role_id || !orgId) {
      return NextResponse.json(
        { error: "email, role_id ve orgId zorunlu" },
        { status: 400 }
      );
    }

    /* ---------------- AUTH ---------------- */
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const inviterName =
      user.user_metadata?.full_name || user.email || "Bir yönetici";

    /* ---------------- ADMIN CHECK ---------------- */
    const { data: member } = await supabase
      .from("org_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("org_id", orgId)
      .maybeSingle();

    if (!member || member.role !== "admin") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    /* ---------------- ROLE NAME ---------------- */
    const { data: role } = await supabase
      .from("roles")
      .select("name")
      .eq("id", role_id)
      .single();

    /* ---------------- ACTIVE INVITE CHECK ---------------- */
    const { data: existingInvite } = await supabase
      .from("invites")
      .select("id")
      .eq("org_id", orgId)
      .eq("email", email.toLowerCase())
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (existingInvite) {
      return NextResponse.json(
        { error: "Bu e-posta için aktif bir davet zaten var." },
        { status: 409 }
      );
    }

    /* ---------------- CREATE INVITE ---------------- */
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const { error: insertError } = await supabase.from("invites").insert({
      email: email.toLowerCase(),
      org_id: orgId,
      role_id,
      invited_by: user.id,
      token,
      used: false,
      expires_at: expiresAt,
    });

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 400 }
      );
    }

    /* ---------------- AUDIT ---------------- */
    await supabase.from("audit_logs").insert({
      organization_id: orgId,
      user_id: user.id,
      action: "invite_sent",
      metadata: { email, role_id },
    });

    /* ---------------- EMAIL ---------------- */
    if (channel === "email") {
      const inviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/invite/${token}`;

      const { data, error: emailError } = await resend.emails.send({
        from: 'no-reply@denetron.me',
        to: email,
        subject: "Denetron Organizasyon Daveti",
        html: premiumInviteTemplate({
          inviter: inviterName,
          inviteUrl,
          role: role?.name ?? "Üye",
        }),
      });
      
      console.log("RESEND KEY EXISTS:", !!process.env.RESEND_API_KEY);

      if (emailError) {
        await supabase
          .from("invites")
          .delete()
          .eq("token", token);

        return NextResponse.json(
          { error: "Email gönderilemedi" },
          { status: 500 }
        );
      }


    }

    console.log(`[invites][${requestId}] success`);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(`[invites][${requestId}] error`, err);
    return NextResponse.json(
      { error: "invite_failed" },
      { status: 500 }
    );
  }
}
