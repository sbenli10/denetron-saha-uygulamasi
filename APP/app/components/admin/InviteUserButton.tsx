// APP/components/admin/InviteUserButton.tsx
"use client";

import { useState } from "react";

export function InviteUserButton() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"operator" | "manager">("operator");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function sendInvite() {
    setLoading(true);
    setMsg(null);
    setErr(null);

    const res = await fetch("/api/invites/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });

    const data = await res.json();

    if (!res.ok) {
      setErr(data.error || "Davet gönderilemedi.");
    } else {
      setMsg("Davet gönderildi.");
      setEmail("");
    }

    setLoading(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 text-sm font-semibold"
      >
        + Kullanıcı Davet Et
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Yeni Kullanıcı Davet Et</h2>

        <label className="block text-sm text-slate-300 mb-1">Email</label>
        <input
          type="email"
          className="w-full mb-4 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm"
          placeholder="operator@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="block text-sm text-slate-300 mb-1">Rol</label>
        <select
          className="w-full mb-4 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm"
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
        >
          <option value="operator">Operatör</option>
          <option value="manager">Yönetici</option>
        </select>

        {err && <div className="text-xs text-red-400 mb-2">{err}</div>}
        {msg && <div className="text-xs text-emerald-400 mb-2">{msg}</div>}

        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={() => setOpen(false)}
            className="px-3 py-2 text-sm rounded-lg border border-slate-600"
          >
            Kapat
          </button>
          <button
            onClick={sendInvite}
            disabled={loading || !email}
            className="px-4 py-2 text-sm rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold disabled:opacity-60"
          >
            {loading ? "Gönderiliyor..." : "Davet Gönder"}
          </button>
        </div>
      </div>
    </div>
  );
}
