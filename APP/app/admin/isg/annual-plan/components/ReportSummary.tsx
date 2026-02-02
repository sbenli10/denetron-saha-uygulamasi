// APP/app/admin/isg/annual-plan/components/ReportSummary.tsx

import { AuditorSummary } from "./types";

/* -------------------------------------------------- */
/* UI helpers                                         */
/* -------------------------------------------------- */

function statusStyle(status: string) {
  switch (status) {
    case "Uygun":
      return "bg-green-50 border-green-200 text-green-800";
    case "Kısmen Uygun":
      return "bg-yellow-50 border-yellow-200 text-yellow-800";
    case "Uygun Değil":
      return "bg-red-50 border-red-200 text-red-800";
    default:
      return "bg-gray-50 border-gray-200 text-gray-700";
  }
}

function riskText(risk: string) {
  switch (risk) {
    case "Düşük":
      return "text-green-700";
    case "Orta":
      return "text-yellow-700";
    case "Yüksek":
      return "text-red-700";
    default:
      return "text-gray-700";
  }
}

/* -------------------------------------------------- */
/* Component                                          */
/* -------------------------------------------------- */

export default function ReportSummary({
  summary,
}: {
  summary: AuditorSummary;
}) {
  const {
    generalStatus = "Belirtilmemiş",
    riskLevel = "Belirtilmemiş",
    auditorOpinion,
    documents = [],
  } = summary;

  return (
    <section className="rounded-2xl border bg-white p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          🧠 Denetçi Genel Değerlendirmesi
        </h2>

        <span
          className={`px-4 py-1.5 rounded-full text-sm font-medium border ${statusStyle(
            generalStatus
          )}`}
        >
          {generalStatus}
        </span>
      </div>

      {/* META */}
      <div className="flex flex-wrap gap-8 text-sm">
        <div>
          <p className="text-gray-500">Denetim Riski</p>
          <p className={`font-semibold ${riskText(riskLevel)}`}>
            {riskLevel}
          </p>
        </div>

        <div>
          <p className="text-gray-500">Değerlendirilen Belgeler</p>
          <p className="font-medium">
            {documents.length || "—"} adet
          </p>
        </div>
      </div>

      {/* DOCUMENTS */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Denetim Kapsamı
          </p>
          <ul className="space-y-1 text-sm text-gray-600 list-disc ml-5">
            {documents.map((doc, i) => (
              <li key={i}>
                {doc.docType ?? "Yüklenen Belge"}
                {doc.year && ` (${doc.year})`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AUDITOR OPINION */}
      {auditorOpinion && (
        <div className="rounded-xl border bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-800 mb-1">
            Denetçi Görüşü (Özet)
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {auditorOpinion}
          </p>
        </div>
      )}

      {/* OCR NOTE – şimdilik kapalı, ileride açılır */}
      {/*
      {summary.ocrWarning && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          ⚠️ OCR Uyarısı: Bazı belgelerde okunabilirlik düşüktür.
        </div>
      )}
      */}
    </section>
  );
}
