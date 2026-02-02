"use client";

import { FormEvent, useState } from "react";
import { Mail, Lock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export type AuthPhase = "idle" | "auth" | "session" | "redirect";

export default function CredentialForm({
  onPhaseChange,
  onError,
}: {
  onPhaseChange: (p: AuthPhase) => void;
  onError: (msg: string | null) => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phase, setPhase] = useState<AuthPhase>("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onError(null);

    if (!email || !password) {
      onError("Kimlik bilgileri zorunludur.");
      return;
    }

    try {
      setPhase("auth");
      onPhaseChange("auth");

      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const out = await res.json();

      if (!res.ok) {
        setPhase("idle");
        onPhaseChange("idle");
        onError(out?.error || "Kimlik doğrulama başarısız.");
        return;
      }

      setPhase("session");
      onPhaseChange("session");

      setTimeout(() => {
        setPhase("redirect");
        onPhaseChange("redirect");
        router.push(out.role === "admin" ? "/admin/dashboard" : "/operator");
      }, 1400);
    } catch {
      setPhase("idle");
      onPhaseChange("idle");
      onError("Sunucuya ulaşılamıyor.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field
        icon={Mail}
        placeholder="Kurumsal e-posta"
        value={email}
        onChange={(e: any) => setEmail(e.target.value)}
      />

      <Field
        icon={Lock}
        type="password"
        placeholder="Şifre"
        value={password}
        onChange={(e: any) => setPassword(e.target.value)}
      />

      <button
        disabled={phase !== "idle"}
        className="
          w-full h-11 rounded-lg
          bg-blue-600 hover:bg-blue-700
          text-white text-sm font-medium
          flex items-center justify-center gap-2
          transition
          disabled:opacity-60
          hover:shadow-[0_8px_30px_rgba(37,99,235,0.45)]
        "
      >
        {(phase === "auth" || phase === "session") && (
          <Loader2 size={16} className="animate-spin" />
        )}
        {phase === "idle" && "Giriş Yap"}
        {phase === "redirect" && "Yönlendiriliyor"}
      </button>
    </form>
  );
}

/* ---------------------------- Field ---------------------------- */

function Field({
  icon: Icon,
  ...props
}: {
  icon: React.ComponentType<any>;
  [key: string]: any;
}) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
      <input
        {...props}
        className="
          w-full h-11 pl-10 pr-3 rounded-lg
          bg-white/85 dark:bg-white/6
          border border-black/12 dark:border-white/12
          text-sm text-black dark:text-white
          outline-none
          transition
          focus:ring-2 focus:ring-blue-500
          focus:bg-white dark:focus:bg-white/10
        "
      />
    </div>
  );
}
