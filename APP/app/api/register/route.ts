// APP/app/api/register/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { fullName, orgName, email, password } = body;

    /* -------------------------------------------------
       1) VALIDATION
    ------------------------------------------------- */
    if (!fullName || !orgName || !email || !password) {
      return NextResponse.json(
        {
          error: "Lütfen tüm alanları doldurun.",
          fieldErrors: {
            fullName: !fullName ? "Ad Soyad zorunludur." : undefined,
            orgName: !orgName ? "Firma adı zorunludur." : undefined,
            email: !email ? "Email adresi zorunludur." : undefined,
            password: !password ? "Şifre zorunludur." : undefined,
          },
        },
        { status: 400 }
      );
    }

    /* -------------------------------------------------
       2) AUTH USER CREATE
    ------------------------------------------------- */
    const { data: userRes, error: userErr } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

    if (userErr || !userRes?.user) {
      // Kullanıcı zaten varsa
      if (userErr?.message?.toLowerCase().includes("already")) {
        return NextResponse.json(
          {
            error: "Bu email adresi zaten kayıtlı.",
            hint: "Lütfen giriş yapmayı deneyin.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error: "Kullanıcı hesabı oluşturulamadı.",
          detail: userErr?.message,
        },
        { status: 400 }
      );
    }

    const user = userRes.user;

    /* -------------------------------------------------
       3) ORGANIZATION CREATE
    ------------------------------------------------- */
    const baseSlug = orgName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const slug = `${baseSlug}-${Date.now()}`;

    const { data: org, error: orgError } = await supabaseAdmin
      .from("organizations")
      .insert({ name: orgName, slug })
      .select()
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        {
          error: "Firma oluşturulurken bir sorun oluştu.",
          hint: "Lütfen firma adını kontrol edip tekrar deneyin.",
        },
        { status: 400 }
      );
    }

    /* -------------------------------------------------
       4) PROFILE CREATE / UPDATE
    ------------------------------------------------- */
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: user.id,
          full_name: fullName,
          organization_id: org.id,
          role: "admin",
          email,
        },
        { onConflict: "id" }
      );

    if (profileError) {
      return NextResponse.json(
        {
          error: "Profil bilgileri oluşturulamadı.",
          hint: "Lütfen tekrar deneyin veya destek ekibiyle iletişime geçin.",
        },
        { status: 400 }
      );
    }

    /* -------------------------------------------------
       5) ORG MEMBER CREATE
    ------------------------------------------------- */
    const { error: memberError } = await supabaseAdmin
      .from("org_members")
      .insert({
        org_id: org.id,
        user_id: user.id,
        role: "admin",
      });

    if (memberError) {
      return NextResponse.json(
        {
          error: "Kullanıcı firmaya bağlanamadı.",
          hint: "Lütfen tekrar deneyin.",
        },
        { status: 400 }
      );
    }

    /* -------------------------------------------------
       6) SUCCESS
    ------------------------------------------------- */
    return NextResponse.json(
      {
        success: true,
        message: "Kayıt başarıyla tamamlandı.",
        nextStep: "Giriş yapabilirsiniz.",
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("REGISTER ERROR:", e);

    return NextResponse.json(
      {
        error: "Beklenmeyen bir sunucu hatası oluştu.",
        hint: "Lütfen birkaç dakika sonra tekrar deneyin.",
      },
      { status: 500 }
    );
  }
}
