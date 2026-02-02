//APP\app\login\page.tsx
"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Globe, Lock, Eye, EyeOff, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
// GPU fluid dışarı alındı
import GPULiquid from "./components/GPULiquid";

/******************************** THEMES ********************************/
type ThemeMode = "light" | "dark";

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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isVerifyingSession, setIsVerifyingSession] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginRole, setLoginRole] = useState<"operator" | "owner">("operator");

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
          roleHint: loginRole, // 🔑 kritik ek
        }),
      });

      const text = await res.text();
      let out: any = {};

      try {
        out = JSON.parse(text);
      } catch {
        out = { error: "Email veya şifre hatalı" };
      }

      if (!res.ok) {
        const message =
          out.error === "Invalid login credentials"
            ? "Email veya şifre hatalı"
            : out.error || "Giriş başarısız.";

        setError(message);
        return;
      }

      // ✅ BAŞARILI GİRİŞ
      const role = out.role as "admin" | "operator";

      setIsRedirecting(true);
      setIsVerifyingSession(true);

      toast.success(
        role === "admin" ? "Yönetici girişi başarılı" : "Giriş başarılı",
        {
          description:
            role === "admin"
              ? "Yönetim paneline yönlendiriliyorsunuz"
              : "Operatör paneline yönlendiriliyorsunuz",
        }
      );

      setTimeout(() => {
        setIsVerifyingSession(false);
        router.push(role === "admin" ? "/admin/dashboard" : "/operator");
      }, 1800);
    } catch {
      setError("Sunucuya ulaşılamıyor.");
    }
  }



  function calculateStrength(pw: string) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
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
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />
    </div>

    {/* ================= THEME SWITCH ================= */}
    <button
      onClick={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
      className="
        absolute top-6 right-6 z-30
        px-4 py-2 rounded-xl
        bg-white/10 backdrop-blur-md
        border border-white/15
        text-sm font-medium
        hover:bg-white/20
        transition
      "
    >
      {themeMode === "dark" ? "Dark" : "Light"} Mode
    </button>

    {/* ================= AUTH CONTAINER ================= */}
    <div className="relative z-20 w-full max-w-md px-4">
      <div
        className="
          p-[1.5px] rounded-3xl
          bg-gradient-to-br from-blue-500/40 via-cyan-400/20 to-transparent
          shadow-[0_40px_120px_rgba(0,120,255,0.35)]
        "
      >
        <div
          className="
            relative rounded-3xl
            bg-black/55 backdrop-blur-2xl
            border border-white/10
            p-10
          "
        >
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
          <div
            className="
              mb-8
              relative
              flex
              rounded-xl
              bg-white/10
              border border-white/10
              p-1
              backdrop-blur-md
            "
          >
            {/* Active Indicator */}
            <div
              className={`
                absolute top-1 bottom-1
                w-1/2
                rounded-lg
                bg-white/90
                shadow-[0_4px_20px_rgba(0,0,0,0.25)]
                transition-all duration-200 ease-out
                ${loginRole === "operator" ? "left-1" : "left-1/2"}
              `}
            />

            {/* Operator */}
            <button
              type="button"
              onClick={() => setLoginRole("operator")}
              className={`
                relative z-10
                flex-1 py-2
                text-sm font-medium
                rounded-lg
                transition-colors duration-200
                ${
                  loginRole === "operator"
                    ? "text-black"
                    : "text-white/70 hover:text-white"
                }
              `}
            >
              Operatör
            </button>

            {/* Owner */}
            <button
              type="button"
              onClick={() => setLoginRole("owner")}
              className={`
                relative z-10
                flex-1 py-2
                text-sm font-medium
                rounded-lg
                transition-colors duration-200
                ${
                  loginRole === "owner"
                    ? "text-black"
                    : "text-white/70 hover:text-white"
                }
              `}
            >
              İş Güvenliği Uzmanı
            </button>
          </div>


          {/* ================= FORM ================= */}
          <form
            onSubmit={(e) => handleLogin(e, loginRole)}
            className="space-y-6"
          >
            {/* ERROR */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-4 py-3 rounded-xl">
                <AlertTriangle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* EMAIL */}
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-white/60">
                {loginRole === "operator"
                  ? "Operatör Email"
                  : "Yönetici Email"}
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
                }}
              />
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-white/60">
                Şifre
              </label>

              <Input
                type={showPassword ? "text" : "password"}
                icon={Lock}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
              />
            </div>

            {/* SUBMIT */}
            <button
              disabled={isRedirecting}
              className={`
                w-full py-3.5 rounded-xl
                text-sm font-semibold
                transition-all
                ${
                  isRedirecting
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-[0_10px_40px_rgba(37,99,235,0.45)] hover:-translate-y-0.5"
                }
              `}
            >
              {isVerifyingSession
                ? "Oturum doğrulanıyor…"
                : loginRole === "owner"
                ? "Yönetici Girişi"
                : "Operatör Girişi"}
            </button>
          </form>

          {/* ================= FOOTER ================= */}
          <footer className="mt-6 flex justify-between text-xs text-white/50">
            <span>ISO 45001 • KVKK • AES-256</span>
            <Link href="/register" className="hover:underline">
              Kayıt Ol
            </Link>
          </footer>

          {/* ================= SESSION OVERLAY ================= */}
          {isVerifyingSession && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-xl rounded-3xl">
              <div className="text-center text-white space-y-3">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-white border-t-transparent mx-auto" />
                <p className="text-sm opacity-80">
                  Oturum güvenliği doğrulanıyor…
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
}