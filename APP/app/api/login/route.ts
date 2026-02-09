export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseServerClient, supabaseServiceRoleClient } from "@/lib/supabase/server";
import { parseDevice } from "@/lib/device";
import { rateLimit } from "@/lib/rateLimit";

function hashDevice(agent: string, os: string) {
  return crypto.createHash("sha256").update(`${agent}|${os}`).digest("hex");
}

export async function POST(req: Request) {
  const reqId = crypto.randomUUID();
  console.log(`🔐 [LOGIN] reqId=${reqId}`);

  try {
    const { email, password, rememberMe } = await req.json();

    if (!email || !password) {
      console.log("❌ missing email/password");
      return NextResponse.json({ error: "Email ve şifre zorunlu" }, { status: 400 });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "0.0.0.0";

    // ✅ Rate limit: 10 deneme / 5 dk
    const rl = rateLimit(`login:${ip}:${String(email).toLowerCase()}`, 10, 5 * 60 * 1000);
    if (!rl.ok) {
      console.log("⛔ rate limited", { ip, email });
      return NextResponse.json(
        { error: "Çok fazla deneme. Biraz sonra tekrar deneyin." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.retryAfterMs ?? 0) / 1000)) } }
      );
    }

    

 // 1️⃣ Password login (cookie set edilir)
  const supabase = supabaseServerClient(Boolean(rememberMe));

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  /**
   * ❌ AUTH ERROR
   */
  if (error) {
    console.error("❌ LOGIN ERROR", {
      message: error.message,
      code: error.code,
    });

    return NextResponse.json(
      { error: "Email veya şifre hatalı" },
      { status: 401 }
    );
  }

  /**
   * ❌ USER / SESSION YOK
   */
  if (!data?.user || !data.session) {
    console.error("❌ LOGIN ERROR: INVALID AUTH STATE", {
      hasUser: !!data?.user,
      hasSession: !!data?.session,
    });

    return NextResponse.json(
      { error: "Oturum oluşturulamadı" },
      { status: 401 }
    );
  }

  // 🔒 Buradan sonrası GUARANTEED SAFE
  const user = data.user;
  const session = data.session;

  /**
   * 2️⃣ MFA FACTORS ÇEK
   */
  const { data: mfaFactors, error: mfaErr } =
    await supabase.auth.mfa.listFactors();

  if (mfaErr) {
    console.error("❌ MFA LIST ERROR", {
      message: mfaErr.message,
    });
  }

  /**
   * 3️⃣ SAFE NORMALIZE
   */
  const totpFactors = mfaFactors?.totp ?? [];

  /**
   * 4️⃣ DEBUG LOG (ALTIN DEĞERİNDE)
   */
  console.log("🔎 MFA FACTORS", {
    userId: user.id,
    totpCount: totpFactors.length,
    hasTotp: totpFactors.length > 0,
  });


    console.log("✅ Auth OK userId=", user.id);

    // 2) Org/role + policy
    const admin = supabaseServiceRoleClient();

    const { data: member } = await admin
      .from("org_members")
      .select("org_id, role")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!member) return NextResponse.json({ error: "Organizasyon bulunamadı" }, { status: 403 });

    const { data: orgSettings } = await admin
      .from("org_settings")
      .select("org_id, mfa_required")
      .eq("org_id", member.org_id)
      .maybeSingle();

    const mfaRequiredByOrg = orgSettings?.mfa_required === true;

// 3️⃣ Device hash (tek yerde)
const userAgent = req.headers.get("user-agent") ?? "unknown";
const parsed = parseDevice(userAgent);
const deviceHash = hashDevice(userAgent, parsed.os);

// 4️⃣ Device upsert + session logs
await admin
  .from("devices")
  .upsert(
    {
      user_id: user.id,
      org_id: member.org_id,
      device_hash: deviceHash,
      label: parsed.label,
      platform: parsed.os,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "user_id,device_hash" }
  );

await admin
  .from("device_sessions")
  .update({ is_current: false })
  .eq("user_id", user.id);

await admin.from("device_sessions").insert({
  user_id: user.id,
  org_id: member.org_id,
  session_id: data.session.refresh_token,
  agent: userAgent,
  platform: parsed.os,
  ip,
  is_current: true,
  last_seen_at: new Date().toISOString(),
});

// 5️⃣ MFA STATE — SINGLE SOURCE OF TRUTH
const hasUserMfa = totpFactors.length > 0;
let isTrusted = false;

// 6️⃣ Trusted device check (SADECE MFA varsa)
if (hasUserMfa) {
  const { data: trusted, error: trustedErr } = await admin
    .from("trusted_devices")
    .select("trusted_until")
    .eq("user_id", user.id)
    .eq("device_hash", deviceHash)
    .maybeSingle();

  if (trustedErr) {
    console.warn("⚠️ trusted_devices lookup failed", trustedErr.message);
  }

  if (
    trusted?.trusted_until &&
    new Date(trusted.trusted_until).getTime() > Date.now()
  ) {
    isTrusted = true;
  }
}

// 7️⃣ MFA KARARI (NET VE TEK)
const shouldAskMfa = hasUserMfa && !isTrusted;

console.log("🧠 MFA DECISION", {
  userId: user.id,
  hasUserMfa,
  isTrusted,
  mfaRequiredByOrg,
  shouldAskMfa,
});

// 🔐 MFA GEREKİYOR → OTP
if (shouldAskMfa) {
  return NextResponse.json(
    {
      ok: true,
      mfaRequired: true,
      role: member.role,
      orgId: member.org_id,
    },
    { status: 200 }
  );
}

// ✅ MFA GEREKMİYOR → COOKIE YAZ
const res = NextResponse.json(
  {
    ok: true,
    mfaRequired: false,
    role: member.role,
    orgId: member.org_id,
  },
  { status: 200 }
);

res.cookies.set("mfa_ok", "1", {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 2,
});

console.log("✅ Login completed (MFA skipped)");
return res;

} catch (err) {
  console.error("[LOGIN ERROR]", err);
  return NextResponse.json(
    { error: "Internal Server Error" },
    { status: 500 }
  );
}

}
