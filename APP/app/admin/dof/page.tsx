// APP/app/admin/dof/page.tsx
"use client";
export const dynamic = "force-dynamic";

import { useState, useMemo } from "react";
import useSWRInfinite from "swr/infinite";
import Link from "next/link";
import * as XLSX from "xlsx";

/* ===================== */
/* ===== Types ===== */
/* ===================== */

type DofStatus = "open" | "closed";

type Dof = {
  id: string;
  title: string;
  status: DofStatus;
  created_at: string;
  has_ai?: boolean;
};

type ApiResponse = {
  dofs: Dof[];
  total: number;
  page: number;
  limit: number;
};

/* ===================== */
/* ===== Fetcher ===== */
/* ===================== */

const fetcher = async (url: string): Promise<ApiResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("API error");
  return res.json();
};

/* ===================== */
/* ===== Page ===== */
/* ===================== */

export default function DofListPage() {
  const limit = 10;

  /* ===== Filters ===== */
  const [status, setStatus] = useState<string>("");
  const [hasAi, setHasAi] = useState(false);

  /* ===== Infinite SWR ===== */
  const getKey = (pageIndex: number, prev: ApiResponse | null) => {
    if (prev && prev.dofs.length === 0) return null;

    const params = new URLSearchParams({
      page: String(pageIndex + 1),
      limit: String(limit),
    });

    if (status) params.set("status", status);
    if (hasAi) params.set("has_ai", "true");

    return `/api/dof/list?${params.toString()}`;
  };

  const {
    data,
    error,
    size,
    setSize,
    isLoading,
  } = useSWRInfinite<ApiResponse>(getKey, fetcher);

  const dofs = useMemo(
    () => data?.flatMap((p) => p.dofs) ?? [],
    [data]
  );

  const isEnd =
    data && data[data.length - 1]?.dofs.length < limit;

  /* ===================== */
  /* ===== Export ===== */
  /* ===================== */

  const exportData = async (type: "csv" | "xlsx") => {
    const params = new URLSearchParams({
      page: "1",
      limit: "10000",
    });
    if (status) params.set("status", status);
    if (hasAi) params.set("has_ai", "true");

    const res = await fetch(`/api/dof/list?${params}`);
    const json: ApiResponse = await res.json();

    const rows = json.dofs.map((d) => ({
      ID: d.id,
      Başlık: d.title,
      Durum: d.status === "open" ? "Açık" : "Kapalı",
      Tarih: new Date(d.created_at).toLocaleDateString("tr-TR"),
      "AI Analizi": d.has_ai ? "Var" : "Yok",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DOF");

    XLSX.writeFile(
      wb,
      `dof-list.${type === "csv" ? "csv" : "xlsx"}`
    );
  };

  /* ===================== */
  /* ===== Render ===== */
  /* ===================== */

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 space-y-8">
      <Header />

      <Filters
        status={status}
        hasAi={hasAi}
        onStatusChange={setStatus}
        onHasAiChange={setHasAi}
        onExport={exportData}
      />

      <List
        dofs={dofs}
        loading={isLoading}
        error={!!error}
      />

      {!isEnd && (
        <div className="text-center">
          <button
            onClick={() => setSize(size + 1)}
            className="px-4 py-2 rounded border bg-white"
          >
            Daha fazla yükle
          </button>
        </div>
      )}
    </div>
  );
}

/* ===================== */
/* ===== Header ===== */
/* ===================== */

function Header() {
  return (
    <div className="space-y-1">
      <h1 className="text-3xl font-semibold text-gray-900">
        Düzeltici & Önleyici Faaliyet (DÖF) Kayıtları
      </h1>
      <p className="text-sm text-gray-500">
        Gerçekleştirilen denetimler sonucunda oluşturulan düzeltici ve önleyici faaliyetlerin
        listesi, durumu ve analiz bilgileri.
      </p>
    </div>
  );
}


/* ===================== */
/* ===== Filters ===== */
/* ===================== */

function Filters({
  status,
  hasAi,
  onStatusChange,
  onHasAiChange,
  onExport,
}: {
  status: string;
  hasAi: boolean;
  onStatusChange: (v: string) => void;
  onHasAiChange: (v: boolean) => void;
  onExport: (t: "csv" | "xlsx") => void;
}) {
  return (
    <div className="rounded-xl border bg-white p-4 space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        {/* SOL – FİLTRELER */}
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              DÖF Durumu
            </label>
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="">Tümü</option>
              <option value="open">Açık</option>
              <option value="closed">Kapalı</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm mt-5 sm:mt-0">
            <input
              type="checkbox"
              checked={hasAi}
              onChange={(e) => onHasAiChange(e.target.checked)}
            />
            AI Analizi Olanlar
          </label>
        </div>

        {/* SAĞ – EXPORT */}
        <div className="flex gap-2">
          <button
            onClick={() => onExport("csv")}
            className="px-3 py-2 border rounded text-sm hover:bg-gray-50"
          >
            CSV Dışa Aktar
          </button>
          <button
            onClick={() => onExport("xlsx")}
            className="px-3 py-2 border rounded text-sm hover:bg-gray-50"
          >
            Excel Dışa Aktar
          </button>
        </div>
      </div>
    </div>
  );
}

function List({
  dofs,
  loading,
  error,
}: {
  dofs: Dof[];
  loading: boolean;
  error: boolean;
}) {
  if (loading && dofs.length === 0) {
    return <p className="text-sm text-gray-400">DÖF kayıtları yükleniyor…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">Veriler yüklenirken hata oluştu.</p>;
  }

  if (dofs.length === 0) {
    return (
      <div className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-500">
        Seçilen kriterlere uygun DÖF kaydı bulunamadı.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {dofs.map((dof) => (
        <div
          key={dof.id}
          className="group rounded-xl border bg-white p-4 transition hover:bg-gray-50 hover:shadow-sm"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            {/* SOL – TIKLANABİLİR ALAN */}
            <Link
              href={`/admin/dof/${dof.id}`}
              className="flex-1 space-y-1"
            >
              <p className="font-medium text-gray-900">
                {dof.title}
              </p>
              <p className="text-xs text-gray-400">
                Oluşturulma Tarihi:{" "}
                {new Date(dof.created_at).toLocaleDateString("tr-TR")}
              </p>
            </Link>

            {/* SAĞ – BADGE + AKSİYONLAR */}
            <div className="flex items-center gap-2 text-xs">

              {dof.has_ai && (
                <span className="rounded-full bg-indigo-100 px-2 py-1 text-indigo-700">
                  AI Analizi
                </span>
              )}

              <span
                className={`rounded-full px-2 py-1 font-medium
                  ${
                    dof.status === "open"
                      ? "bg-red-100 text-red-700"
                      : "bg-emerald-100 text-emerald-700"
                  }
                `}
              >
                {dof.status === "open" ? "Açık" : "Kapalı"}
              </span>

              {/* 🔴 SİL BUTONU (SADECE KAPALI DÖF) */}
              {dof.status !== "open" && (
                <button
                  onClick={async (e) => {
                    e.preventDefault(); // Link tetiklenmesin
                    e.stopPropagation();

                    const ok = confirm(
                      "Bu DÖF kaydı kalıcı olarak silinecektir.\nDevam etmek istiyor musunuz?"
                    );
                    if (!ok) return;

                    const res = await fetch("/api/dof/manual/delete", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ dof_id: dof.id }),
                    });

                    if (!res.ok) {
                      const json = await res.json();
                      alert(json.error || "DÖF silinemedi.");
                      return;
                    }

                    // ✅ En basit ve güvenli çözüm
                    location.reload();

                    // 👉 İstersen burada SWR mutate ile de yapabiliriz
                  }}
                  className="rounded-lg border border-red-200 px-2 py-1 text-red-600 hover:bg-red-50"
                  title="DÖF Kaydını Sil"
                >
                  Sil
                </button>
              )}

            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


