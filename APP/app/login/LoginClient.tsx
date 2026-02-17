//APP\app\login\page.tsx
"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Globe, Lock, Eye, EyeOff, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter,useSearchParams } from "next/navigation";
import { toast } from "sonner";
// GPU fluid dışarı alındı
import GPULiquid from "./components/GPULiquid";
import { supabaseAuth } from "@/lib/supabase/auth";
/******************************** THEMES ********************************/
type ThemeMode = "light" | "dark";
type Step = "password" | "otp";
const themes: Record<ThemeMode, { bg: string; text: string; card: string }> = {
  light: {
    bg: "#f4f7ff",
    text: "#111",
    card: "rgba(255,255,255,0.55)",
  },
  dark: {
    bg: "#04060d",
    text: "#fff",
    card: "rgba(12,18,32,0.7)",
  },
};


/******************************** INPUT ********************************/
function Input({
  icon: Icon,
  id,
  value,
  onChange,
  className = "",
  ...props
}: {
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  id?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  [key: string]: any;
}) {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
      )}
      <input
        id={id}
        value={value}
        onChange={onChange}
        {...props}
        className={`w-full pl-12 pr-3 py-3.5 rounded-xl
          bg-white/10 text-white border border-white/20
          focus:ring-2 focus:ring-blue-500 outline-none
          placeholder-white/40 ${className}`}
      />
    </div>
  );
}


/******************************** THREE BACKGROUND ********************************/
function ThreeGodRayBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let frameId: number | null = null;
    let renderer: any;

    import("three").then((THREE) => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );

      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
      });

      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);

      const geo = new THREE.IcosahedronGeometry(2.8, 1);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x2d6dff,
        wireframe: true,
      });

      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);

      camera.position.z = 6;

      let mx = 0;
      let my = 0;

      const animate = () => {
        frameId = requestAnimationFrame(animate);
        mesh.rotation.x += 0.004 + my * 0.00005;
        mesh.rotation.y += 0.003 + mx * 0.00005;
        renderer.render(scene, camera);
      };

      animate();

      const onMove = (e: MouseEvent) => {
        mx = e.clientX - window.innerWidth / 2;
        my = e.clientY - window.innerHeight / 2;
      };

      const onResize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("resize", onResize);

      return () => {
        if (frameId) cancelAnimationFrame(frameId);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("resize", onResize);
        if (renderer) {
          renderer.dispose?.();
        }
      };
    });
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-40"
    />
  );
}




/******************************** PAGE ********************************/
export default function LoginPage() {
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const theme = themes[themeMode];
  const router = useRouter();
  const [step, setStep] = useState<Step>("password");
  const [otp, setOtp] = useState("");
  const [challenge, setChallenge] = useState<{
    factorId: string;
    challengeId: string;
  } | null>(null);
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const [trustDevice, setTrustDevice] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [forgotNotice, setForgotNotice] = useState<string | null>(null);
  const [rememberMe] = useState(false);
  const [loginRole, setLoginRole] = useState<"operator" | "owner">("operator"); 
  const [forgotLoading, setForgotLoading] = useState(false);
  const [, setPendingLogin] = useState<{
  role: "admin" | "operator";
  
} | null>(null);
async function handleForgotPassword() {
  if (!email) {
    setError("Şifre sıfırlamak için email adresinizi giriniz.");
    return;
  }

  setForgotLoading(true);
  setError("");
  setForgotNotice(null);

  try {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      setError("Şifre sıfırlama isteği gönderilemedi. Lütfen tekrar deneyin.");
      return;
    }

    setForgotNotice(
      "Eğer bu email sistemde kayıtlıysa, şifre sıfırlama bağlantısı gönderildi."
    );

  } catch {
    setError("Sunucuya ulaşılamıyor. Lütfen tekrar deneyin.");
  } finally {
    setForgotLoading(false);
  }
}




async function handleVerifyOtp(e: FormEvent) {
  e.preventDefault();
  if (verifyingOtp) return;

  setVerifyingOtp(true);
  setError("");

  try {
    if (!challenge || otp.length !== 6) {
      setError("6 haneli doğrulama kodunu girin");
      return;
    }

    const res = await fetch("/api/login/mfa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        factorId: challenge.factorId,
        challengeId: challenge.challengeId,
        code: otp,
        rememberMe,
        trustDevice,
      }),
    });

    const out = await res.json();

    if (!res.ok) {
      setError(out.error || "Doğrulama başarısız");
      return;
    }

    setIsRedirecting(true);

    /**
     * 🏢 ORGANİZASYON YOKSA
     */
    if (out.noOrganization === true) {
      router.replace("/no-organization");
      return;
    }

    /**
     * 🎯 NORMAL ROLE BASED REDIRECT
     */
    const target =
      out.role === "admin"
        ? "/admin/dashboard"
        : "/operator";

    router.replace(target);

  } catch (err) {
    console.error("[OTP VERIFY ERROR]", err);
    setError("Sunucuya ulaşılamıyor.");
  } finally {
    setVerifyingOtp(false);
  }
}


async function handleLogin(
  e: FormEvent<HTMLFormElement>,
  loginRole: "operator" | "owner"
) {
  e.preventDefault();
  setError("");

  if (!email || !password) {
    setError("Email ve şifre zorunludur.");
    return;
  }

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        rememberMe,
        roleHint: loginRole,
      }),
    });

    const out = await res.json();

    if (!res.ok) {
      setError(out.error || "Giriş başarısız");
      return;
    }

    /**
     * 🔐 MFA GEREKLİ → OTP ADIMI
     */
    if (out.mfaRequired) {
      toast.info("Ek güvenlik doğrulaması gerekiyor", {
        description: "Authenticator kodu istenecek",
      });

      const cRes = await fetch("/api/login/mfa/challenge", {
        method: "POST",
      });

      const cOut = await cRes.json();

      if (!cRes.ok) {
        setError(cOut.error || "2FA başlatılamadı");
        return;
      }

      setChallenge({
        factorId: cOut.factorId,
        challengeId: cOut.challengeId,
      });

      setStep("otp");
      return;
    }

    /**
     * ✅ MFA YOK → DİREKT GİRİŞ
     */
    setIsRedirecting(true);

    toast.success("Giriş başarılı", {
      description: "Yönlendiriliyorsunuz…",
    });

    router.replace(
      out.role === "admin" ? "/admin/dashboard" : "/operator"
    );
  } catch (err) {
    console.error("[LOGIN UI ERROR]", err);
    setError("Sunucuya ulaşılamıyor.");
  }
}


return (
  <div
    className="
      min-h-screen w-full
      flex items-center justify-center
      relative overflow-hidden
      transition-colors duration-300
    "
    style={{ backgroundColor: theme.bg, color: theme.text }}
  >
    {/* ================= BACKGROUND ================= */}
    <div className="absolute inset-0 z-0">
      <ThreeGodRayBackground />
      <GPULiquid />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70" />
    </div>

    {/* ================= THEME SWITCH ================= */}
    <button
      onClick={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
      className="
        absolute top-6 right-6 z-30
        px-4 py-2 rounded-xl
        bg-white/10 backdrop-blur-md
        border border-white/20
        text-sm font-medium
        hover:bg-white/20
        transition
      "
    >
      {themeMode === "dark" ? "Dark" : "Light"} Mode
    </button>

    {/* ================= AUTH CONTAINER ================= */}
    <div className="relative z-20 w-full max-w-md px-4">
      <div className="p-[1.5px] rounded-3xl bg-gradient-to-br from-blue-500/50 via-cyan-400/20 to-transparent">
        <div className="relative rounded-3xl bg-black/65 backdrop-blur-2xl border border-white/10 p-10">
          
          {/* ================= HEADER ================= */}
          <header className="text-center mb-6">
            <h1 className="text-3xl font-semibold tracking-wide">
              DENETRON
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Secure Access Gateway
            </p>
          </header>

          {/* ================= ROLE SELECTOR ================= */}
          <div className="mb-8 relative flex rounded-xl bg-white/10 border border-white/10 p-1 backdrop-blur-md">
            <div
              className={`
                absolute top-1 bottom-1 w-1/2 rounded-lg
                bg-white
                shadow-lg
                transition-all duration-200
                ${loginRole === "operator" ? "left-1" : "left-1/2"}
              `}
            />
            <button
              type="button"
              onClick={() => setLoginRole("operator")}
              className={`relative z-10 flex-1 py-2 text-sm font-medium rounded-lg
                ${loginRole === "operator" ? "text-black" : "text-white/70 hover:text-white"}
              `}
            >
              Operatör
            </button>
            <button
              type="button"
              onClick={() => setLoginRole("owner")}
              className={`relative z-10 flex-1 py-2 text-sm font-medium rounded-lg
                ${loginRole === "owner" ? "text-black" : "text-white/70 hover:text-white"}
              `}
            >
              İş Güvenliği Uzmanı
            </button>
          </div>
         {/* ================= FORM ================= */}

         {reason === "expired" && (
          <div
            className="
              mb-4 flex items-start gap-3
              rounded-xl border border-amber-500/30
              bg-amber-500/10 px-4 py-3
              text-sm text-amber-300
            "
          >
            <AlertTriangle className="mt-0.5" size={18} />
            <div>
              <div className="font-medium">
                Oturum süreniz sona erdi
              </div>
              <div className="text-xs opacity-80">
                Güvenliğiniz için tekrar giriş yapmanız gerekiyor.
              </div>
            </div>
          </div>
        )}


          {/* 🔑 STEP 1 — PASSWORD */}
          {step === "password" && (
            <form onSubmit={(e) => handleLogin(e, loginRole)} className="space-y-6">

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-4 py-3 rounded-xl">
                  <AlertTriangle size={18} />
                  {error}
                </div>
              )}

              {forgotNotice && (
                <div className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 rounded-xl">
                  {forgotNotice}
                </div>
              )}


              {/* EMAIL */}
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wide text-white/60">
                  {loginRole === "operator" ? "Operatör Email" : "Yönetici Email"}
                </label>
                <Input
                  icon={Globe}
                  placeholder={
                    loginRole === "operator"
                      ? "operator@firma.com"
                      : "yonetici@firma.com"
                  }
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                    setForgotNotice(null); // 👈 ekle
                  }}
                />
              </div>

              {/* PASSWORD */}
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  icon={Lock}
                  placeholder="Şifre"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  className="pr-12"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button
                  type="submit"
                  disabled={isRedirecting}
                  className={`
                    w-full py-3.5 rounded-xl text-sm font-semibold
                    transition-all duration-200
                    ${
                      isRedirecting
                        ? "bg-blue-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-blue-700 hover:-translate-y-0.5 hover:shadow-xl"
                    }
                  `}
                >
                  {isRedirecting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Giriş yapılıyor…
                    </span>
                  ) : (
                    loginRole === "owner"
                      ? "Yönetici Girişi"
                      : "Operatör Girişi"
                  )}
                </button>

            </form>
          )}

          {/* 🔐 STEP 2 — OTP */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-4 py-3 rounded-xl">
                  <AlertTriangle size={18} />
                  {error}
                </div>
              )}

              <div className="text-center text-sm text-white/70">
                Authenticator uygulamanızdaki <b>6 haneli kodu</b> girin
              </div>

              <input
                autoFocus
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                inputMode="numeric"
                placeholder="123456"
                className="
                  w-full h-12 text-center tracking-widest
                  rounded-xl bg-white/10 border border-white/20
                  text-white
                "
              />

              <label className="flex items-center gap-2 text-xs text-white/70">
                <input
                  type="checkbox"
                  checked={trustDevice}
                  onChange={(e) => setTrustDevice(e.target.checked)}
                />
                Bu cihazda tekrar sorma
              </label>

              <button
                disabled={isRedirecting}
                className="
                  w-full h-12 rounded-xl
                  bg-emerald-600 text-white font-semibold
                  disabled:opacity-50
                "
              >
                {isRedirecting ? "Doğrulanıyor…" : "Doğrula ve Giriş Yap"}
              </button>

              {/* ⬅️ GERİ DÖN */}
              <button
                type="button"
                onClick={() => {
                  setStep("password");
                  setOtp("");
                  setChallenge(null);
                  setError("");
                }}
                className="block mx-auto text-xs text-white/50 hover:underline"
              >
                Geri dön
              </button>
            </form>
          )}


          {/* ================= FOOTER ================= */}
          <footer className="mt-6 flex justify-between text-xs text-white/50">
            <span>ISO 45001 • KVKK • AES-256</span>
            <Link href="/register" className="hover:underline">
              Kayıt Ol
            </Link>
          </footer>
          {/* ŞİFREMİ UNUTTUM */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={forgotLoading}
              className="
                text-xs text-blue-400
                hover:text-blue-300 hover:underline
                transition disabled:opacity-50
              "
            >
              {forgotLoading
                ? "Mail gönderiliyor…"
                : "Şifremi unuttum"}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}