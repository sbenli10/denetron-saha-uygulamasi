// APP/app/api/login/mfa/verify/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  supabaseServerClient,
  supabaseServiceRoleClient,
} from "@/lib/supabase/server";
import { parseDevice } from "@/lib/device";

/**
 * 🔐 Device hash — TEK KAYNAK
 */
function hashDevice(agent: string, os: string) {
  return crypto
    .createHash("sha256")
    .update(`${agent}|${os}`)
    .digest("hex");
}

export async function POST(req: Request) {
  const reqId = crypto.randomUUID();
  console.log(`✅ [MFA VERIFY] reqId=${reqId}`);

  try {
    const { factorId, challengeId, code, rememberMe, trustDevice } =
      await req.json();

    if (!factorId || !challengeId || !code) {
      return NextResponse.json(
        { error: "Eksik parametre" },
        { status: 400 }
      );
    }

    const supabase = supabaseServerClient(Boolean(rememberMe));

    /**
     * 1️⃣ SESSION CHECK
     */
    const { data: sessionRes } = await supabase.auth.getSession();
    if (!sessionRes.session) {
      return NextResponse.json(
        { error: "Oturum bulunamadı" },
        { status: 401 }
      );
    }

    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) {
      return NextResponse.json(
        { error: "Yetkisiz işlem" },
        { status: 401 }
      );
    }

    const user = userRes.user;

    /**
     * 2️⃣ MFA VERIFY
     */
    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code: String(code).trim(),
    });

    if (verifyErr) {
      return NextResponse.json(
        { error: "Doğrulama kodu hatalı" },
        { status: 401 }
      );
    }

    /**
     * 3️⃣ ORGANIZATION + ROLE CHECK
     */
    const admin = supabaseServiceRoleClient();

    const { data: member } = await admin
      .from("org_members")
      .select("org_id, role")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();

    const hasOrganization = !!member?.org_id;
    const userRole =
      member?.role === "admin" ? "admin" : "operator";

    /**
     * 4️⃣ DEVICE HASH
     */
    const userAgent = req.headers.get("user-agent") ?? "unknown";
    const parsed = parseDevice(userAgent);
    const deviceHash = hashDevice(userAgent, parsed.os);

    /**
     * 5️⃣ TRUSTED DEVICE (OPSİYONEL)
     */
    if (trustDevice === true && hasOrganization) {
      const trustedUntil = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      try {
        await admin.from("trusted_devices").upsert(
          {
            user_id: user.id,
            org_id: member!.org_id,
            device_hash: deviceHash,
            trusted_until: trustedUntil,
          },
          { onConflict: "user_id,org_id,device_hash" }
        );

        console.log("🟢 Trusted device saved", {
          userId: user.id,
          orgId: member!.org_id,
        });
      } catch (err: any) {
        console.warn(
          "⚠️ Trusted device write failed",
          err?.message
        );
      }
    }

    /**
     * 6️⃣ RESPONSE
     */
    const res = NextResponse.json(
      {
        ok: true,
        role: userRole,
        noOrganization: !hasOrganization,
      },
      { status: 200 }
    );

    /**
     * 7️⃣ COOKIES
     */
    res.cookies.set("mfa_ok", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: rememberMe
        ? 60 * 60 * 24 * 30
        : 60 * 60 * 2,
    });

    res.cookies.set("device_hash", deviceHash, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    console.log("✅ MFA verified fully", {
      userId: user.id,
      role: userRole,
      hasOrganization,
    });

    return res;
  } catch (err: any) {
    console.error("❌ [MFA VERIFY ERROR]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
