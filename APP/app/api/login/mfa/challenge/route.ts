//APP\app\api\login\mfa\challenge\route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const reqId = crypto.randomUUID();
  console.log(`🧩 [MFA CHALLENGE] reqId=${reqId}`);

  try {
    const supabase = supabaseServerClient();

    // session var mı?
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      console.log("❌ no session");
      return NextResponse.json({ error: "Auth session missing" }, { status: 401 });
    }

    // factors
    const { data: factors, error: fErr } = await supabase.auth.mfa.listFactors();
    if (fErr) return NextResponse.json({ error: fErr.message }, { status: 400 });

    const totp = factors?.totp?.[0];
    if (!totp) {
      return NextResponse.json({ error: "TOTP factor yok" }, { status: 400 });
    }

    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({
      factorId: totp.id,
    });

    if (cErr || !challenge) {
      return NextResponse.json({ error: cErr?.message ?? "Challenge failed" }, { status: 400 });
    }

    console.log("✅ challengeId=", challenge.id, "factorId=", totp.id);

    return NextResponse.json({ factorId: totp.id, challengeId: challenge.id }, { status: 200 });
  } catch (e: any) {
    console.error("[MFA CHALLENGE ERROR]", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
