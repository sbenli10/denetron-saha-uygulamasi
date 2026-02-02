//APP\app\admin\dof\manual\[id]\page.tsx
"use client";
export const dynamic = "force-dynamic";

import useSWR from "swr";
import { useParams } from "next/navigation";
import { useState,useRef } from "react";
import ManualAddItemModal from "@/app/components/dof/manual/ManualAddItemModal";
import DofItemEvidenceModal from "@/app/components/dof/manual/DofItemEvidenceModal";

/* ================= TYPES ================= */

export type DofItem = {
  id: string;
  area: string | null;
  risk_description: string;
  action_description: string | null;
  long_description?: string | null;
  deadline: string | null;   // TEXT
  severity: string | null;   // TEXT
  status: "open" | "completed" | "overdue";
  files?: {
    id: string;
    file: { url: string };
  }[];
};

type Dof = {
  id: string;
  report_no: string;
  status: "open" | "closed";
  items: DofItem[];
};


const fetcher = (url: string) => fetch(url).then(r => r.json());

const statusMap: Record<DofItem["status"], string> = {
  open: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  overdue: "bg-red-100 text-red-700",
};



export default function ManualDofDetailPage() {
  const { id } = useParams();
  const [manualAnalysisStatus, setManualAnalysisStatus] = useState<
  "idle" | "saving" | "success" | "error"
  >("idle");

  const [analysisText, setAnalysisText] = useState<string>("");
  const [savingAnalysis, setSavingAnalysis] = useState(false);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [analysisStatus, setAnalysisStatus] = useState<
  "idle" | "saving" | "success" | "error"
  >("idle");
  const [exportStatus, setExportStatus] = useState<
  "idle" | "loading" | "success" | "error"
  >("idle");
  const [aiStatus, setAiStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const [aiResult, setAiResult] = useState<string>("");

  const dofId = id as string;

  const { data, mutate, isLoading } = useSWR<{ dof: Dof }>(
    dofId ? `/api/dof/manual/detail?id=${dofId}` : null,
    fetcher
  );
  const [showAddItem, setShowAddItem] = useState(false);
  const [editItem, setEditItem] = useState<DofItem | null>(null);
  const [evidenceFor, setEvidenceFor] = useState<string | null>(null);
  const [completingItemId, setCompletingItemId] = useState<string | null>(null);;
    // 🔥 MADDE BAZLI ANALİZ STATE
    const [saveAiStatus, setSaveAiStatus] = useState<
  "idle" | "saving" | "success" | "error"
  >("idle");
  const [isEditingAnalysis, setIsEditingAnalysis] = useState(true);

  

  if (isLoading) {
    return <div className="p-10 text-sm text-gray-500">Yükleniyor…</div>;
  }

  if (!data?.dof) {
    return <div className="p-10 text-sm">DÖF bulunamadı</div>;
  }

  const dof = data.dof;
  const isReadOnly = dof.status === "closed";
  const openItems = dof.items.filter(i => i.status !== "completed");
  const completedItems = dof.items.filter(
    i => i.status === "completed"
  );

  

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">

      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold">{dof.report_no}</h1>
          <p className="text-sm text-gray-500">
            Düzeltici / Önleyici Faaliyet Formu
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* 🔴 AÇIK MADDE BADGE */}
          {!isReadOnly && openItems.length > 0 && (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
              {openItems.length} madde açık
            </span>
          )}

          {/* YENİ MADDE */}
          {!isReadOnly && (
            <button
              onClick={() => setShowAddItem(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              Yeni DÖF Maddesi
            </button>
          )}

          {/* DÖF KAPAT */}
          {!isReadOnly && (
            <button
              onClick={async () => {
                const unfinishedItems = dof.items.filter(
                  i => i.status !== "completed"
                );

                if (unfinishedItems.length > 0) {
                  const firstOpen = unfinishedItems[0];
                  const el = itemRefs.current[firstOpen.id];

                  if (el) {
                    el.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }

                  alert(
                    `DÖF kapatılamaz.\n\n` +
                    `${unfinishedItems.length} madde hâlâ açık.\n\n` +
                    `• "Maddeyi Tamamla" ile kapatın\n` +
                    `• veya gereksizse silin`
                  );
                  return;
                }

                const ok = confirm(
                  "Tüm maddeler tamamlandı. DÖF kapatılacaktır. Devam edilsin mi?"
                );
                if (!ok) return;

                const res = await fetch("/api/dof/manual/close", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ dof_id: dof.id }),
                });

                const json = await res.json();

                if (!res.ok) {
                  alert(json.error || "DÖF kapatılamadı");
                  return;
                }

                mutate();
              }}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700"
            >
              DÖF’ü Kapat
            </button>
          )}

          {/* ✅ DÖF KAPALI → WORD RAPOR */}
          {isReadOnly && (
            <>
              <span className="rounded-lg bg-gray-200 px-4 py-2 text-sm text-gray-700">
                DÖF Kapalı
              </span>

              <button
                onClick={async () => {
                  const res = await fetch(
                    `/api/dof/manual/export/word?dof_id=${dof.id}`
                  );

                  if (!res.ok) {
                    alert("Word raporu oluşturulamadı");
                    return;
                  }

                  const blob = await res.blob();
                  const url = window.URL.createObjectURL(blob);

                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${dof.report_no}.docx`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();

                  window.URL.revokeObjectURL(url);
                }}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
              >
                Word Raporu Oluştur
              </button>
            </>
          )}
        </div>

      </div>



      {/* ITEMS */}
      <section className="space-y-6">
        {dof.items.map((item, index) => {
          const hasEvidence = (item.files?.length ?? 0) > 0;
          return (
            <div
              key={item.id}
              ref={el => {
              itemRefs.current[item.id] = el;
            }}

              className={`space-y-5 rounded-xl border p-6 shadow-sm
                ${
                  item.status !== "completed"
                    ? "border-red-300 bg-red-50"
                    : "bg-white"
                }
              `}
            >

              {/* HEADER */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Madde {index + 1}
                </h3>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-2 py-1 text-xs ${statusMap[item.status]}`}
                  >
                    {item.status === "completed"
                      ? "Tamamlandı"
                      : item.status === "overdue"
                      ? "Gecikmiş"
                      : "Açık"}
                  </span>

                  {!isReadOnly && (
                    <>
                      <button
                        onClick={() => setEditItem(item)}
                        className="rounded border px-3 py-1 text-xs hover:bg-gray-50"
                      >
                        Düzenle
                      </button>

                      <button
                        onClick={async () => {
                          const ok = confirm(
                            "Bu DÖF maddesini silmek istediğinize emin misiniz?"
                          );
                          if (!ok) return;

                          // 🔥 Optimistic update
                          mutate(
                            current => {
                              if (!current) return current;
                              return {
                                ...current,
                                dof: {
                                  ...current.dof,
                                  items: current.dof.items.filter(
                                    i => i.id !== item.id
                                  ),
                                },
                              };
                            },
                            false // revalidate ETME
                          );

                          const res = await fetch("/api/dof/manual/item-delete", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ item_id: item.id }),
                          });

                          if (!res.ok) {
                            alert("Madde silinemedi, sayfa yenileniyor");
                            mutate(); // geri al
                            return;
                          }

                          // backend ile sync
                          mutate();
                        }}
                        className="rounded border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        Sil
                      </button>

                    </>
                  )}
                </div>
              </div>

              {/* META */}
              <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                <div>
                  <p className="text-gray-500">İlgili Bölüm</p>
                  <p className="font-medium">{item.area || "—"}</p>
                </div>

                <div>
                  <p className="text-gray-500">Termin</p>
                  <p className="font-medium">
                    {item.deadline && item.deadline.trim() !== ""
                      ? item.deadline
                      : "—"}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 text-sm">Önem Seviyesi</p>

                  {item.severity ? (
                    <span
                      className={`inline-flex items-center mt-1 rounded-full px-3 py-1 text-xs font-semibold
                        ${
                          item.severity.toLowerCase().includes("yüksek") ||
                          item.severity.toLowerCase().includes("kritik")
                            ? "bg-red-100 text-red-700"
                            : item.severity.toLowerCase().includes("orta")
                            ? "bg-yellow-100 text-yellow-700"
                            : item.severity.toLowerCase().includes("düşük")
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                    >
                      {item.severity}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
              </div>

              {/* CONTENT */}
              <div className="space-y-6 text-sm">

                {/* RISK / NONCONFORMITY */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    <p className="font-semibold text-gray-800">
                      Risk / Uygunsuzluk Tanımı
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 border px-4 py-3">
                    <p className="whitespace-pre-line leading-relaxed text-gray-700">
                      {item.risk_description}
                    </p>
                  </div>
                </div>

                {/* ACTION
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <p className="font-semibold text-gray-800">
                      Planlanan Düzeltici / Önleyici Faaliyet
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 border px-4 py-3">
                    <p className="whitespace-pre-line leading-relaxed text-gray-700">
                      {item.action_description || "Belirtilmemiştir."}
                    </p>
                  </div>
                </div> */}

                {/* LONG DESCRIPTION */}
                {item.long_description && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-slate-500" />
                      <p className="font-semibold text-gray-800">
                        Detaylı Açıklama / Ek Bilgiler
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 border px-4 py-3">
                      <p className="whitespace-pre-line leading-relaxed text-gray-700">
                        {item.long_description}
                      </p>
                    </div>
                  </div>
                )}
              </div>


              {/* EVIDENCE */}
              <div className="space-y-3 border-t pt-4">
                {!isReadOnly && (
                  <button
                    onClick={() => setEvidenceFor(item.id)}
                    className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                  >
                    Kanıt Ekle
                  </button>
                )}

                {item.files && item.files.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Resimler</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {item.files.map(f => (
                        <a
                          key={f.id}
                          href={f.file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative overflow-hidden rounded-lg border"
                        >
                          <img
                            src={f.file.url}
                            className="h-32 w-full object-cover group-hover:opacity-90"
                          />
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/30">
                            <span className="rounded bg-black/60 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100">
                              Görüntüle
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>        
              {/* COMPLETE */}
              {!isReadOnly && item.status !== "completed" && (
                <div className="border-t pt-4 space-y-2">

                  {/* UYARI – Kanıt yoksa bilgilendir */}
                  {!hasEvidence && (
                    <p className="text-xs text-amber-600">
                      Bu madde için henüz kanıt eklenmemiştir.
                    </p>
                  )}

                  <div className="flex justify-end">
                    <button
                      disabled={completingItemId === item.id}
                      onClick={async () => {
                        setCompletingItemId(item.id);
                        try {
                          await fetch("/api/dof/item-complete", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ item_id: item.id }),
                          });
                          mutate();
                        } finally {
                          setCompletingItemId(null);
                        }
                      }}
                      className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      Maddeyi Tamamla
                    </button>
                  </div>
                </div>
              )}
            </div>            
          );
        })}
      </section>

      {/* AI ANALİZ */}
      <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            Yapay Zekâ Analizi
          </h3>

          {!isReadOnly && (
            <div className="flex items-center gap-2">
              {/* ANALİZ OLUŞTUR */}
              <button
                disabled={completedItems.length === 0 || aiStatus === "loading"}
                onClick={async () => {
                  setAiStatus("loading");
                  try {
                    const res = await fetch("/api/dof/manual/ai-analysis", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ dof_id: dof.id }),
                    });

                    if (!res.ok) throw new Error();

                    const json = await res.json();
                    setAiResult(json.analysis);
                    setAiStatus("success");
                  } catch {
                    setAiStatus("error");
                  }
                }}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:bg-gray-300"
              >
                {aiStatus === "loading"
                  ? "Analiz Ediliyor…"
                  : "AI Analizi Oluştur"}
              </button>

              {/* ANALİZİ KAYDET */}
              <button
                disabled={!aiResult || saveAiStatus === "saving"}
                onClick={async () => {
                  setSaveAiStatus("saving");
                  try {
                    const res = await fetch(
                      "/api/dof/manual/save-ai-analysis",
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          dof_id: dof.id,
                          analysis: aiResult,
                        }),
                      }
                    );

                    if (!res.ok) throw new Error();

                    await mutate(); // SWR refresh
                    setSaveAiStatus("success");
                    setTimeout(() => setSaveAiStatus("idle"), 2000);
                  } catch {
                    setSaveAiStatus("error");
                    setTimeout(() => setSaveAiStatus("idle"), 3000);
                  }
                }}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                {saveAiStatus === "idle" && "AI Analizini Kaydet"}
                {saveAiStatus === "saving" && "Kaydediliyor…"}
                {saveAiStatus === "success" && "Kaydedildi ✓"}
                {saveAiStatus === "error" && "Hata Oluştu"}
              </button>
            </div>
          )}
        </div>

        {(aiResult || (dof as any).ai_report) && (
          <div className="rounded-lg bg-gray-50 border px-4 py-4 text-sm whitespace-pre-line">
            {aiResult || (dof as any).ai_report}
          </div>
        )}
      </div>


        {/* GENEL DEĞERLENDİRME / ANALİZ */}
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              Genel Değerlendirme / Analiz
            </h3>

            {!isReadOnly && (
              <div className="flex items-center gap-2">
                {/* DÜZENLE */}
                {!isEditingAnalysis && (
                  <button
                    onClick={() => setIsEditingAnalysis(true)}
                    className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    Düzenle
                  </button>
                )}

                {/* KAYDET */}
                {isEditingAnalysis && (
                  <button
                    disabled={
                      !analysisText.trim() ||
                      manualAnalysisStatus === "saving"
                    }
                    onClick={async () => {
                      setManualAnalysisStatus("saving");
                      try {
                        const res = await fetch(
                          "/api/dof/manual/save-analysis",
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              dof_id: dof.id,
                              analysis: analysisText,
                            }),
                          }
                        );

                        if (!res.ok) throw new Error();

                        await mutate();
                        setManualAnalysisStatus("success");
                        setIsEditingAnalysis(false); // 🔒 kilitle

                        setTimeout(() => {
                          setManualAnalysisStatus("idle");
                        }, 2000);
                      } catch {
                        setManualAnalysisStatus("error");
                        setTimeout(() => {
                          setManualAnalysisStatus("idle");
                        }, 3000);
                      }
                    }}
                    className={`rounded-lg px-4 py-2 text-sm text-white transition
                      ${
                        manualAnalysisStatus === "saving"
                          ? "bg-gray-400 cursor-not-allowed"
                          : manualAnalysisStatus === "error"
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-emerald-600 hover:bg-emerald-700"
                      }
                    `}
                  >
                    {manualAnalysisStatus === "idle" && "Genel Değerlendirmeyi Kaydet"}
                    {manualAnalysisStatus === "saving" && "Kaydediliyor…"}
                    {manualAnalysisStatus === "success" && "Kaydedildi ✓"}
                    {manualAnalysisStatus === "error" && "Hata Oluştu"}
                  </button>
                )}
              </div>
            )}
          </div>

          <textarea
            rows={6}
            value={analysisText}
            onChange={e => setAnalysisText(e.target.value)}
            className={`w-full rounded-lg border px-4 py-3 text-sm leading-relaxed
              ${!isEditingAnalysis ? "bg-gray-50 text-gray-700" : ""}
            `}
            placeholder="DÖF sürecine ilişkin genel analiz, değerlendirme, kanaat ve sonuç..."
            disabled={isReadOnly || !isEditingAnalysis}
          />
        </div>


      {/* WORD EXPORT */}
      {!isReadOnly && openItems.length === 0 && (
        <div className="flex items-center justify-end gap-3 pt-6">
          <button
            disabled={exportStatus === "loading"}
            onClick={async () => {
              try {
                setExportStatus("loading");

                const res = await fetch(
                  `/api/dof/manual/export/word?dof_id=${dof.id}`
                );

                if (!res.ok) {
                  throw new Error("Export failed");
                }

                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);

                const a = document.createElement("a");
                a.href = url;
                a.download = `${dof.report_no}.docx`;
                document.body.appendChild(a);
                a.click();
                a.remove();

                window.URL.revokeObjectURL(url);

                setExportStatus("success");

                setTimeout(() => {
                  setExportStatus("idle");
                }, 2000);
              } catch (err) {
                console.error(err);
                setExportStatus("error");

                setTimeout(() => {
                  setExportStatus("idle");
                }, 3000);
              }
            }}
            className={`
              rounded-lg px-6 py-2 text-sm text-white transition
              ${
                exportStatus === "loading"
                  ? "bg-emerald-400 cursor-not-allowed"
                  : exportStatus === "error"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }
            `}
          >
            {exportStatus === "idle" && "Word Raporu Oluştur"}
            {exportStatus === "loading" && "Oluşturuluyor…"}
            {exportStatus === "success" && "İndirildi ✓"}
            {exportStatus === "error" && "Hata Oluştu"}
          </button>

          {/* STATUS TEXT */}
          {exportStatus === "success" && (
            <span className="text-sm text-emerald-600">
              Word raporu başarıyla oluşturuldu
            </span>
          )}

          {exportStatus === "error" && (
            <span className="text-sm text-red-600">
              Word raporu oluşturulamadı
            </span>
          )}
        </div>
      )}


      {/* MODALS */}
      {showAddItem && (
        <ManualAddItemModal
          dofId={dof.id}
          onClose={() => setShowAddItem(false)}
          onSuccess={() => {
            setShowAddItem(false);
            mutate();
          }}
        />
      )}

      {editItem && (
        <ManualAddItemModal
          dofId={dof.id}
          item={editItem}
          onClose={() => setEditItem(null)}
          onSuccess={() => {
            setEditItem(null);
            mutate();
          }}
        />
      )}

      {evidenceFor && (
        <DofItemEvidenceModal
          dofItemId={evidenceFor}
          onClose={() => setEvidenceFor(null)}
          onSuccess={() => {
            setEvidenceFor(null);
            mutate();
          }}
        />
      )}
    </div>
  );
}
