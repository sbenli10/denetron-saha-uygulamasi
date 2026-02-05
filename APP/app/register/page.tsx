"use client";

import { useState, useRef } from "react";
import {
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertTriangle,
  Info,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import ShaderBlur from "./components/ShaderBlur";

/* ================= INPUT ================= */
function Input({ label, hint, error, ...props }: any) {
  return (
    <div className="space-y-1">
      <label className="text-xs uppercase tracking-wide text-white/60">
        {label}
      </label>
      <input
        {...props}
        className={clsx(
          "w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/40 border outline-none transition",
          error
            ? "border-red-500/60 focus:ring-red-500/40"
            : "border-white/15 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
        )}
      />
      {hint && !error && (
        <p className="text-[11px] text-white/40">{hint}</p>
      )}
      {error && (
        <p className="text-[11px] text-red-400">{error}</p>
      )}
    </div>
  );
}

/* ================= PAGE ================= */
export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const passwordStrength = (() => {
    let score = 0;
    if (password.length >= 6) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { label: "Zayıf", color: "bg-red-500", val: 25 };
    if (score === 2) return { label: "Orta", color: "bg-yellow-500", val: 50 };
    if (score === 3) return { label: "İyi", color: "bg-blue-500", val: 75 };
    return { label: "Güçlü", color: "bg-green-500", val: 100 };
  })();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setError(null);

    if (!emailValid) {
      setError("Geçerli bir email adresi giriniz.");
      return;
    }

    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, orgName, email, password }),
      });

      const out = await res.json();

      if (!res.ok) {
        setError(out.error || "Kayıt başarısız.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => (window.location.href = "/login"), 2500);
    } catch {
      setError("Sunucuya ulaşılamıyor.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-[#020617] text-white px-6 overflow-hidden">
      <ShaderBlur />

      {/* SUCCESS */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl">
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Kayıt Başarılı</h2>
            <p className="text-gray-600 mt-2">
              Giriş sayfasına yönlendiriliyorsunuz…
            </p>
          </div>
        </div>
      )}

      <div className="relative z-20 w-full max-w-md">
        <div className="rounded-3xl bg-black/70 backdrop-blur-2xl border border-white/10 p-10 shadow-2xl">

          {/* HEADER */}
          <header className="text-center mb-6">
            <h1 className="text-3xl font-semibold tracking-wide">DENETRON</h1>
            <p className="text-sm text-white/60 mt-1">
              Yeni organizasyon ve yönetici hesabı oluştur
            </p>
          </header>

          {/* INFO */}
          <div className="mb-6 flex gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
            <Info size={18} />
            <p>
              Bu sayfa yalnızca <strong>ilk organizasyon yöneticisi</strong> içindir.
              Çalışanlar davet ile eklenir.
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleRegister} className="space-y-5">
            <Input
              label="Ad Soyad"
              value={fullName}
              onChange={(e: any) => setFullName(e.target.value)}
              required
            />

            <Input
              label="Firma Adı"
              hint="Rapor ve denetimlerde görünecek isim"
              value={orgName}
              onChange={(e: any) => setOrgName(e.target.value)}
              required
            />

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              error={email && !emailValid ? "Geçersiz email formatı" : null}
              required
            />

            {/* PASSWORD */}
            <div className="relative space-y-2">
              <Input
                label="Şifre"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-[38px] text-white/50 hover:text-white"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>

              {password && (
                <div className="space-y-1">
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`${passwordStrength.color} h-full transition-all`}
                      style={{ width: `${passwordStrength.val}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-right text-white/50">
                    Şifre Gücü: <strong>{passwordStrength.label}</strong>
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <AlertTriangle size={18} />
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className={clsx(
                "w-full py-3.5 rounded-xl font-semibold transition-all",
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-blue-700 hover:-translate-y-0.5 hover:shadow-xl"
              )}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                "Organizasyonu Oluştur"
              )}
            </button>
          </form>

          {/* FOOTER */}
          <footer className="mt-6 text-xs text-white/50 flex justify-between">
            <span className="flex items-center gap-1">
              <ShieldCheck size={14} /> ISO 45001 • KVKK • AES-256
            </span>
            <Link href="/login" className="hover:underline">
              Giriş Yap
            </Link>
          </footer>
        </div>
      </div>
    </div>
  );
}
