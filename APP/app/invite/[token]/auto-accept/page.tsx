// APP/app/invite/[token]/auto-accept/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

type Status =
  | "loading"
  | "success"
  | "email_mismatch"
  | "expired"
  | "invalid"
  | "unauthorized"
  | "error";

export default function AutoAcceptPage() {
  const router = useRouter();
  const { token } = useParams<{ token: string }>();

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    async function run() {
      try {
        const res = await fetch("/api/invites/auto-accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setTimeout(() => router.replace("/post-auth-redirect"), 1200);
          return;
        }

        // HTTP STATUS MAP
        if (res.status === 403) {
          setStatus("email_mismatch");
          setMessage(
            "Bu davet farklı bir e-posta adresine gönderilmiş. Lütfen doğru hesapla giriş yapın."
          );
          return;
        }

        if (res.status === 410) {
          setStatus("expired");
          setMessage("Bu davetin süresi dolmuş.");
          return;
        }

        if (res.status === 400) {
          setStatus("invalid");
          setMessage("Davet geçersiz veya daha önce kullanılmış.");
          return;
        }

        if (res.status === 401) {
          setStatus("unauthorized");
          setMessage("Giriş yapmanız gerekiyor.");
          return;
        }

        setStatus("error");
        setMessage(data?.error ?? "Bilinmeyen hata");
      } catch {
        setStatus("error");
        setMessage("Sunucuya ulaşılamadı.");
      }
    }

    run();
  }, [token, router]);

  /* ================= UI ================= */

  if (status === "loading") {
    return <Center text="Davet kabul ediliyor…" />;
  }

  if (status === "success") {
    return <Center text="Organizasyona katıldınız. Yönlendiriliyorsunuz…" />;
  }

  if (status === "email_mismatch") {
    return (
      <Center>
        <p className="mb-4">{message}</p>
        <button
          onClick={() => router.push(`/invite/${token}?retry=1`)}
          className="btn-primary"
        >
          Doğru Hesapla Tekrar Giriş Yap
        </button>
      </Center>
    );
  }

  return (
    <Center>
      <p className="mb-4">{message}</p>
      <button onClick={() => router.push("/")} className="btn-secondary">
        Ana Sayfaya Dön
      </button>
    </Center>
  );
}

function Center({ children, text }: { children?: any; text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="max-w-md text-center">
        {text && <p>{text}</p>}
        {children}
      </div>
    </div>
  );
}
