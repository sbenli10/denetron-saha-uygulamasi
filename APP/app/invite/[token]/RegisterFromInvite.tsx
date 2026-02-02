//APP\app\invite\[token]\RegisterFromInvite.tsx
"use client";

import { useState } from "react";
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
    setLoading(false);

    if (!resSignup.ok) {
      setError(result.error || "Hesap oluşturulamadı.");
      return;
    }

    window.location.href = "/post-auth-redirect";
  }

  return (
    <div className="max-w-md w-full bg-card border border-border p-8 rounded-xl shadow-xl">
      <h1 className="text-xl font-semibold mb-4">Hesap Oluştur</h1>

      <p className="text-foreground/60 mb-4">
        Davet edilen email: <b>{invite.email}</b>
      </p>

      <input
        type="text"
        placeholder="Ad Soyad"
        className="w-full mb-3 p-3 rounded-lg border border-border bg-background"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />

      <input
        type="password"
        placeholder="Şifre"
        className="w-full mb-4 p-3 rounded-lg border border-border bg-background"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <button
        onClick={handleRegister}
        disabled={loading}
        className="w-full py-3 bg-primary text-primary-foreground rounded-lg disabled:opacity-40"
      >
        {loading ? "Oluşturuluyor..." : "Hesap Oluştur ve Katıl"}
      </button>
    </div>
  );
}
