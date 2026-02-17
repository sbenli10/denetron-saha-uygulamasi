// APP/app/reset-password/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

type Strength = { score: 0 | 1 | 2 | 3; label: string };

function scorePassword(pw: string): Strength {
  if (!pw) return { score: 0, label: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score = Math.min(3, score + 1);
  const label = score <= 1 ? "Zayıf" : score === 2 ? "Orta" : "Güçlü";
  return { score: score as 0 | 1 | 2 | 3, label };
}

function validatePassword(pw: string) {
  // minimum: 8 + küçük + büyük + rakam
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pw);
}

export default function ResetPasswordPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [initializing, setInitializing] = useState(true);
  const [tokenOk, setTokenOk] = useState<boolean | null>(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [error, setError] = useState("");
  const [pwnedCount, setPwnedCount] = useState<number | null>(null);
  const [pwnedChecking, setPwnedChecking] = useState(false);

  const strength = useMemo(() => scorePassword(password), [password]);

  // --- Token initialization (hash -> setSession) + expiration UX
useEffect(() => {
  const init = async () => {
    // Supabase hash'i otomatik işler
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      setTokenOk(false);
      setInitializing(false);
      return;
    }

    setTokenOk(true);
    setInitializing(false);
  };

  init();
}, [supabase]);



  // --- Pwned password check (debounced) via server route (k-anonymity)
  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    setPwnedCount(null);
    setError((e) => (e && e.startsWith("Bu şifre") ? "" : e));

    if (!password || password.length < 8) return;

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      setPwnedChecking(true);
      try {
        const res = await fetch("/api/security/pwned-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });

        // Rate limit UX (server decides)
        if (res.status === 429) {
          const retryAfter = res.headers.get("retry-after");
          setError(
            `Çok fazla deneme yapıldı. ${
              retryAfter ? `${retryAfter} sn sonra tekrar deneyin.` : "Biraz sonra tekrar deneyin."
            }`
          );
          return;
        }

        const out = await res.json();
        if (!res.ok) return;

        setPwnedCount(out.count ?? 0);
        if ((out.count ?? 0) > 0) {
          setError(
            `Bu şifre daha önce sızıntılarda görüldü (≈ ${out.count}). Lütfen farklı bir şifre seçin.`
          );
        }
      } finally {
        setPwnedChecking(false);
      }
    }, 450);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [password]);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setError("");

    if (!validatePassword(password)) {
      setError("Şifre en az 8 karakter, bir büyük harf ve bir rakam içermelidir.");
      return;
    }
    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    // pwned ise blokla (gerekli dokunuş)
    if (pwnedCount !== null && pwnedCount > 0) {
      setError("Bu şifre güvenli değil. Lütfen farklı bir şifre seçin.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token) {
        setError("Oturum doğrulanamadı veya sıfırlama bağlantısının süresi dolmuş.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          accessToken: data.session.access_token,
        }),
      });

      if (res.status === 429) {
        const retryAfter = res.headers.get("retry-after");
        setError(
          `Çok fazla deneme yapıldı. ${
            retryAfter ? `${retryAfter} sn sonra tekrar deneyin.` : "Biraz sonra tekrar deneyin."
          }`
        );
        setLoading(false);
        return;
      }

      const out = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(out.error || "Şifre güncellenemedi. Lütfen tekrar deneyin.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.replace("/login"), 1800);
    } catch {
      setError("Sunucu hatası oluştu.");
      setLoading(false);
    }
  }

  // --- Expired / invalid token UX
  if (initializing) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#04060d] text-white">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (tokenOk === false) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#04060d] text-white px-6">
        <div className="w-full max-w-md">
          <div className="p-[1.5px] rounded-3xl bg-gradient-to-br from-blue-500/50 via-cyan-400/20 to-transparent">
            <div className="rounded-3xl bg-black/65 backdrop-blur-2xl border border-white/10 p-10">
              <header className="text-center mb-6">
                <h1 className="text-3xl font-semibold tracking-wide">DENETRON</h1>
                <p className="mt-1 text-sm text-white/60">Şifre sıfırlama</p>
              </header>

              <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                <AlertTriangle className="mt-0.5" size={18} />
                <div>
                  <div className="font-medium">Bağlantı geçersiz veya süresi dolmuş</div>
                  <div className="text-xs opacity-80">
                    Lütfen giriş ekranından yeniden “Şifremi unuttum” adımını başlatın.
                  </div>
                </div>
              </div>

              <button
                onClick={() => router.replace("/login")}
                className="mt-6 w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 transition"
              >
                Giriş ekranına dön
              </button>

              <footer className="mt-6 text-xs text-white/50 text-center">
                ISO 45001 • KVKK • AES-256
              </footer>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Normal page (styled like login)
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#04060d] text-white px-6">
      <div className="w-full max-w-md">
        <div className="p-[1.5px] rounded-3xl bg-gradient-to-br from-blue-500/50 via-cyan-400/20 to-transparent">
          <div className="rounded-3xl bg-black/65 backdrop-blur-2xl border border-white/10 p-10">
            <header className="text-center mb-8">
              <h1 className="text-3xl font-semibold tracking-wide">DENETRON</h1>
              <p className="text-sm text-white/60">Yeni güvenli şifrenizi belirleyin</p>
            </header>

            {success ? (
              <div className="text-center space-y-4">
                <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />
                <p>Şifreniz güvenli şekilde güncellendi.</p>
                <p className="text-xs text-white/50">Giriş sayfasına yönlendiriliyorsunuz…</p>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-5">
                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-4 py-3 rounded-xl">
                    <AlertTriangle size={18} />
                    {error}
                  </div>
                )}

                {/* Password */}
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-white/40" />
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Yeni şifre"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-white/10 border border-white/20 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Animated strength bar */}
                {password && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <span>Şifre gücü</span>
                      <span className="text-white/70">
                        {strength.label}
                        {pwnedChecking ? " • kontrol ediliyor…" : pwnedCount !== null ? " • kontrol tamam" : ""}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-300"
                        style={{
                          width: `${(strength.score / 3) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="text-[11px] text-white/50">
                      En az 8 karakter, 1 büyük harf ve 1 rakam önerilir.
                    </div>
                  </div>
                )}

                {/* Confirm */}
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-white/40" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Yeni şifre (tekrar)"
                    value={confirm}
                    onChange={(e) => {
                      setConfirm(e.target.value);
                      setError("");
                    }}
                    className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-white/10 border border-white/20 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <button
                  disabled={loading || pwnedChecking}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:-translate-y-0.5 hover:shadow-xl transition disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Güncelleniyor…
                    </span>
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
