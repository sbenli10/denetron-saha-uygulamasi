//APP\app\admin\isg\training\result\page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  ClipboardList,
  ShieldCheck,
  Users,
} from "lucide-react";

/* ================= TYPES ================= */

type TrainingResult = {
  summary: {
    overallStatus: string;
    riskLevel: string;
    note: string;
  };
  participants: Array<{
    name: string;
    status: string;
    evidence?: string | null;
  }>;
  missingTrainings: Array<{
    training: string;
    reason: string;
    riskLevel: string;
    relatedPeople?: string[];
  }>;
  suggestedPlan: Array<{
    training: string;
    targetGroup: string;
    duration: string;
    period: string;
    suggestedMonth: string;
    note: string;
  }>;
  warnings?: string[];
};

/* ================= KPI CARD ================= */

function KpiCard({
  title,
  value,
  tone,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  tone: "neutral" | "success" | "warning" | "danger";
  icon: any;
}) {
  const toneMap = {
    neutral: "border-gray-300",
    success: "border-green-500",
    warning: "border-yellow-500",
    danger: "border-red-500",
  };

  return (
    <div className={`rounded-xl border-l-4 ${toneMap[tone]} bg-white p-4`}>
      <div className="flex items-center gap-3">
        <Icon className="text-gray-500" size={20} />
        <div>
          <p className="text-xs text-gray-500">{title}</p>
          <p className="text-xl font-semibold">{value}</p>
        </div>
      </div>
    </div>
  );
}

/* ================= PAGE ================= */

export default function TrainingResultPage() {
  const [result, setResult] = useState<TrainingResult | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("isg_training_result");
    if (raw) {
      setResult(JSON.parse(raw));
    }
  }, []);

  if (!result) {
    return (
      <div className="p-12 text-center text-gray-500">
        Eğitim analiz sonucu bulunamadı.
      </div>
    );
  }

  const riskTone =
    result.summary.riskLevel === "Yüksek"
      ? "danger"
      : result.summary.riskLevel === "Orta"
      ? "warning"
      : "success";

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">

      {/* ===== HEADER ===== */}
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">
          İSG Eğitim Planlama Sonucu
        </h1>
        <p className="text-gray-600">
          Yüklenen belgeler doğrultusunda oluşturulan eğitim durumu ve planlama önerileri aşağıda yer almaktadır.
        </p>
      </header>

      {/* ===== KPI DASHBOARD ===== */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard
          title="Genel Durum"
          value={result.summary.overallStatus}
          tone="neutral"
          icon={ShieldCheck}
        />
        <KpiCard
          title="Risk Seviyesi"
          value={result.summary.riskLevel}
          tone={riskTone}
          icon={AlertTriangle}
        />
        <KpiCard
          title="Eksik / Riskli Eğitim"
          value={result.missingTrainings.length}
          tone="danger"
          icon={ClipboardList}
        />
        <KpiCard
          title="Planlanan Eğitim"
          value={result.suggestedPlan.length}
          tone="success"
          icon={Calendar}
        />
      </section>

      {/* ===== GENEL DEĞERLENDİRME ===== */}
      <section className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold mb-2">
          Genel Eğitim Değerlendirmesi
        </h2>
        <p className="text-gray-700 leading-relaxed">
          {result.summary.note}
        </p>
      </section>

      {/* ===== NEXT STEP INFO ===== */}
        <section className="rounded-xl border bg-blue-50 p-4 text-sm text-blue-800">
          <strong>Sonraki Adım:</strong>
          <br />
          Bu analiz, yıllık İSG eğitim planınız için bir yol haritası sunar.
          Eğitimlerin takibini yapabilmek, aylık görevler oluşturmak ve
          hatırlatmalar almak için planı sisteme almanız önerilir.
          Dilerseniz planı harici takviminize de aktarabilirsiniz.
        </section>


      {/* ===== RİSKLİ / EKSİK EĞİTİMLER ===== */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          Eksik veya Riskli Eğitimler
        </h2>

        {result.missingTrainings.length === 0 ? (
          <p className="text-sm text-gray-500">
            Eksik veya riskli eğitim tespit edilmedi.
          </p>
        ) : (
          <div className="space-y-3">
            {result.missingTrainings.map((m, i) => (
              <div
                key={i}
                className="rounded-xl border-l-4 border-red-500 bg-white p-4"
              >
                <div className="flex justify-between items-center">
                  <p className="font-medium">{m.training}</p>
                  <span className="text-sm text-red-600">
                    {m.riskLevel}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Durum: {m.reason}
                </p>
                {m.relatedPeople?.length ? (
                  <p className="text-xs text-gray-500 mt-1">
                    İlgili kişiler: {m.relatedPeople.join(", ")}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== ÖNERİLEN EĞİTİM PLANI ===== */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          Önerilen Yıllık Eğitim Planı
        </h2>

        <div className="space-y-3">
          {result.suggestedPlan.map((p, i) => (
            <div
              key={i}
              className="rounded-xl border bg-white p-4"
            >
              <div className="flex justify-between items-center">
                <p className="font-medium">{p.training}</p>
                <span className="text-sm text-indigo-600">
                  {p.suggestedMonth}
                </span>
              </div>

              <p className="text-sm text-gray-600 mt-1">
                Hedef Grup: {p.targetGroup}
              </p>
              <p className="text-sm text-gray-600">
                Süre: {p.duration} • Periyot: {p.period}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {p.note}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== AKSİYON BUTONLARI ===== */}
      <section className="flex flex-wrap gap-3 pt-6 border-t">
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-white">
          Yıllık Eğitim Planı (PDF)
        </button>
        <button className="rounded-lg border px-4 py-2">
          Excel’e Aktar
        </button>
        {/* ===== AKSİYONLAR ===== */}
        
          {/* Sisteme Alma */}
          <button
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
            onClick={async () => {
              await fetch("/api/admin/isg/analyze/annual-plan/seed-executions", {
                method: "POST",
              });
              alert("Yıllık eğitim planı sisteme alındı. Aylık görevler oluşturuldu.");
            }}
          >
            📌 Planı Sisteme Al
          </button>

          {/* Takvim */}
          <a
            href="/api/admin/isg/analyze/annual-plan/ics"
            className="rounded-lg border px-4 py-2 hover:bg-gray-50"
          >
            📅 Takvime Aktar (ICS)
          </a>
      </section>
    </div>
  );
}
