// APP/app/admin/isg/annual-plan/components/DocumentAnalysis.tsx
import { PlanItem } from "./types";

function renderNote(item: PlanItem) {
  if (!item.auditorNote) {
    return (
      <span className="text-green-700 text-sm font-medium">
        Planlı
      </span>
    );
  }

  const note = item.auditorNote.toLowerCase();

  if (note.includes("risk") || note.includes("belirtilmemiş")) {
    return (
      <p className="text-sm text-orange-700">
        ⚠️ {item.auditorNote}
      </p>
    );
  }

  if (note.includes("kritik")) {
    return (
      <p className="text-sm text-red-700 font-medium">
        🔴 {item.auditorNote}
      </p>
    );
  }

  // default sadeleştirme
  return (
    <span className="text-green-700 text-sm font-medium">
      Planlı
    </span>
  );
}

export default function DocumentAnalysis({
  items,
}: {
  items: PlanItem[];
}) {
  return (
    <section className="space-y-6">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        📄 Faaliyet Bazlı Denetçi Analizi
      </h3>

      {items.map((item, idx) => (
        <div
          key={idx}
          className="rounded-xl border bg-white p-5 space-y-3"
        >
          {/* HEADER */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-medium text-gray-900">
              {item.activity}
            </h4>

            <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600">
              {item.period}
            </span>
          </div>

          {/* MONTHS */}
          <p className="text-sm text-gray-600">
            Aylar:{" "}
            {item.months.length
              ? item.months.join(", ")
              : "Belirtilmemiş"}
          </p>

          {/* NOTE */}
          <div>{renderNote(item)}</div>
        </div>
      ))}
    </section>
  );
}
