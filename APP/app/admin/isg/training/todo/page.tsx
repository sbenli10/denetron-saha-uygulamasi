//APP\app\admin\isg\training\todo\page.tsx

"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Upload,
  Loader2,
  Eye,
  Undo2,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { TrainingCompleteDrawer } from "./TrainingCompleteDrawer";
import Link from "next/link";

/* ================= TYPES ================= */

type ExecutionItem = {
  id: string;
  activity: string;
  planned_period: string;
  planned_month: number;
  executed: boolean;
  executed_at?: string;
};

type TodoResponse = {
  items: ExecutionItem[];
  meta: {
    reason: "OK" | "NO_PLAN" | "NO_MONTH_MAPPING";
    message?: string;
  };
};

type PreviewFile = {
  file: File;
  url: string;
};

type EvidenceFile = {
  id: string;
  url: string;
  type: string;
};

/* ================= PAGE ================= */

export default function MonthlyTrainingTodoPage() {
  const [data, setData] = useState<TodoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, PreviewFile[]>>({});
  const [evidences, setEvidences] = useState<Record<string, EvidenceFile[]>>(
    {}
  );

  const PAGE_SIZE = 5;
  const [pageByMonth, setPageByMonth] = useState<Record<number, number>>({});
  const [filterMonth, setFilterMonth] = useState<number | "ALL">("ALL");
  const [filterStatus, setFilterStatus] =
    useState<"ALL" | "DONE" | "PENDING">("ALL");

  /* ================= DATA ================= */

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "/api/admin/isg/analyze/annual-plan/todo",
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setData({
        items: [],
        meta: { reason: "NO_PLAN", message: "Veri alınamadı." },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setSuccessId(null);
  }, [filterMonth, filterStatus]);

  /* ================= ACTIONS ================= */

  async function markCompleted(executionId: string) {
    const files = previews[executionId];
    if (!files || files.length === 0) return;

    try {
      setBusyId(executionId);
      const form = new FormData();
      form.append("execution_id", executionId);
      files.forEach((f) => form.append("file", f.file));

      const res = await fetch(
        "/api/admin/isg/analyze/annual-plan/execute",
        { method: "POST", body: form }
      );
      if (!res.ok) throw new Error();

      await loadData();
      setPreviews((p) => ({ ...p, [executionId]: [] }));
      setSuccessId(executionId);
      setTimeout(() => setSuccessId(null), 4000);
    } finally {
      setBusyId(null);
    }
  }

  async function undoCompleted(executionId: string) {
    const ok = confirm(
      "⚠️ Eğitimi geri almak üzeresiniz.\n\n" +
        "• Eğitim tekrar Bekleyen durumuna alınır\n" +
        "• Kanıtlar silinmez\n" +
        "• Yeniden tamamlamanız gerekir\n\n" +
        "Devam edilsin mi?"
    );
    if (!ok) return;

    setBusyId(executionId);
    await fetch("/api/admin/isg/analyze/annual-plan/undo", {
      method: "POST",
      body: JSON.stringify({ execution_id: executionId }),
    });
    await loadData();
    setBusyId(null);
  }

  async function loadEvidences(executionId: string) {
    if (evidences[executionId]) return;
    const res = await fetch(
      `/api/admin/isg/analyze/annual-plan/evidences?execution_id=${executionId}`
    );
    const json = await res.json();
    setEvidences((e) => ({ ...e, [executionId]: json.items ?? [] }));
  }

  function handleFiles(id: string, files: FileList) {
    setPreviews((p) => ({
      ...p,
      [id]: Array.from(files).map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    }));
  }

  /* ================= GROUP + PAGINATION ================= */

  const groupedByMonth = useMemo(() => {
    if (!data) return {};
    return data.items
      .filter((i) =>
        filterMonth === "ALL" ? true : i.planned_month === filterMonth
      )
      .filter((i) =>
        filterStatus === "ALL"
          ? true
          : filterStatus === "DONE"
          ? i.executed
          : !i.executed
      )
      .reduce<Record<number, ExecutionItem[]>>((acc, item) => {
        acc[item.planned_month] ??= [];
        acc[item.planned_month].push(item);
        return acc;
      }, {});
  }, [data, filterMonth, filterStatus]);

  const pagedByMonth = useMemo(() => {
    const result: Record<number, ExecutionItem[]> = {};
    Object.entries(groupedByMonth).forEach(([m, items]) => {
      const month = Number(m);
      const page = pageByMonth[month] ?? 1;
      const start = (page - 1) * PAGE_SIZE;
      result[month] = items.slice(start, start + PAGE_SIZE);
    });
    return result;
  }, [groupedByMonth, pageByMonth]);

  /* ================= UI ================= */

  if (loading) {
    return (
      <div className="p-12 flex justify-center text-gray-500">
        <Loader2 className="animate-spin mr-2" /> Yükleniyor…
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
      <header className="space-y-4">
        <h1 className="text-3xl font-semibold flex items-center gap-2">
          <Calendar /> İSG Eğitim Takibi
        </h1>

        <div className="flex gap-3">
          <select
            className="border rounded-lg px-3 py-2 text-sm"
            value={filterMonth}
            onChange={(e) =>
              setFilterMonth(
                e.target.value === "ALL" ? "ALL" : Number(e.target.value)
              )
            }
          >
            <option value="ALL">Tüm Aylar</option>
            {[...Array(12)].map((_, i) => (
              <option key={i} value={i + 1}>
                {i + 1}. Ay
              </option>
            ))}
          </select>

          <select
            className="border rounded-lg px-3 py-2 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value="ALL">Tümü</option>
            <option value="PENDING">Bekleyen</option>
            <option value="DONE">Tamamlanan</option>
          </select>
        </div>

        {data && data.meta.reason !== "OK" && (
          <div className="flex gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
            <AlertTriangle size={16} />
            {data.meta.message}
          </div>
        )}
      </header>

      {Object.entries(pagedByMonth).map(([month, items]) => {
        const m = Number(month);
        const total = groupedByMonth[m]?.length ?? 0;
        const page = pageByMonth[m] ?? 1;
        const pages = Math.ceil(total / PAGE_SIZE);

        return (
          <section key={month} className="border rounded-2xl bg-white shadow-sm">
            <div className="px-6 py-4 border-b bg-gray-50 rounded-t-2xl flex justify-between">
              <h2 className="font-semibold">{month}. Ay Eğitimleri</h2>
              <span className="text-sm text-gray-500">
                Toplam {total} kayıt
              </span>
            </div>

            <div className="divide-y">
              {items.map((item) => {
                const files = previews[item.id] ?? [];
                const locked = busyId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`p-6 flex justify-between gap-6 border-b last:border-b-0 ${
                      item.executed
                        ? "bg-green-50 text-gray-600"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    {/* SOL – BİLGİ */}
                    <div className="space-y-2">
                      <p className="font-medium text-gray-900">
                        {item.activity}
                      </p>

                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Calendar size={14} />
                        {item.planned_period}
                      </p>

                      {/* DURUM */}
                      {item.executed ? (
                        <div className="inline-flex items-center gap-2 text-xs text-green-700 bg-green-100 px-2 py-1 rounded-md w-fit">
                          <ShieldCheck size={14} />
                          Tamamlandı
                          {item.executed_at && (
                            <span className="text-green-800">
                              · {new Date(item.executed_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-md w-fit">
                          <AlertTriangle size={14} />
                          Bekleyen Eğitim
                        </div>
                      )}

                      {/* KANIT ÖZETİ */}
                      {evidences[item.id]?.length > 0 && (
                        <div className="text-xs text-blue-600">
                          {evidences[item.id].length} adet kanıt yüklü
                        </div>
                      )}

                      {/* BAŞARI MESAJI */}
                      {successId === item.id && (
                        <div className="text-sm text-green-700 bg-green-100 px-3 py-2 rounded-lg mt-2">
                          Eğitim başarıyla kayıt altına alındı.
                        </div>
                      )}
                    </div>

                    {/* SAĞ – AKSİYONLAR */}
                    <div className="flex flex-col gap-2 min-w-[220px] text-sm">
                      {item.executed ? (
                        <>
                          <Link
                            href={`/admin/isg/training/${item.id}`}
                            className="border rounded-lg px-3 py-2 hover:bg-gray-100 text-center"
                          >
                            <Eye size={14} className="inline mr-1" />
                            Eğitim Detayı
                          </Link>

                          <button
                            disabled={locked}
                            onClick={() => undoCompleted(item.id)}
                            className="border border-red-200 text-red-600 rounded-lg px-3 py-2 hover:bg-red-50"
                          >
                            <Undo2 size={14} className="inline mr-1" />
                            Geri Al
                          </button>
                        </>
                      ) : (
                        <>
                          {/* 🔥 YENİ: Drawer Aç */}
                          <button
                            onClick={() => setDrawerId(item.id)}
                            className="rounded-lg px-3 py-2 bg-blue-600 text-white"
                          >
                            Eğitimi Tamamla
                          </button>

                          <button
                            onClick={() => loadEvidences(item.id)}
                            className="border rounded-lg px-3 py-2 hover:bg-gray-100"
                          >
                            Mevcut Kanıtları Gör
                          </button>
                        </>
                      )}
                    </div>

                    {/* DRAWER */}
                    <TrainingCompleteDrawer
                      open={drawerId === item.id}
                      executionId={item.id}
                      onClose={() => setDrawerId(null)}
                      onSubmitSuccess={async () => {
                        await loadData(); // listeyi yenile
                        setSuccessId(item.id);
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {pages > 1 && (
              <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
                {[...Array(pages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setPageByMonth((p) => ({ ...p, [m]: i + 1 }))
                    }
                    className={`px-3 py-1 text-sm rounded-md border ${
                      page === i + 1
                        ? "bg-blue-600 text-white"
                        : "bg-white"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
