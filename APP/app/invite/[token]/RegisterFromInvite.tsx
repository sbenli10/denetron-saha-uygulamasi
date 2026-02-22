"use client";

import { useState } from "react";
import { User, Lock, Loader2, ChevronRight, Mail } from "lucide-react";
import type { InviteView } from "./types";

export default function RegisterFromInvite({
  invite,
}: {
  invite: InviteView;
}) {
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister() {
    setLoading(true);
    setError("");

    try {
      const resSignup = await fetch("/api/invites/register-from-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: invite.token,
          email: invite.email,
          password,
          fullName,
        }),
      });

      const result = await resSignup.json();

      if (!resSignup.ok) {
        setError(result.error || "Hesap oluşturulamadı.");
        setLoading(false);
        return;
      }

      window.location.href = "/post-auth-redirect";
    } catch (err) {
      setError("Sunucuya ulaşılamıyor. Lütfen bağlantınızı kontrol edin.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-white tracking-tight">Kayıt işlemini tamamla</h1>
        <div className="flex items-center gap-2 text-white/40 text-xs">
          <Mail size={12} />
          <span>{invite.email}</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Ad Soyad Input */}
        <div className="relative group">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Ad Soyad"
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/20 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        {/* Şifre Input */}
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input
            type="password"
            placeholder="Şifre belirleyin"
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/20 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center animate-shake">
          {error}
        </div>
      )}

      <button
        onClick={handleRegister}
        disabled={loading || !fullName || !password}
        className="group relative w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-blue-800 disabled:to-blue-900 text-white rounded-xl font-semibold shadow-[0_10px_20px_-10px_rgba(37,99,235,0.5)] transition-all flex items-center justify-center gap-2 overflow-hidden"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            Hesabı Oluştur ve Katıl
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>

      <p className="text-center text-[10px] text-white/20 uppercase tracking-widest font-medium">
        Hüküm ve koşulları kabul etmiş sayılırsınız
      </p>
    </div>
  );
}