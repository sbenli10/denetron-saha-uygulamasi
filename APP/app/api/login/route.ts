// app/api/login/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import crypto from "crypto";

import {
  supabaseServerClient,
  supabaseServiceRoleClient,
} from "@/lib/supabase/server";

import { parseDevice } from "@/lib/device";

/* =====================================================
 * DEVICE HASH
 * ===================================================== */
function hashDevice(agent: string, os: string) {
  return crypto
    .createHash("sha256")
    .update(`${agent}|${os}`)
    .digest("hex");
}

/* =====================================================
 * LOGIN
 * ===================================================== */
export async function POST(req: Request) {
  try {
    const { email, password, rememberMe } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email ve şifre zorunlu" },
        { status: 400 }
      );
    }

    /* ================= AUTH ================= */
    const supabase = supabaseServerClient(Boolean(rememberMe));

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error || !data?.user || !data.session) {
      return NextResponse.json(
        { error: "Email veya şifre hatalı" },
        { status: 401 }
      );
    }

    const user = data.user;
    const session = data.session;

    /* ================= ORG / MEMBER ================= */
    const admin = supabaseServiceRoleClient();

    const { data: member } = await admin
      .from("org_members")
      .select("org_id, role")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!member) {
      return NextResponse.json(
        { error: "Organizasyon bulunamadı" },
        { status: 403 }
      );
    }

    /* ================= DEVICE ================= */
    const userAgent =
      req.headers.get("user-agent") ?? "unknown";

    const parsed = parseDevice(userAgent);
    const deviceHash = hashDevice(userAgent, parsed.os);

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ??
      req.headers.get("x-real-ip") ??
      "0.0.0.0";

    // ✅ CİHAZ UPSERT (TEK SATIR)
    await admin
      .from("devices")
      .upsert(
        {
          user_id: user.id,
          org_id: member.org_id,
          device_hash: deviceHash,
          label: parsed.label,        // Chrome · Windows
          platform: parsed.os,        // Windows
          last_seen_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,device_hash",
        }
      );

    /* ================= SESSIONS ================= */

    // 🔴 Eski session'ları pasif yap
    await admin
      .from("device_sessions")
      .update({ is_current: false })
      .eq("user_id", user.id);

    // 🟢 Yeni session
    await admin
      .from("device_sessions")
      .insert({
        user_id: user.id,
        org_id: member.org_id,
        session_id: session.refresh_token, // KRİTİK
        agent: userAgent,
        platform: parsed.os,
        ip,
        is_current: true,
        last_seen_at: new Date().toISOString(),
      });

    /* ================= OK ================= */
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      orgId: member.org_id,
      role: member.role,
    });
  } catch (err) {
    console.error("[LOGIN ERROR]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
