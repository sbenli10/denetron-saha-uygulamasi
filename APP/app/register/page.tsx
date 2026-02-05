"use client";

import { useState, useEffect, useRef } from "react";
import {
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import ShaderBlur from "./components/ShaderBlur";

/* ================= INPUT ================= */
function Input({ label, hint, ...props }: any) {
  return (
    <div className="space-y-1">
      <label className="text-xs uppercase tracking-wide text-white/60">
        {label}
      </label>
      <input
        {...props}
        className="
          w-full px-4 py-3 rounded-xl
          bg-white/10 text-white placeholder-white/40
          border border-white/15
          focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40
          outline-none transition
        "
      />
      {hint && <p className="text-[11px] text-white/40">{hint}</p>}
    </div>
  );
}

/* ================= BACKGROUND ================= */
function ThreeBackground() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    import("three").then((THREE) => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      const renderer = new THREE.WebGLRenderer({
        canvas: ref.current!,
        alpha: true,
      });

      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);

      const geo = new THREE.TorusKnotGeometry(3, 1, 180, 32);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        wireframe: true,
      });

      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);

      const light = new THREE.PointLight(0x60a5fa, 2, 50);
      light.position.set(10, 10, 10);
      scene.add(light);

      camera.position.z = 10;

      const animate = () => {
        requestAnimationFrame(animate);
        mesh.rotation.x += 0.002;
        mesh.rotation.y += 0.003;
        renderer.render(scene, camera);
      };
      animate();
    });
  }, []);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 w-full h-full opacity-25"
    />
  );
}

/* ================= SUCCESS ================= */
function SuccessModal({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl">
      <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Kayıt Tamamlandı</h2>
        <p className="text-gray-600 mt-2">
          Güvenli giriş sayfasına yönlendiriliyorsunuz…
        </p>
      </div>
    </div>
  );
}

/* ================= PAGE ================= */
export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const getPasswordStrength = (pass: string) => {
  let score = 0;

  if (pass.length >= 6) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;

  if (score <= 1) return { level: "Zayıf", color: "bg-red-500", value: 25 };
  if (score === 2) return { level: "Orta", color: "bg-yellow-500", value: 50 };
  if (score === 3) return { level: "İyi", color: "bg-blue-500", value: 75 };
  return { level: "Güçlü", color: "bg-green-500", value: 100 };
};

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

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
      setTimeout(() => (window.location.href = "/login"), 2000);
    } catch {
      setError("Sunucu hatası oluştu.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#020617] text-white px-6">
      <ThreeBackground />
      <ShaderBlur />
      <SuccessModal show={success} />

      <div className="relative z-20 w-full max-w-md">
        <div className="p-[1.5px] rounded-3xl bg-gradient-to-br from-blue-500/50 via-cyan-400/20 to-transparent">
          <div className="rounded-3xl bg-black/65 backdrop-blur-2xl border border-white/10 p-10">

            {/* HEADER */}
            <header className="text-center mb-8">
              <h1 className="text-3xl font-semibold tracking-wide">
                DENETRON
              </h1>
              <p className="text-sm text-white/60 mt-1">
                Yeni organizasyon ve yönetici hesabı oluştur
              </p>
            </header>

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
                hint="Bu ad denetim ve raporlarda görünecektir"
                value={orgName}
                onChange={(e: any) => setOrgName(e.target.value)}
                required
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                required
              />

             {/* PASSWORD */}
              <div className="relative space-y-2">
                <Input
                  label="Şifre"
                  type={showPass ? "text" : "password"}
                  hint="En az 6 karakter, tercihen rakam ve özel karakter"
                  value={password}
                  onChange={(e: any) => setPassword(e.target.value)}
                  required
                />

                {/* GÖSTER / GİZLE */}
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-[38px] text-white/50 hover:text-white transition"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>

                {/* ŞİFRE GÜCÜ */}
                {password.length > 0 && (
                  <div className="space-y-1">
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getPasswordStrength(password).color}`}
                        style={{ width: `${getPasswordStrength(password).value}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-white/50 text-right">
                      Şifre Gücü:{" "}
                      <span className="font-medium">
                        {getPasswordStrength(password).level}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="text-red-400 text-sm text-center">
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
                <ShieldCheck size={14} /> ISO 45001 • KVKK
              </span>
              <Link href="/login" className="hover:underline">
                Giriş Yap
              </Link>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
