export function premiumInviteTemplate({
  inviter,
  inviteUrl,
  role,
}: {
  inviter: string;
  inviteUrl: string;
  role: string;
}) {
  return `
  <!DOCTYPE html>
  <html lang="tr">
  <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Denetron Organizasyon Daveti</title>
  </head>

  <body style="margin:0;padding:0;background-color:#f4f7fb;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
      <tr>
          <td align="center">

          <table width="600" cellpadding="0" cellspacing="0"
              style="
              background:#ffffff;
              border-radius:16px;
              box-shadow:0 20px 60px rgba(0,0,0,0.08);
              overflow:hidden;
              font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;
              ">

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
                  Organizasyon ve Ekip Yönetimi
                  </p>
              </td>
              </tr>

              <tr>
              <td style="padding:36px 40px;color:#0f172a;">

                  <h2 style="
                  margin:0 0 14px;
                  font-size:20px;
                  font-weight:600;
                  ">
                  Ekibe Katılmaya Davet Edildiniz
                  </h2>

                  <p style="
                  margin:0 0 14px;
                  font-size:14px;
                  line-height:1.7;
                  color:#334155;
                  ">
                  <strong>${inviter}</strong>, sizi Denetron üzerindeki organizasyonuna 
                  <strong style="color:#2563eb;">${role}</strong> rolü ile katılmaya davet etti.
                  </p>

                  <p style="
                  margin:0 0 28px;
                  font-size:14px;
                  line-height:1.7;
                  color:#334155;
                  ">
                  Denetron'un profesyonel denetim ve saha yönetimi araçlarını kullanmaya başlamak için 
                  aşağıdaki güvenli bağlantıyı kullanarak hesabınızı oluşturabilir veya giriş yapabilirsiniz.
                  </p>

                  <div style="text-align:center;margin:36px 0;">
                  <a href="${inviteUrl}"
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
                      Daveti Kabul Et ve Başla
                  </a>
                  </div>

                  <p style="
                  margin:0 0 10px;
                  font-size:13px;
                  color:#475569;
                  ">
                  🔒 Bu davet bağlantısı <strong>48 saat</strong> boyunca geçerlidir.
                  </p>

                  <p style="
                  margin:0;
                  font-size:13px;
                  color:#64748b;
                  ">
                  Eğer bu organizasyon hakkında bilginiz yoksa, bu e-postayı güvenle yok sayabilirsiniz.
                  </p>
              </td>
              </tr>

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
                  ISO 45001 • KVKK • AES-256<br/>
                  Sorularınız için: <a href="mailto:support@denetron.me" style="color:#2563eb;text-decoration:none;">support@denetron.me</a>
                  </p>
              </td>
              </tr>

          </table>
          </td>
      </tr>
      </table>
  </body>
  </html>
  `;
}