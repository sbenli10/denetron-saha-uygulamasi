// APP/app/invite/[token]/InviteAcceptForm.tsx
"use client";

import { useState } from "react";

export default function InviteAcceptForm({ invite }: any) {
  const [loading, setLoading] = useState(false);

  async function acceptInvite() {
    setLoading(true);

    const res = await fetch("/api/invites/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: invite.token }),
    });

    setLoading(false);

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "Davet kabul edilirken hata oluştu.");
      return;
    }

    const role = result.role_name?.toLowerCase() ?? "operator";

    // → RBAC yönlendirme
    if (role === "admin" || role === "manager") {
      window.location.href = "/admin";
    } else {
      window.location.href = "/operator";
    }
  }

  return (
    <div className="max-w-lg mx-auto p-8 bg-card border border-border rounded-xl">
      <h2 className="text-xl font-semibold mb-3 text-foreground">Davet</h2>

      <p className="text-foreground/70 mb-4">
        Bu bağlantı ile organizasyona katılabilirsiniz.
        Daveti kabul etmek için giriş yapmış olmanız gerekir.
      </p>

      {!invite && (
        <p className="text-red-500">Geçersiz veya kullanılmış davet.</p>
      )}

      <button
        onClick={acceptInvite}
        disabled={loading}
        className="
          w-full py-3 rounded-lg bg-primary text-primary-foreground
          hover:bg-primary/90 transition disabled:opacity-40
        "
      >
        {loading ? "İşleniyor..." : "Daveti Kabul Et"}
      </button>
    </div>
  );
}
