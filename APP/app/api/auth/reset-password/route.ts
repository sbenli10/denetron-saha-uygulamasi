// APP/app/api/auth/reset-password/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/app/lib/rateLimit";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getIP(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

// 🔐 Strong password policy
function validatePassword(pw: string) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pw);
}

export async function POST(req: Request) {
  try {
    const ip = getIP(req);

    // 🔒 1 dakikada 5 deneme
    const rl = rateLimit(`reset:${ip}`, 5, 60_000);

    if (!rl.ok) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests" }),
        {
          status: 429,
          headers: {
            "retry-after": String(
              Math.ceil((rl.retryAfterMs ?? 0) / 1000)
            ),
          },
        }
      );
    }

    const { password, accessToken } = await req.json();

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Geçersiz şifre" },
        { status: 400 }
      );
    }

    // 🔐 Strong validation
    if (!validatePassword(password)) {
      return NextResponse.json(
        {
          error:
            "Şifre en az 8 karakter, bir büyük harf ve bir rakam içermelidir.",
        },
        { status: 400 }
      );
    }

    if (!accessToken || typeof accessToken !== "string") {
      return NextResponse.json(
        { error: "Oturum doğrulanamadı" },
        { status: 401 }
      );
    }

    // 🔐 Recovery session doğrulama
    const { data: userData, error: userError } =
      await supabase.auth.getUser(accessToken);

    if (userError || !userData?.user) {
      return NextResponse.json(
        { error: "Geçersiz veya süresi dolmuş bağlantı" },
        { status: 401 }
      );
    }

    // 🔑 Şifreyi güncelle
    const { error: updateError } =
      await supabase.auth.admin.updateUserById(
        userData.user.id,
        { password }
      );

    if (updateError) {
      console.error("Password update error:", updateError);
      return NextResponse.json(
        { error: "Şifre güncellenemedi." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}
