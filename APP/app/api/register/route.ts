//APP\app\api\register\route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type RegisterBody = {
  fullName: string;
  orgName: string;
  email: string;
  password: string;
};

export async function POST(req: Request) {
  try {
    /* -------------------------------------------------
       0) BODY PARSE & BASIC VALIDATION
    ------------------------------------------------- */
    let body: RegisterBody;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Geçersiz istek formatı." },
        { status: 400 }
      );
    }

    const { fullName, orgName, email, password } = body;

    if (!fullName || !orgName || !email || !password) {
      return NextResponse.json(
        {
          error: "Zorunlu alanlar eksik.",
          fields: {
            fullName: !fullName ? "Ad Soyad zorunludur." : undefined,
            orgName: !orgName ? "Firma adı zorunludur." : undefined,
            email: !email ? "Email zorunludur." : undefined,
            password: !password ? "Şifre zorunludur." : undefined,
          },
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          error: "Şifre çok kısa.",
          hint: "Şifre en az 6 karakter olmalıdır.",
        },
        { status: 400 }
      );
    }

    /* -------------------------------------------------
       1) EXISTING PROFILE CHECK (BUSINESS RULE)
       - Davetli mi?
       - Başka org’a bağlı mı?
    ------------------------------------------------- */
    const { data: existingProfile, error: profileCheckError } =
      await supabaseAdmin
        .from("profiles")
        .select("id, organization_id")
        .eq("email", email)
        .maybeSingle();

    if (profileCheckError) {
      return NextResponse.json(
        {
          error: "Kullanıcı kontrolü başarısız.",
          hint: "Lütfen daha sonra tekrar deneyin.",
        },
        { status: 500 }
      );
    }

    if (existingProfile?.organization_id) {
      return NextResponse.json(
        {
          error: "Bu email zaten bir organizasyona bağlı.",
          hint:
            "Yeni organizasyon oluşturamazsınız. Lütfen giriş yapın veya davet bağlantısı kullanın.",
        },
        { status: 409 }
      );
    }

    /* -------------------------------------------------
       2) AUTH USER CREATE
    ------------------------------------------------- */
    const { data: authRes, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
      });

    if (authError || !authRes?.user) {
      const msg = authError?.message?.toLowerCase() || "";

      if (msg.includes("already")) {
        return NextResponse.json(
          {
            error: "Bu email adresi zaten kayıtlı.",
            hint: "Giriş yapmayı deneyin veya şifrenizi sıfırlayın.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error: "Kullanıcı hesabı oluşturulamadı.",
          detail: authError?.message,
        },
        { status: 400 }
      );
    }

    const user = authRes.user;

    /* -------------------------------------------------
       3) ORGANIZATION CREATE
    ------------------------------------------------- */
    const slugBase = orgName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const slug = `${slugBase}-${Date.now()}`;

    const { data: org, error: orgError } = await supabaseAdmin
      .from("organizations")
      .insert({
        name: orgName,
        slug,
      })
      .select()
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        {
          error: "Organizasyon oluşturulamadı.",
          hint: "Firma adını kontrol edip tekrar deneyin.",
        },
        { status: 400 }
      );
    }

    /* -------------------------------------------------
    3.5) ORG SUBSCRIPTION CREATE (DEFAULT: FREE)
  ------------------------------------------------- */
  const { error: subError } = await supabaseAdmin
    .from("org_subscriptions")
    .insert({
      org_id: org.id,
      plan: "free",
      status: "active",
      trial_used: false,
      started_at: new Date().toISOString(),
      expires_at: null,
    });

  if (subError) {
    return NextResponse.json(
      {
        error: "Abonelik kaydı oluşturulamadı.",
        hint: "Lütfen destek ekibiyle iletişime geçin.",
      },
      { status: 500 }
    );
  }


    /* -------------------------------------------------
       4) PROFILE UPSERT (ADMIN)
    ------------------------------------------------- */
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email,
          full_name: fullName,
          role: "admin",
          organization_id: org.id,
        },
        { onConflict: "id" }
      );

    if (profileError) {
      return NextResponse.json(
        {
          error: "Profil oluşturulamadı.",
          hint: "Lütfen destek ekibiyle iletişime geçin.",
        },
        { status: 500 }
      );
    }

    /* -------------------------------------------------
       5) ORG MEMBER INSERT (ADMIN)
       - UNIQUE (user_id, org_id) DB constraint önerilir
    ------------------------------------------------- */
    const { error: memberError } = await supabaseAdmin
      .from("org_members")
      .insert({
        user_id: user.id,
        org_id: org.id,
        role: "admin",
      });

    if (memberError) {
      return NextResponse.json(
        {
          error: "Kullanıcı organizasyona bağlanamadı.",
          hint: "Lütfen tekrar deneyin.",
        },
        { status: 500 }
      );
    }

    /* -------------------------------------------------
       6) SUCCESS
    ------------------------------------------------- */
    return NextResponse.json(
      {
        success: true,
        message: "Organizasyon ve yönetici hesabı başarıyla oluşturuldu.",
        nextStep: "Giriş yapabilirsiniz.",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("REGISTER ROUTE ERROR:", err);

    return NextResponse.json(
      {
        error: "Beklenmeyen sunucu hatası.",
        hint: "Lütfen birkaç dakika sonra tekrar deneyin.",
      },
      { status: 500 }
    );
  }
}
