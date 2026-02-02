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
    <div>
      <h1 className="text-3xl font-semibold text-gray-900">
        Düzeltici & Önleyici Faaliyetler
      </h1>
      <p className="text-sm text-gray-500 mt-1">
        Kurumsal denetim kayıtları
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
    <div className="flex flex-wrap gap-4 items-center justify-between">
      <div className="flex gap-3">
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">Tümü</option>
          <option value="open">Açık</option>
          <option value="closed">Kapalı</option>
        </select>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={hasAi}
            onChange={(e) => onHasAiChange(e.target.checked)}
          />
          AI Analizi Var
        </label>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onExport("csv")}
          className="px-3 py-2 border rounded text-sm"
        >
          CSV
        </button>
        <button
          onClick={() => onExport("xlsx")}
          className="px-3 py-2 border rounded text-sm"
        >
          Excel
        </button>
      </div>
    </div>
  );
}

/* ===================== */
/* ===== List ===== */
/* ===================== */

function List({
  dofs,
  loading,
  error,
}: {
  dofs: Dof[];
  loading: boolean;
  error: boolean;
}) {
  if (loading && dofs.length === 0)
    return <p className="text-gray-400">Yükleniyor…</p>;

  if (error)
    return <p className="text-red-500">Hata oluştu</p>;

  return (
    <div className="grid gap-4">
      {dofs.map((dof) => (
        <Link
          key={dof.id}
          href={`/admin/dof/${dof.id}`}
          className="rounded-xl border bg-white p-4 hover:bg-gray-50"
        >
          <div className="flex justify-between">
            <div>
              <p className="font-medium text-gray-900">
                {dof.title}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(dof.created_at).toLocaleDateString("tr-TR")}
              </p>
            </div>
            <span className="text-xs">
              {dof.status === "open" ? "Açık" : "Kapalı"}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
