//APP\app\reset-password\page.tsx
"use client";

import { useState,useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Lock,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function ResetPasswordPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    setLoading(true);

    useEffect(() => {
      const hash = window.location.hash;
      if (!hash) return;
    
      const params = new URLSearchParams(hash.substring(1));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
    
      if (access_token && refresh_token) {
        supabase.auth.setSession({
          access_token,
          refresh_token,
        });
      }
    }, []);

    try {
      // ✅ await ARTIK doğru yerde
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError("Oturum doğrulanamadı veya süresi dolmuş.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          accessToken: session.access_token,
        }),
      });

      const out = await res.json();

      if (!res.ok) {
        setError(out.error || "Şifre güncellenemedi.");
        setLoading(false);
        return;
      }

      setSuccess(true);

      setTimeout(() => {
        router.replace("/login");
      }, 2000);
    } catch {
      setError("Sunucu hatası oluştu.");
      setLoading(false);
    }
  }

  

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#04060d] text-white px-6">
      <div className="w-full max-w-md">
        <div className="p-[1.5px] rounded-3xl bg-gradient-to-br from-blue-500/50 via-cyan-400/20 to-transparent">
          <div className="rounded-3xl bg-black/65 backdrop-blur-2xl border border-white/10 p-10">

            <header className="text-center mb-8">
              <h1 className="text-3xl font-semibold">DENETRON</h1>
              <p className="text-sm text-white/60">
                Yeni şifrenizi belirleyin
              </p>
            </header>

            {success ? (
              <div className="text-center space-y-4">
                <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />
                <p>Şifreniz başarıyla güncellendi.</p>
                <p className="text-xs text-white/50">
                  Giriş sayfasına yönlendiriliyorsunuz…
                </p>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-5">

                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-4 py-3 rounded-xl">
                    <AlertTriangle size={18} />
                    {error}
                  </div>
                )}

                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-white/40" />
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Yeni şifre"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-white/10 border border-white/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-white/40" />
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Yeni şifre (tekrar)"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full pl-12 pr-3 py-3.5 rounded-xl bg-white/10 border border-white/20"
                    required
                  />
                </div>

                <button
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 transition"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    "Şifreyi Güncelle"
                  )}
                </button>
              </form>
            )}

            <footer className="mt-6 text-xs text-white/50 text-center">
              ISO 45001 • KVKK • AES-256
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
