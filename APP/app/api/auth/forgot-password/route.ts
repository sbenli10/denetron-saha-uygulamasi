//APP\app\api\auth\forgot-password\route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

/* ================= CLIENTS ================= */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

/* ================= HELPERS ================= */

// Basit email regex (RFC’ye girmiyoruz, yeterli)
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Rate limit (memory-based, edge değilse yeterli)
// Prod’da Redis / KV önerilir
const rateLimitMap = new Map<string, number>();

function checkRateLimit(key: string, limitMs = 60_000) {
  const now = Date.now();
  const last = rateLimitMap.get(key);

  if (last && now - last < limitMs) {
    return false;
  }

  rateLimitMap.set(key, now);
  return true;
}


console.log(process.env.NEXT_PUBLIC_SITE_URL);


/* ================= ROUTE ================= */

export async function POST(req: Request) {
  try {
    /* ---------- BODY ---------- */
    const body = await req.json().catch(() => null);

    if (!body || typeof body.email !== "string") {
      return NextResponse.json(
        { error: "Geçersiz istek." },
        { status: 400 }
      );
    }

    const email = body.email.trim().toLowerCase();

    /* ---------- EMAIL VALIDATION ---------- */
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Geçerli bir e-posta adresi giriniz." },
        { status: 400 }
      );
    }

    /* ---------- RATE LIMIT ---------- */
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ??
      "unknown-ip";

    const rateKey = `${ip}:${email}`;

    if (!checkRateLimit(rateKey)) {
      return NextResponse.json(
        {
          error:
            "Kısa süre içinde çok fazla istek gönderildi. Lütfen biraz bekleyin.",
        },
        { status: 429 }
      );
    }

    /* ---------- SUPABASE RESET LINK ---------- */
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
      },
    });

    // ❗ Enumeration attack önleme:
    // Email sistemde yoksa bile AYNI cevabı döneceğiz
    if (error || !data?.properties?.action_link) {
      return NextResponse.json({
        ok: true,
        message:
          "Eğer bu e-posta adresi sistemimizde kayıtlıysa, şifre sıfırlama bağlantısı gönderilecektir.",
      });
    }

    const resetLink = data.properties.action_link;

   /* ---------- SEND EMAIL ---------- */
    try {
    await resend.emails.send({
        from: "Denetron <onboarding@resend.dev>",
        to: email,
        subject: "Denetron | Şifre Sıfırlama Talebi",
        html: `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Denetron Şifre Sıfırlama</title>
    </head>

    <body style="margin:0;padding:0;background-color:#f4f7fb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
        <tr>
            <td align="center">

            <!-- CARD -->
            <table width="600" cellpadding="0" cellspacing="0"
                style="
                background:#ffffff;
                border-radius:16px;
                box-shadow:0 20px 60px rgba(0,0,0,0.08);
                overflow:hidden;
                font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;
                ">

                <!-- HEADER -->
                <tr>
                <td style="
                    padding:32px 40px;
                    background:linear-gradient(135deg,#2563eb,#1e3a8a);
                ">
                    <h1 style="
                    margin:0;
                    font-size:22px;
                    letter-spacing:1.2px;
                    color:#ffffff;
                    ">
                    DENETRON
                    </h1>
                    <p style="
                    margin:6px 0 0;
                    font-size:13px;
                    color:#dbeafe;
                    ">
                    Secure Account Notification
                    </p>
                </td>
                </tr>

                <!-- BODY -->
                <tr>
                <td style="padding:36px 40px;color:#0f172a;">

                    <h2 style="
                    margin:0 0 14px;
                    font-size:20px;
                    font-weight:600;
                    ">
                    Şifre Sıfırlama Talebi
                    </h2>

                    <p style="
                    margin:0 0 14px;
                    font-size:14px;
                    line-height:1.7;
                    color:#334155;
                    ">
                    Denetron hesabınız için bir <strong>şifre sıfırlama talebi</strong> aldık.
                    Hesabınızın güvenliği için bu işlem yalnızca size özel oluşturulmuş bağlantı
                    üzerinden gerçekleştirilebilir.
                    </p>

                    <p style="
                    margin:0 0 28px;
                    font-size:14px;
                    line-height:1.7;
                    color:#334155;
                    ">
                    Yeni şifrenizi belirlemek için aşağıdaki güvenli butonu kullanabilirsiniz.
                    </p>

                    <!-- CTA BUTTON -->
                    <div style="text-align:center;margin:36px 0;">
                    <a href="${resetLink}"
                        style="
                        display:inline-block;
                        background:linear-gradient(135deg,#2563eb,#1d4ed8);
                        color:#ffffff;
                        padding:16px 34px;
                        border-radius:12px;
                        font-size:14px;
                        font-weight:600;
                        text-decoration:none;
                        letter-spacing:0.3px;
                        box-shadow:
                            0 10px 30px rgba(37,99,235,0.45),
                            inset 0 -2px 0 rgba(255,255,255,0.15);
                        ">
                        Şifreyi Güvenle Sıfırla
                    </a>
                    </div>

                    <p style="
                    margin:0 0 10px;
                    font-size:13px;
                    color:#475569;
                    ">
                    🔒 Bu bağlantı <strong>tek kullanımlıktır</strong> ve sınırlı süre boyunca geçerlidir.
                    </p>

                    <p style="
                    margin:0;
                    font-size:13px;
                    color:#64748b;
                    ">
                    Eğer bu talebi siz oluşturmadıysanız, herhangi bir işlem yapmadan
                    bu e-postayı güvenle yok sayabilirsiniz.
                    </p>
                </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                <td style="
                    background:#f8fafc;
                    padding:20px 40px;
                    border-top:1px solid #e5e7eb;
                    text-align:center;
                ">
                    <p style="
                    margin:0;
                    font-size:11px;
                    color:#64748b;
                    ">
                    © ${new Date().getFullYear()} Denetron<br/>
                    ISO 45001 • KVKK • AES-256
                    </p>
                </td>
                </tr>

            </table>
            <!-- /CARD -->

            </td>
        </tr>
        </table>
    </body>
    </html>
        `,
    });
    } catch (mailErr) {
    console.error("Resend error:", mailErr);
    return NextResponse.json(
        { error: "E-posta gönderilemedi. Lütfen daha sonra tekrar deneyin." },
        { status: 502 }
    );
    }


    /* ---------- SUCCESS ---------- */
    return NextResponse.json({
      ok: true,
      message:
        "Eğer bu e-posta adresi sistemimizde kayıtlıysa, şifre sıfırlama bağlantısı gönderilecektir.",
    });
  } catch (err) {
    console.error("Forgot password fatal error:", err);
    return NextResponse.json(
      { error: "Beklenmeyen bir sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
