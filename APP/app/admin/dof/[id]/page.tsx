"use client";

import useSWR from "swr";
import { useParams } from "next/navigation";
import { useState } from "react";
import type { RiskLevel } from "@/types/risk";
import { riskLevelTr } from "@/types/riskLevelTr";

/* ================= TYPES ================= */

type FileType = {
  id: string;
  url: string;
  type: "photo" | "video";
};

type DofItemFile = {
  id: string;
  type: string;
  file: FileType | null;
};

type AiAnalysis = {
  risk_level: "Low" | "Medium" | "High" | "Critical" | "Manual Review";
  findings: string;
  recommendation: string;
  confidence: number;
};


type DofItem = {
  id: string;
  risk_description: string;
  operator_finding: string | null;
  action_description: string;
  files: DofItemFile[];
  ai_analysis?: AiAnalysis | null;
};

type DofDetail = {
  id: string;
  report_no: string;
  description: string | null;
  status: string;
  items: DofItem[];
};

/* ================= FETCHER ================= */

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Fetch error");
  return res.json();
};


/* ================= PAGE ================= */

export default function DofDetailPage() {
  const params = useParams();
  const dofId = Array.isArray(params.id) ? params.id[0] : params.id;

  const { data, error, isLoading, mutate } = useSWR<{ dof: DofDetail }>(
    dofId ? `/api/dof/detail?id=${dofId}` : null,
    fetcher
  );

  const [aiRunningFor, setAiRunningFor] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (isLoading) return <div className="p-10 text-gray-400">Yükleniyor…</div>;
  if (error) return <div className="p-10 text-red-600">Hata oluştu</div>;
  if (!data?.dof) return <div className="p-10">DÖF bulunamadı</div>;

  const dof = data.dof;

  

  function getAi(item: any) {
  return Array.isArray(item.ai_analysis)
    ? item.ai_analysis[0]
    : item.ai_analysis;
}

function shouldShowAiButton(ai?: { risk_level?: RiskLevel } | null) {
  if (!ai) return true;

  return (
    ai.risk_level === "Manual Review" ||
    ai.risk_level === "Critical"
  );
}




  return (
    <div className="max-w-7xl mx-auto px-10 py-8 space-y-10 bg-gray-50">
      {/* ================= HEADER ================= */}
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">{dof.report_no}</h1>
        <p className="text-gray-600">
          {dof.description ?? "Açıklama girilmemiş"}
        </p>
      </header>

      {/* ================= EXPORT ================= */}
      <div className="flex gap-4">
        <a
          href={`/api/dof/export/pdf?id=${dof.id}`}
          target="_blank"
          className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
        >
          📄 PDF Olarak İndir
        </a>
        <a
          href={`/api/dof/export/word?id=${dof.id}`}
          target="_blank"
          className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
        >
          📝 Word Olarak İndir
        </a>
      </div>

      {/* ================= INFO ================= */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        Bu DÖF, operatör tarafından sahada toplanan denetim verilerine göre
        otomatik olarak oluşturulmuştur. Aşağıda tespit edilen riskler ve
        kanıtlar yer almaktadır.
      </div>

      {/* ================= ITEMS ================= */}
      <section className="space-y-10">
        {dof.items.map((item, index) => {
          const ai = item.ai_analysis;
          const isCritical = ai?.risk_level === "Critical";
          const isManual = ai?.risk_level === "Manual Review";


          return (
            <div
              key={item.id}
              className={`rounded-2xl border bg-white p-8 space-y-6 shadow-sm relative ${
                isCritical ? "border-l-8 border-l-red-600" : ""
              }`}
            >
              {/* ===== TITLE ===== */}
              <h3 className="text-lg font-semibold">
                Madde {index + 1}
              </h3>

              <p>
                <b>Risk Tanımı:</b> {item.risk_description}
              </p>

              {item.operator_finding && (
                <p>
                  <b>Operatör Açıklaması:</b> {item.operator_finding}
                </p>
              )}

              <p>
                <b>Planlanan Faaliyet:</b> {item.action_description}
              </p>

              {/* ===== MEDIA ===== */}
              {item.files?.length > 0 && (
                <div>
                  <p className="font-medium text-sm mb-2">
                    Kanıtlar (Operatör):
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {item.files.map(f => {
                      const file = f.file;
                      if (!file?.url) return null;

                      if (file.type === "video") {
                        return (
                          <video
                            key={f.id}
                            src={file.url}
                            controls
                            className="h-32 w-full rounded-xl border object-cover"
                          />
                        );
                      }

                      return (
                        <img
                          key={f.id}
                          src={file.url}
                          className="h-32 w-full rounded-xl border object-cover cursor-zoom-in"
                          onClick={() => setLightbox(file.url)}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ===== AI RESULT / ACTION ===== */}
                {(() => {
                  const ai = getAi(item);
                  const isCritical = ai?.risk_level === "Critical";
                  const isManual = ai?.risk_level === "Manual Review";

                  return (
                    <div className="space-y-3">
                      {/* === AI RESULT === */}
                      {ai && (
                        <div
                          className={`rounded-xl p-4 text-sm space-y-2 border
                            ${
                              isCritical
                                ? "bg-red-50 border-red-300 text-red-800"
                                : isManual
                                ? "bg-yellow-50 border-yellow-300 text-yellow-800"
                                : "bg-emerald-50 border-emerald-300 text-emerald-800"
                            }
                          `}
                        >
                          <div className="font-semibold">
                            🧠 Yapay Zekâ Risk Değerlendirmesi
                          </div>

                          <p>
                            <b>Risk Seviyesi:</b> {riskLevelTr(ai.risk_level)}
                          </p>
                          <p>
                            <b>Güven Oranı:</b> %{ai.confidence}
                          </p>

                          <p>
                            <b>Bulgular:</b><br />
                            <span className="whitespace-pre-line">
                              {ai.findings}
                            </span>
                          </p>

                          <p>
                            <b>Öneriler:</b><br />
                            <span className="whitespace-pre-line">
                              {ai.recommendation}
                            </span>
                          </p>

                          {isManual && (
                            <p className="text-xs italic">
                              ⚠️ Güven seviyesi düşüktür. Uzman incelemesi önerilir.
                            </p>
                          )}

                          {isCritical && (
                            <p className="text-xs font-semibold">
                              ❗ Kritik risk tespit edilmiştir. Acil aksiyon gereklidir.
                            </p>
                          )}
                        </div>
                      )}

                      {/* === AI BUTTON === */}
                      {shouldShowAiButton(ai) && (
                        <button
                          disabled={aiRunningFor === item.id}
                          onClick={async () => {
                            setAiRunningFor(item.id);
                            await fetch("/api/dof/ai-evidence-analysis", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ dof_item_id: item.id }),
                            });
                            setAiRunningFor(null);
                            mutate();
                          }}
                          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium
                            ${
                              isCritical
                                ? "bg-red-600 text-white hover:bg-red-700"
                                : isManual
                                ? "bg-yellow-500 text-white hover:bg-yellow-600"
                                : "border hover:bg-gray-50"
                            }
                          `}
                        >
                          {aiRunningFor === item.id
                            ? "🧠 Analiz ediliyor…"
                            : ai
                            ? "🧠 Yapay Zekâ Analizini Yenile"
                            : "🧠 Yapay Zekâ ile Kanıt Analizi Yap"}
                        </button>
                      )}
                    </div>
                  );
                })()}
            </div>
          );
        })}
      </section>

      {/* ================= LIGHTBOX ================= */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            className="max-h-[90vh] max-w-[90vw] rounded-xl"
          />
        </div>
      )}
    </div>
  );
}
