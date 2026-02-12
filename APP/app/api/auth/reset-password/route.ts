//APP\app\api\auth\reset-password\route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { password, accessToken } = await req.json();

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Geçersiz şifre" },
        { status: 400 }
      );
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: "Oturum doğrulanamadı" },
        { status: 401 }
      );
    }

    // 🔐 Recovery session ile kullanıcıyı bağla
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
      return NextResponse.json(
        { error: updateError.message },
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
