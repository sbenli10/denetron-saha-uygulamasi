//APP\app\admin\isg\result\page.tsx
"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ClipboardList,
  FileSearch,
  Clock,
  Scale,
  ArrowLeft,
} from "lucide-react";

/* -------------------- TYPES (NEW BACKEND SHAPE) -------------------- */

type PhotoPreview = { name: string; preview: string };

type FineKinneyRiskLevel =
  | "Kabul edilebilir"
  | "Dikkate değer"
  | "Önemli"
  | "Yüksek"
  | "Çok yüksek";

type ComplianceStatus = "Uygun" | "Kısmen uygun" | "Uygun değil" | "Belirsiz";

type PhotoAnalysisNotRelevant = {
  isgRelevant: false;
  sceneDescription: string;
  reason: string;
};

type PhotoAssessmentItem = {
  hazard: string;
  observation: string;
  probability: 0.1 | 0.5 | 1 | 3 | 6 | 10;
  exposure: 0.5 | 1 | 2 | 3 | 6 | 10;
  severity: 1 | 3 | 7 | 15 | 40 | 100;
  riskScore: number;
  riskLevel: FineKinneyRiskLevel;
  priorityOrder: number;
  recommendedControls: {
    elimination: string | null;
    substitution: string | null;
    engineeringControls: string | null;
    administrativeControls: string | null;
    ppe: string | null;
  };
  complianceStatus: ComplianceStatus;
  legalReference: {
    primaryLaw: "6331 sayılı İş Sağlığı ve Güvenliği Kanunu";
    regulation: string | null;
    isoClause: string | null;
  };
};

type RiskAnalysisApiResponse = {
  type: "risk-analysis";
  fileName: string;
  primarySheetName?: string;
  analysis: any; // istersen prompt şemasına göre strongly-typed yaparız
  warnings?: string[];
  meta?: any;
};

type ISGApiResponseRisk = PhotoApiResponse | InspectionApiResponse | RiskAnalysisApiResponse;


type PhotoAnalysisRelevant = {
  isgRelevant: true;
  methodology: "ISO 45001 + Fine-Kinney";
  generalEvaluation: string;
  assessmentItems: PhotoAssessmentItem[];
  riskRankingSummary: string;
};

type PhotoAnalysis = PhotoAnalysisNotRelevant | PhotoAnalysisRelevant;

type PhotoResultItem =
  | {
      fileName: string;
      ok: true;
      analysis: PhotoAnalysis;
      warnings?: string[];
    }
  | {
      fileName: string;
      ok: false;
      error?: string;
      userMessage: string;
      technicalMessage?: string;
      warnings?: string[];
    };

type PhotoApiResponse = {
  type: "photo";
  results: PhotoResultItem[];
  warnings?: string[];
  meta?: any;
};

type InspectionFinding = {
  text: string;
  priority: "Düşük" | "Orta" | "Yüksek";
  deadline?: string | null;
  lawReference?: string | null;
};

type InspectionApiResponse = {
  type: "inspection";
  findings: InspectionFinding[];
  warnings?: string[];
  meta?: any;
};

type ISGApiResponse = PhotoApiResponse | InspectionApiResponse;

/* -------------------- UI HELPERS -------------------- */

function RiskPill({ level }: { level: FineKinneyRiskLevel }) {
  const cls =
    level === "Çok yüksek"
      ? "bg-red-600 text-white"
      : level === "Yüksek"
      ? "bg-red-100 text-red-700"
      : level === "Önemli"
      ? "bg-orange-100 text-orange-700"
      : level === "Dikkate değer"
      ? "bg-amber-100 text-amber-700"
      : "bg-green-100 text-green-700";

  return (
    <span className={`text-xs px-3 py-1 rounded-full font-medium ${cls}`}>
      {level}
    </span>
  );
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <section className="flex gap-4 pt-6">
      <button
        onClick={onBack}
        className="px-6 py-3 rounded-xl border bg-white hover:bg-gray-50 flex items-center gap-2"
      >
        <ArrowLeft size={16} /> Geri Dön
      </button>
    </section>
  );
}

/* -------------------- PAGE -------------------- */

export default function ISGResultPage() {
  const router = useRouter();

  const [data, setData] = useState<ISGApiResponse | null>(null);
  const [photoPreviews, setPhotoPreviews] = useState<PhotoPreview[]>([]);

  // Load session data once
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("isg_result");
      if (!raw) {
        router.replace("/admin/isg/photo");
        return;
      }

      const parsed = JSON.parse(raw) as ISGApiResponse;
      if (!parsed || !parsed.type) {
        sessionStorage.removeItem("isg_result");
        router.replace("/admin/isg/photo");
        return;
      }

      setData(parsed);

      // If photo, also load previews
      if (parsed.type === "photo") {
        const rawPhotos = sessionStorage.getItem("isg_photo_previews");
        const previews = rawPhotos ? (JSON.parse(rawPhotos) as PhotoPreview[]) : [];
        setPhotoPreviews(Array.isArray(previews) ? previews : []);
      }
    } catch (err) {
      console.error("ISG_RESULT_PARSE_ERROR", err);
      sessionStorage.removeItem("isg_result");
      router.replace("/admin/isg/photo");
    }
  }, [router]);

  // Safe computed warning list
  const warnings = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data.warnings) ? data.warnings : [];
  }, [data]);

  if (!data) return null;

  return (
    <div className="bg-gray-50 px-4 md:px-6 py-10 md:py-14 text-gray-900">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* 🔶 WARNINGS BANNER (en üstte) */}
        {warnings.length > 0 && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            <div className="font-medium mb-2 flex items-center gap-2">
              <AlertTriangle size={16} />
              Bilgilendirme
            </div>
            <ul className="list-disc ml-5 space-y-1">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ✅ HEADER */}
        <header className="space-y-4">
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              <div className="font-medium mb-1">
                Yapay Zekâ Destekli Ön Değerlendirme
              </div>
              <p>
                Bu analiz otomatik sistem tarafından oluşturulmuştur. 
                İş Sağlığı ve Güvenliği kapsamında bağlayıcı kararlar öncesinde 
                yetkili A/B/C sınıfı iş güvenliği uzmanı tarafından saha doğrulaması yapılmalıdır.
              </p>
            </div>

          <div className="flex items-center gap-3 text-indigo-600">
            <ClipboardList />
            <h1 className="text-3xl font-semibold tracking-tight">
              {data.type === "photo" ? "İSG Değerlendirme Raporu" : "Denetim Tespitleri"}
            </h1>
          </div>

          <p className="text-gray-600 max-w-3xl leading-relaxed">
            {data.type === "photo"
              ? "Bu rapor, sahadan yüklenen fotoğrafın yapay zekâ destekli ön değerlendirmesi sonucunda oluşturulmuştur."
              : "Bu ekran, yüklenen denetim tutanağındaki tespitlerin otomatik olarak ayrıştırılmasıyla oluşturulmuştur."}
          </p>
        </header>

        {/* ✅ ANALYZED PHOTOS GRID (sadece photo) */}
        {data.type === "photo" && photoPreviews.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Analiz Edilen Fotoğraflar</h2>
              <span className="text-sm text-gray-500">{photoPreviews.length} adet görsel</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {photoPreviews.map((p, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-2xl border bg-white shadow-sm"
                >
                  <img
                    src={p.preview}
                    alt={p.name}
                    className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-xs text-white truncate">{p.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ✅ RESULTS (photo) */}
        {data.type === "photo" && (
          <section className="space-y-8">
            {data.results?.map((r, idx) => {
              const preview =
                photoPreviews.find(
                  (p) => p.name === r.fileName || p.name?.trim() === r.fileName?.trim()
                )?.preview || "";

              return (
                <div key={idx} className="rounded-2xl border bg-white p-6 shadow-sm space-y-5">
                  {/* File header */}
                  <div className="flex flex-col md:flex-row items-start gap-4">
                    {preview ? (
                      <img
                        src={preview}
                        alt={r.fileName}
                        className="h-48 w-full md:h-40 md:w-64 rounded-xl border object-cover"
                      />
                    ) : (
                      <div className="h-40 w-64 rounded-xl border bg-gray-100 flex items-center justify-center text-sm text-gray-400">
                        Ön izleme bulunamadı
                      </div>
                    )}

                    <div className="space-y-1">
                      <h2 className="font-semibold text-gray-900">{r.fileName}</h2>
                      <p className="text-sm text-gray-500">
                        {r.ok
                          ? r.analysis?.isgRelevant
                            ? `${(r.analysis as PhotoAnalysisRelevant).assessmentItems.length} adet risk tespiti`
                            : "İSG sahası değil"
                          : "Analiz başarısız"}
                      </p>
                    </div>
                  </div>

                  {/* ❌ ok === false */}
                  {!r.ok && (
                    <div className="rounded-lg bg-red-50 border border-red-300 p-4 text-sm text-red-700">
                      {r.userMessage || "Analiz yapılamadı."}
                    </div>
                  )}

                  {/* ✅ ok === true ama isgRelevant === false */}
                  {r.ok && r.analysis?.isgRelevant === false && (
                    <div className="rounded-lg bg-gray-50 border p-4 text-sm text-gray-700 space-y-2">
                      <p className="font-medium">İSG Sahası Tespit Edilmedi</p>
                      <p>{(r.analysis as PhotoAnalysisNotRelevant).sceneDescription}</p>
                      <p className="text-gray-500">
                        {(r.analysis as PhotoAnalysisNotRelevant).reason}
                      </p>
                    </div>
                  )}

                  {/* ✅ ok === true ve isgRelevant === true */}
                  {r.ok && r.analysis?.isgRelevant === true && (
                    <div className="space-y-6">
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-blue-900">
                        {(r.analysis as PhotoAnalysisRelevant).generalEvaluation}
                      </div>

                      <div className="space-y-4">
                        {(r.analysis as PhotoAnalysisRelevant).assessmentItems.map((item, i) => (
                          <div key={i} className="border rounded-xl p-4 space-y-2 bg-gray-50">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                              <div className="font-medium">
                                {item.priorityOrder}. {item.hazard}
                              </div>
                              <RiskPill level={item.riskLevel} />
                            </div>

                            <p className="text-sm text-gray-700">{item.observation}</p>

                            <div className="text-xs text-gray-600 flex flex-col sm:flex-row gap-2 sm:gap-4">
                              <span>Risk Skoru: {item.riskScore}</span>
                              <span>Uygunluk: {item.complianceStatus}</span>
                            </div>

                            {/* Recommended controls (short, non-binding) */}
                            <div className="text-sm text-gray-700 space-y-1">
                              {item.recommendedControls.elimination && (
                                <p>• Ortadan kaldırma: {item.recommendedControls.elimination}</p>
                              )}
                              {item.recommendedControls.substitution && (
                                <p>• İkame: {item.recommendedControls.substitution}</p>
                              )}
                              {item.recommendedControls.engineeringControls && (
                                <p>• Mühendislik: {item.recommendedControls.engineeringControls}</p>
                              )}
                              {item.recommendedControls.administrativeControls && (
                                <p>• İdari: {item.recommendedControls.administrativeControls}</p>
                              )}
                              {item.recommendedControls.ppe && (
                                <p>• KKD: {item.recommendedControls.ppe}</p>
                              )}
                            </div>

                            <div className="text-xs text-gray-500 break-words">
                              6331: {item.legalReference.primaryLaw}
                              <br />
                              Yönetmelik: {item.legalReference.regulation || "Belirtilmedi"}
                              <br />
                              ISO 45001: {item.legalReference.isoClause || "Belirtilmedi"}
                            </div>
                          </div>
                        ))}
                      </div>

                      <p className="text-xs text-gray-500">
                        {(r.analysis as PhotoAnalysisRelevant).riskRankingSummary}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {/* ✅ INSPECTION RESULT */}
        {data.type === "inspection" && (
          <section className="space-y-4">
            {data.findings?.map((f, i) => (
              <div key={i} className="rounded-xl border bg-white p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <FileSearch className="text-indigo-600" />
                  <p className="font-medium flex-1">{f.text}</p>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      f.priority === "Yüksek"
                        ? "bg-red-100 text-red-700"
                        : f.priority === "Orta"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {f.priority}
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  {f.deadline && (
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> Süre: {f.deadline}
                    </span>
                  )}
                  {f.lawReference && (
                    <span className="flex items-center gap-1">
                      <Scale size={14} /> {f.lawReference}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ✅ ACTIONS */}

        <BackButton
          onBack={() => {
            if (data.type === "photo") router.push("/admin/isg/photo");
            else router.push("/admin/premium/ocr/dashboard");
          }}
        />
      </div>
    </div>
  );
}
