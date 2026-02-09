export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseServerClient, supabaseServiceRoleClient } from "@/lib/supabase/server";
import { parseDevice } from "@/lib/device";

function hashDevice(agent: string, os: string) {
  return crypto.createHash("sha256").update(`${agent}|${os}`).digest("hex");
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
     * 1️⃣ SESSION HARD CHECK
     */
    const { data: sessionRes } = await supabase.auth.getSession();
    if (!sessionRes.session) {
      console.warn("❌ MFA VERIFY: session missing");
      return NextResponse.json(
        { error: "Oturum bulunamadı" },
        { status: 401 }
      );
    }

    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) {
      console.warn("❌ MFA VERIFY: user missing");
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
      console.warn("❌ MFA VERIFY FAILED", {
        userId: user.id,
        message: verifyErr.message,
      });

      return NextResponse.json(
        { error: "Doğrulama kodu hatalı" },
        { status: 401 }
      );
    }

    /**
     * 3️⃣ TRUSTED DEVICE (OPSİYONEL)
     */
    if (trustDevice === true) {
      const admin = supabaseServiceRoleClient();

      try {
        const userAgent = req.headers.get("user-agent") ?? "unknown";
        const parsed = parseDevice(userAgent);
        const deviceHash = hashDevice(userAgent, parsed.os);

        const trustedUntil = new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 gün
        ).toISOString();

        await admin.from("trusted_devices").upsert(
          {
            user_id: user.id,
            device_hash: deviceHash,
            trusted_until: trustedUntil,
          },
          { onConflict: "user_id,device_hash" }
        );

        console.log("🟢 Trusted device saved", {
          userId: user.id,
          deviceHash,
          trustedUntil,
        });
      } catch (err: any) {
        // ❗ trusted device yazılamasa bile login'i bozma
        console.warn("⚠️ Trusted device write failed", err?.message);
      }
    }

    /**
     * 4️⃣ MFA OK COOKIE
     */
    const res = NextResponse.json({ ok: true }, { status: 200 });

    res.cookies.set("mfa_ok", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: rememberMe
        ? 60 * 60 * 24 * 30 // 30 gün
        : 60 * 60 * 2,     // 2 saat
    });

    console.log("✅ MFA verified + mfa_ok cookie set", {
      userId: user.id,
      trustDevice: trustDevice === true,
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

