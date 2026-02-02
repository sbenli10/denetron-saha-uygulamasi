//APP\app\admin\isg\result\page.tsx
"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowLeft,
  ClipboardList,
  FileSearch,
  Clock,
  Scale,
} from "lucide-react";

/* -------------------- TYPES -------------------- */

type RiskLevel = "Düşük" | "Orta" | "Yüksek";

interface AssessmentItem {
  title: string;
  riskLevel: RiskLevel;
  riskDescription: string;
  suggestedAction: string;
  law?: string;
  sourceFile?: string; // ← EKLENDİ
}

interface PhotoRiskGroup {
  fileName: string;
  preview: string;
  risks: AssessmentItem[];
}


interface InspectionFinding {
  text: string;
  priority: RiskLevel;
  deadline?: string | null;
  lawReference?: string | null;
}

interface PhotoResultPayload {
  fileName: string;
  ocrText: string;
  assessmentItems: AssessmentItem[];
}

interface PhotoPreview {
  name: string;
  preview: string;
}

interface PhotoISGResult {
  type: "photo";
  photoGroups: PhotoRiskGroup[];
  warnings?: string[];
}

type ISGResult = PhotoISGResult | InspectionISGResult;


interface InspectionISGResult {
  type: "inspection";
  findings: InspectionFinding[];
}



/* -------------------- PAGE -------------------- */

export default function ISGResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<ISGResult | null>(null);
  const [photoPreviews, setPhotoPreviews] = useState<
  { name: string; preview: string }[]
  >([]);

  

  useEffect(() => {
  try {
    const raw = sessionStorage.getItem("isg_result");

    if (!raw) {
      router.replace("/admin/isg/photo");
      return;
    }

    const parsed = JSON.parse(raw);

    if (!parsed || !parsed.type) {
      sessionStorage.removeItem("isg_result");
      router.replace("/admin/isg/photo");
      return;
    }

    /* ===== PHOTO RESULT (GROUPED BY PHOTO) ===== */
    if (parsed.type === "photo" && Array.isArray(parsed.results)) {
      const rawPhotos = sessionStorage.getItem("isg_photo_previews");
      const previews: PhotoPreview[] = rawPhotos
        ? JSON.parse(rawPhotos)
        : [];

      const photoGroups: PhotoRiskGroup[] = parsed.results.map((r: any) => {
        const matchedPhoto = previews.find(
          (p: PhotoPreview) =>
            p.name === r.fileName ||
            p.name.trim() === r.fileName.trim()
        );

        return {
          fileName: r.fileName,
          preview: matchedPhoto?.preview || "",
          risks: Array.isArray(r.assessmentItems)
            ? r.assessmentItems
            : [],
        };
      });


      setResult({
        type: "photo",
        photoGroups,
        warnings: parsed.warnings ?? [],
      });
       
      console.log("PHOTO PREVIEWS FROM STORAGE:", previews);
      console.log("BACKEND RESULTS:", parsed.results);

      return;
    }

    /* ===== INSPECTION RESULT ===== */
    setResult(parsed);
  } catch (err) {
    console.error("ISG_RESULT_PARSE_ERROR", err);
    sessionStorage.removeItem("isg_result");
    router.replace("/admin/isg/photo");
  }
}, [router]);



  if (!result) return null;

  return (
    <div className="bg-gray-50 px-6 py-14 text-gray-900">
      <div className="max-w-6xl mx-auto space-y-12">

        {/* HEADER */}
        <header className="space-y-4">
          <div className="flex items-center gap-3 text-indigo-600">
            <ClipboardList />
            <h1 className="text-3xl font-semibold tracking-tight">
              {result.type === "photo"
                ? "İSG Değerlendirme Raporu"
                : "Denetim Tespitleri"}
            </h1>
          </div>

          <p className="text-gray-600 max-w-3xl leading-relaxed">
            {result.type === "photo"
              ? "Bu rapor, sahadan yüklenen fotoğrafın yapay zekâ destekli ön değerlendirmesi sonucunda oluşturulmuştur."
              : "Bu ekran, yüklenen denetim tutanağındaki tespitlerin otomatik olarak ayrıştırılmasıyla oluşturulmuştur."}
          </p>
        </header>

        {/* ANALYZED PHOTOS */}
          {result.type === "photo" && photoPreviews.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                  Analiz Edilen Fotoğraflar
                </h2>
                <span className="text-sm text-gray-500">
                  {photoPreviews.length} adet görsel
                </span>
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


        {result.type === "photo" && (
          <PhotoResult
            groups={result.photoGroups}
            onBack={() => router.push("/admin/isg/photo")}
          />
        )}


        {/* INSPECTION RESULT */}
        {result.type === "inspection" && result.findings && (
          <InspectionResult
            findings={result.findings}
            onBack={() => router.push("/admin/isg")}
          />
        )}
      </div>
    </div>
  );
}

/* ---------------- PHOTO RESULT ---------------- */

function PhotoResult({
  groups,
  onBack,
}: {
  groups: PhotoRiskGroup[];
  onBack: () => void;
}) {
  return (
    <>
      <section className="space-y-10">
        {groups.map((group, i) => (
          <div
            key={i}
            className="rounded-2xl border bg-white p-6 shadow-sm space-y-6"
          >
            {/* PHOTO HEADER */}
            <div className="flex items-start gap-6">
              {group.preview ? (
                  <img
                    src={group.preview}
                    alt={group.fileName}
                    className="h-40 w-64 rounded-xl border object-cover"
                  />
                ) : (
                  <div className="h-40 w-64 rounded-xl border bg-gray-100 flex items-center justify-center text-sm text-gray-400">
                    Ön izleme bulunamadı
                  </div>
                )}


              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">
                  {group.fileName}
                </h3>
                <p className="text-sm text-gray-500">
                  {group.risks.length} adet risk tespiti
                </p>
              </div>
            </div>

            {/* RISKS */}
            <div className="space-y-4">
              {group.risks.map((risk, j) => (
                <RiskRow key={j} item={risk} />
              ))}
            </div>
          </div>
        ))}
      </section>

      <Actions onBack={onBack} showDof />
    </>
  );
}


/* ---------------- INSPECTION RESULT ---------------- */

function InspectionResult({
  findings,
  onBack,
}: {
  findings: InspectionFinding[];
  onBack: () => void;
}) {
  return (
    <>
      <section className="space-y-4">
        {findings.map((f, i) => (
          <div
            key={i}
            className="rounded-xl border bg-white p-6 space-y-3"
          >
            <div className="flex items-center gap-3">
              <FileSearch className="text-indigo-600" />
              <p className="font-medium flex-1">{f.text}</p>
              <RiskBadge level={f.priority} />
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

      <Actions onBack={onBack} />
    </>
  );
}

/* ---------------- SHARED ---------------- */

function Actions({
  onBack,
  showDof,
}: {
  onBack: () => void;
  showDof?: boolean;
}) {
  return (
    <section className="flex gap-4 pt-6">
      <button
        onClick={onBack}
        className="px-6 py-3 rounded-xl border bg-white hover:bg-gray-50"
      >
        <ArrowLeft size={16} /> Geri Dön
      </button>

      {/* {showDof && (
        <button className="px-6 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700">
          DÖF’e Dönüştür
        </button>
      )} */}
    </section>
  );
}

/* ---------------- UI HELPERS ---------------- */

function RiskBadge({ level }: { level: RiskLevel }) {
  const styles =
    level === "Yüksek"
      ? "bg-red-100 text-red-700"
      : level === "Orta"
      ? "bg-amber-100 text-amber-700"
      : "bg-green-100 text-green-700";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles}`}>
      {level}
    </span>
  );
}

function RiskRow({ item }: { item: AssessmentItem }) {
  const meta =
    item.riskLevel === "Yüksek"
      ? { icon: AlertTriangle, badge: "bg-red-100 text-red-700" }
      : item.riskLevel === "Orta"
      ? { icon: Info, badge: "bg-amber-100 text-amber-700" }
      : { icon: CheckCircle2, badge: "bg-green-100 text-green-700" };

  const Icon = meta.icon;

  return (
    <div className="rounded-xl border bg-gray-50 p-4 space-y-2">
      <div className="flex items-center gap-3">
        <Icon className="text-gray-700" />
        <h4 className="font-medium flex-1">{item.title}</h4>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${meta.badge}`}>
          {item.riskLevel}
        </span>
      </div>

      <p className="text-sm text-gray-700">
        <strong>Risk:</strong> {item.riskDescription}
      </p>

      <p className="text-sm text-gray-700">
        <strong>Öneri:</strong> {item.suggestedAction}
      </p>

      {item.law && (
        <p className="text-xs text-gray-500">
          <strong>Mevzuat:</strong> {item.law}
        </p>
      )}
    </div>
  );
}

