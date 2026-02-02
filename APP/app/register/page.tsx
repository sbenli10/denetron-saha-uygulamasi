//APP\app\register\page.tsx
"use client";

// HYPER-PREMIUM REGISTER PAGE v2 — FULL NEXT-GEN VERSION

import { useState, useEffect, useRef } from "react";
import { Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import ShaderBlur from "./components/ShaderBlur";


/******************************** INPUT ********************************/
function Input({ label, ...props }: any) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-200">{label}</label>
      <input
        {...props}
        className="w-full mt-1 px-4 py-2 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </div>
  );
}

/******************************** 3D BACKGROUND ********************************/
function ThreeBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    import("three").then((THREE) => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        65,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );

      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current!,
        alpha: true,
      });

      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);

      const geo = new THREE.TorusKnotGeometry(3, 1, 200, 30);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x2463eb,
        wireframe: true,
      });
      const mesh = new THREE.Mesh(geo, mat);

      scene.add(mesh);

      const light = new THREE.PointLight(0x4f9cff, 2, 50);
      light.position.set(10, 10, 10);
      scene.add(light);

      camera.position.z = 10;

      const animate = () => {
        requestAnimationFrame(animate);
        mesh.rotation.x += 0.003;
        mesh.rotation.y += 0.004;
        renderer.render(scene, camera);
      };

      animate();
    });
  }, []);

  return (
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-30" />
  );
}



/******************************** AI VOICE ********************************/
function VoiceWizard() {
  useEffect(() => {
    const u = new SpeechSynthesisUtterance(
      "Denetron kayıt ekranına hoş geldiniz. Lütfen bilgilerinizi giriniz."
    );
    u.rate = 1;
    u.pitch = 1;
    setTimeout(() => window.speechSynthesis.speak(u), 1200);
  }, []);
  return null;
}

/******************************** SUCCESS MODAL ********************************/
function SuccessModal({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur z-50 animate-fadeIn">
      <div className="bg-white p-8 rounded-2xl shadow-2xl text-center animate-scaleIn">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Kayıt Başarılı!</h2>
        <p className="text-gray-700 mb-4">Giriş sayfasına yönlendiriliyorsunuz...</p>
      </div>
    </div>
  );
}

/******************************** MAIN PAGE ********************************/
export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  /******************************** FIXED REGISTER HANDLER ********************************/
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          orgName,
          email,
          password,
        }),
      });

      const out = await res.json();

      if (!res.ok) {
        setError(out.error || "Kayıt hatası oluştu.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err: any) {
      console.error("Register Error:", err);
      setError("Sunucu hatası oluştu.");
      setLoading(false);
    }
  };

  /******************************** RENDER ********************************/
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#020617] text-white p-6">
      <ThreeBackground />
      <ShaderBlur />
      <VoiceWizard />
      <SuccessModal show={success} />

      <div className="w-full max-w-md backdrop-blur-2xl bg-white/10 p-10 rounded-3xl shadow-2xl border border-white/10 relative z-20">
        <h1 className="text-4xl font-bold text-center">DENETRON</h1>
        <p className="text-center text-gray-300 mt-2">
          Yeni hesap ve organizasyon oluştur
        </p>

        <form onSubmit={handleRegister} className="mt-8 space-y-5">
          <Input
            label="Ad Soyad"
            value={fullName}
            onChange={(e: any) => setFullName(e.target.value)}
            required
          />
          <Input
            label="Organizasyon Adı"
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
          <Input
            label="Şifre"
            type="password"
            value={password}
            onChange={(e: any) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          {error && (
            <div className="text-red-400 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            className={clsx(
              "w-full py-3 rounded-lg font-semibold text-white transition-all",
              loading
                ? "bg-blue-400"
                : "bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-600/30"
            )}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              "Kayıt Ol"
            )}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6 text-sm">
          Zaten hesabın var mı?{" "}
          <Link href="/login" className="text-blue-400">
            Giriş Yap
          </Link>
        </p>
      </div>
    </div>
  );
}
