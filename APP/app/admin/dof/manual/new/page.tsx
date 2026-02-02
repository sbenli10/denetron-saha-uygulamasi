//APP\app\admin\dof\manual\new\page.tsx
"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function ManualDofCreatePage() {
  const router = useRouter();

  const [konu, setKonu] = useState("");
  const [sayi, setSayi] = useState("");
  const [reportDate, setReportDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [isgUzmani, setIsgUzmani] = useState("");
  const [bildirimSekli, setBildirimSekli] = useState("");
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  const source = searchParams.get("source");
  const activity = searchParams.get("activity");
  const risk = searchParams.get("risk");
  const period = searchParams.get("period");
  const months = searchParams.get("months");

  if (source === "annual_plan" && activity) {
    setKonu(`Yıllık İSG Planı Uygunsuzluğu: ${activity}`);
  }

  if (risk) {
    setBildirimSekli(`Risk Seviyesi: ${risk}`);
  }
}, [searchParams]);

  async function handleCreate() {
    if (!konu || !sayi || !isgUzmani) {
      setError("Konu, Sayı ve İSG Uzmanı zorunludur.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch("/api/dof/manual/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        konu,
        sayi,
        report_date: reportDate,
        isg_uzmani: isgUzmani,
        bildirim_sekli: bildirimSekli || null,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "DÖF oluşturulamadı");
      return;
    }

    router.push(`/admin/dof/manual/${data.dof.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto p-10 space-y-6">
      <h1 className="text-2xl font-semibold">Manuel DÖF Oluştur</h1>

      <input
        placeholder="Konu"
        value={konu}
        onChange={e => setKonu(e.target.value)}
        className="w-full border rounded-lg px-3 py-2"
      />

      <input
        placeholder="Sayı"
        value={sayi}
        onChange={e => setSayi(e.target.value)}
        className="w-full border rounded-lg px-3 py-2"
      />

      <input
        type="date"
        value={reportDate}
        onChange={e => setReportDate(e.target.value)}
        className="w-full border rounded-lg px-3 py-2"
      />

      <input
        placeholder="İSG Uzmanı"
        value={isgUzmani}
        onChange={e => setIsgUzmani(e.target.value)}
        className="w-full border rounded-lg px-3 py-2"
      />

      <input
        placeholder="Bildirim Şekli (E-posta, Yazılı vb.)"
        value={bildirimSekli}
        onChange={e => setBildirimSekli(e.target.value)}
        className="w-full border rounded-lg px-3 py-2"
      />

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <button
        onClick={handleCreate}
        disabled={loading}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg"
      >
        {loading ? "Oluşturuluyor…" : "DÖF Oluştur"}
      </button>
    </div>
  );
}
