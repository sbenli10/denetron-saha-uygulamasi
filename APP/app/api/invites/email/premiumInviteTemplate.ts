//APP\app\api\invites\email\premiumInviteTemplate.ts
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
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" 
    style="background-color:#0f172a;padding:40px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" 
          style="background:#111827;border-radius:14px;padding:40px;color:#f8fafc;">
          
          <!-- LOGO -->
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <div style="font-size:28px;font-weight:700;color:white;">
                Denetron
              </div>
            </td>
          </tr>

          <!-- TITLE -->
          <tr>
            <td style="font-size:22px;font-weight:600;padding-bottom:10px;">
              Organizasyon Daveti
            </td>
          </tr>

          <!-- MESSAGE -->
          <tr>
            <td style="font-size:15px;line-height:1.7;color:#cbd5e1;padding-bottom:28px;">
              <strong>${inviter}</strong> sizi Denetron organizasyonuna
              <strong style="color:#facc15">${role}</strong> rolü ile davet etti.
              <br /><br />
              Hesabınızı oluşturarak veya giriş yaparak organizasyona katılabilirsiniz.
            </td>
          </tr>

          <!-- BUTTON -->
          <tr>
            <td align="center" style="padding-bottom:30px;">
              <a href="${inviteUrl}"
                style="
                  display:inline-block;
                  background:#f59e0b;
                  color:#111827;
                  padding:14px 28px;
                  font-size:15px;
                  font-weight:600;
                  border-radius:8px;
                  text-decoration:none;
                ">
                Daveti Kabul Et
              </a>
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td style="border-bottom:1px solid #1e293b;padding-bottom:25px;"></td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="font-size:13px;color:#64748b;padding-top:25px;line-height:1.6;">
              Bu daveti sen başlatmadıysan bu e-postayı yok sayabilirsin.
              <br />
              Soruların için: <a href="mailto:support@denetron.com" style="color:#3b82f6;text-decoration:none;">support@denetron.com</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
  `;
}
