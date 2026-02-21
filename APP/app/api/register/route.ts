//APP\app\api\register\route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Resend } from 'resend'; // 1. Import edin
type RegisterBody = {
  fullName: string;
  orgName: string;
  email: string;
  password: string;
};

const resend = new Resend(process.env.RESEND_API_KEY); // 2. Initialize edin

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
   /* -------------------------------------------------
       5.5) PROFESYONEL HOŞ GELDİN MAİLİ (RESEND)
    ------------------------------------------------- */
    try {
      await resend.emails.send({
        from: 'Denetron <no-reply@denetron.me>',
        to: email,
        subject: `Denetron | Hoş Geldiniz, ${fullName} 🚀`,
        html: `
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Denetron'a Hoş Geldiniz</title>
        </head>
        <body style="margin:0;padding:0;background-color:#f4f7fb;">
            <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
            <tr>
                <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" 
                    style="background:#ffffff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.08);overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
                    
                    <tr>
                    <td style="padding:32px 40px;background:linear-gradient(135deg,#2563eb,#1e3a8a);">
                        <h1 style="margin:0;font-size:22px;letter-spacing:1.2px;color:#ffffff;">DENETRON</h1>
                        <p style="margin:6px 0 0;font-size:13px;color:#dbeafe;">Dijital İSG Yönetim Platformu</p>
                    </td>
                    </tr>

                    <tr>
                    <td style="padding:36px 40px;color:#0f172a;">
                        <h2 style="margin:0 0 14px;font-size:20px;font-weight:600;">Aramıza Hoş Geldiniz!</h2>
                        <p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#334155;">
                            Merhaba <strong>${fullName}</strong>,
                        </p>
                        <p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#334155;">
                            <strong>${orgName}</strong> adına oluşturduğunuz organizasyon yöneticisi hesabınız başarıyla aktive edildi. Denetron ile İSG süreçlerinizi dijitalleştirme yolunda ilk adımı attınız.
                        </p>

                        <div style="text-align:center;margin:36px 0;">
                        <a href="https://denetron.me/login"
                            style="display:inline-block;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#ffffff;padding:16px 34px;border-radius:12px;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.3px;box-shadow:0 10px 30px rgba(37,99,235,0.45),inset 0 -2px 0 rgba(255,255,255,0.15);">
                            Hemen Başlayın
                        </a>
                        </div>

                        <p style="margin:0 0 10px;font-size:13px;color:#475569;">
                            🔒 Hesabınız ISO 45001 standartlarına uygun olarak korunmaktadır.
                        </p>
                        <p style="margin:20px 0 0;font-size:13px;color:#64748b;">
                            Daha güvenli bir çalışma ortamı dileğiyle,<br/><strong>Denetron Ekibi</strong>
                        </p>
                    </td>
                    </tr>

                    <tr>
                    <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
                        <p style="margin:0;font-size:11px;color:#64748b;">
                            © ${new Date().getFullYear()} Denetron<br/>ISO 45001 • KVKK • AES-256
                        </p>
                    </td>
                    </tr>
                </table>
                </td>
            </tr>
            </table>
        </body>
        </html>
        `,
      });
    } catch (mailError) {
      console.error("WELCOME EMAIL SEND ERROR:", mailError);
      // Mail hatası, kullanıcının kayıt sürecini kesmemeli
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

