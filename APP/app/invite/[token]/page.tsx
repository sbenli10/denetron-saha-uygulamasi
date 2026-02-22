export const dynamic = "force-dynamic";

import { supabaseServerClient } from "@/lib/supabase/server";
import RegisterFromInvite from "./RegisterFromInvite";
import { redirect } from "next/navigation";
import { ShieldAlert, Clock, MailIcon } from "lucide-react";

export default async function InvitePage({
  params,
}: {
  params: { token: string };
}) {
  const supabase = supabaseServerClient();
  const token = params.token;
  const now = new Date().toISOString();

  console.log("--- [DEBUG] INVITE PAGE STARTED ---");
  console.log("1. Gelen Token:", token);
  console.log("2. Sistem Zamanı (now):", now);

  /* 1️⃣ INVITE FETCH */
  // Önce kısıtlama olmadan datayı çekelim ki neden elendiğini loglayabilelim
  const { data: rawInvite, error: fetchError } = await supabase
    .from("invites")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (fetchError) {
    console.error("❌ SQL Hatası:", fetchError.message);
  }

  if (!rawInvite) {
    console.log("❌ SONUÇ: Veritabanında bu token ile eşleşen hiçbir kayıt yok.");
  } else {
    console.log("✅ Kayıt Bulundu:", {
      email: rawInvite.email,
      used: rawInvite.used,
      expires_at: rawInvite.expires_at,
    });

    // Filtreleme mantığını manuel kontrol edelim
    const isUsed = rawInvite.used === true;
    const isExpired = new Date(rawInvite.expires_at) < new Date();
    
    console.log(`3. Durum Analizi: Used=${isUsed}, Expired=${isExpired}`);
    
    if (isUsed) console.log("⚠️ Red Sebebi: Davet daha önce kullanılmış (used: true).");
    if (isExpired) console.log("⚠️ Red Sebebi: Davet süresi dolmuş (expires_at < now).");
  }

  // Orijinal filtreleme mantığına göre son kontrol
  const { data: invite } = await supabase
    .from("invites")
    .select("id, email, token, expires_at")
    .eq("token", token)
    .eq("used", false)
    .gt("expires_at", now)
    .maybeSingle();

  /* 2️⃣ HATA EKRANI */
  if (!invite) {
    console.log("4. İşlem Durumu: Davet geçersiz sayıldı, hata ekranı basılıyor.");
    console.log("--- [DEBUG] INVITE PAGE END ---");
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6 text-white font-sans">
        <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl text-center space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
            <ShieldAlert className="text-red-500" size={40} />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Erişim Geçersiz</h1>
            <p className="text-white/60 text-sm leading-relaxed">
              Bu davet bağlantısı artık aktif değil. Bağlantı süresi dolmuş veya daha önce kullanılmış olabilir.
            </p>
          </div>

          <div className="pt-4 border-t border-white/5">
            <p className="text-[11px] text-white/30 uppercase tracking-[0.2em] mb-4">Ne yapmalısınız?</p>
            <div className="flex flex-col gap-2">
              <a href="mailto:support@denetron.me" className="bg-white/5 hover:bg-white/10 text-xs py-3 rounded-xl transition-all border border-white/10 flex items-center justify-center gap-2 font-medium">
                <MailIcon size={14} /> Yönetici ile İletişime Geç
              </a>
              <a href="/login" className="text-xs text-blue-400 hover:text-blue-300 transition-colors py-2">
                Sisteme giriş yapmayı deneyin
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* 3️⃣ AUTH CHECK */
  const { data: { user } } = await supabase.auth.getUser();
  console.log("5. Auth Durumu:", user ? `Giriş yapmış (${user.email})` : "Giriş yok");

  /* 4️⃣ KAYIT EKRANI */
  if (!user) {
    console.log("6. Yönlendirme: Kayıt formu (RegisterFromInvite) gösteriliyor.");
    console.log("--- [DEBUG] INVITE PAGE END ---");
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none bg-[radial-gradient(circle_at_50%_-20%,#3b82f6,transparent_50%)]" />
        
        <div className="relative z-10 w-full max-w-md animate-in slide-in-from-bottom-8 duration-700 ease-out">
          <header className="text-center mb-8">
            <h2 className="text-white text-[10px] uppercase tracking-[0.4em] font-bold mb-2 opacity-50">Organizasyon Daveti</h2>
            <h1 className="text-4xl font-extrabold text-white tracking-tighter">DENETRON</h1>
          </header>

          <RegisterFromInvite
            invite={{
              email: invite.email!,
              token: invite.token,
            }}
          />
          
          <footer className="mt-8 text-center border-t border-white/5 pt-6">
            <div className="flex items-center justify-center gap-4 text-white/30 text-[10px] font-medium tracking-widest uppercase">
              <span className="flex items-center gap-1.5"><Clock size={12} /> Tek Kullanımlık</span>
              <span className="w-1 h-1 bg-white/10 rounded-full" />
              <span>AES-256 Uçtan Uca Güvenli</span>
            </div>
          </footer>
        </div>
      </div>
    );
  }

  /* 5️⃣ LOGGED IN → AUTO ACCEPT */
  console.log("6. Yönlendirme: Mevcut oturum ile auto-accept'e gidiliyor.");
  console.log("--- [DEBUG] INVITE PAGE END ---");
  redirect(`/invite/${token}/auto-accept`);
}