// APP/app/invite/[token]/page.tsx
import { supabaseServerClient } from "@/lib/supabase/server";
import RegisterFromInvite from "./RegisterFromInvite";
import { redirect } from "next/navigation";

export default async function InvitePage({
  params,
}: {
  params: { token: string };
}) {
  const supabase = supabaseServerClient();
  const token = params.token;

  /* 1️⃣ INVITE FETCH */
  const { data: invite } = await supabase
    .from("invites")
    .select("id, email, token, expires_at")
    .eq("token", token)
    .eq("used", false)
    .maybeSingle();

  /* 2️⃣ INVALID / USED */
  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-card border border-border rounded-xl p-8 max-w-md">
          <h1 className="text-xl font-semibold mb-3">Davet Geçersiz</h1>
          <p className="text-foreground/70">
            Bu davet bulunamadı, süresi dolmuş veya daha önce kullanılmış.
          </p>
        </div>
      </div>
    );
  }

  /* 3️⃣ EXPIRED */
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-card border border-border rounded-xl p-8 max-w-md">
          <h1 className="text-xl font-semibold mb-3">Davet Süresi Dolmuş</h1>
          <p className="text-foreground/70">
            Bu davetin geçerlilik süresi sona ermiştir.
          </p>
        </div>
      </div>
    );
  }

  /* 4️⃣ AUTH CHECK */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  /* 5️⃣ NOT LOGGED IN → REGISTER FLOW */
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <RegisterFromInvite
          invite={{
            email: invite.email!,
            token: invite.token,
          }}
        />
      </div>
    );
  }

  /* 6️⃣ LOGGED IN → AUTO ACCEPT */
  redirect(`/invite/${token}/auto-accept`);
}
