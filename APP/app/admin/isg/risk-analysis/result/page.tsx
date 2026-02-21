//APP\app\admin\isg\risk-analysis\result\page.tsx
"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ShieldAlert,
  ClipboardCheck,
  Scale,
  TrendingUp,
} from "lucide-react";

/* -------------------- TYPES -------------------- */

type RiskAnalysisApiResponse = {
  success: boolean;
  type: "risk-analysis";
  fileName: string;
  primarySheetName?: string;
  analysis: any | null;
  deterministic?: any | null;
  warnings?: string[];
  meta?: any;
};

export default function RiskAnalysisResultPage() {
  const router = useRouter();
  const [data, setData] = useState<RiskAnalysisApiResponse | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("risk_analysis_result");

    if (!raw) {
      router.replace("/admin/isg/risk-analysis");
      return;
    }

    try {
      const parsed = JSON.parse(raw);

      if (parsed.type !== "risk-analysis") {
        router.replace("/admin/isg/risk-analysis");
        return;
      }

      setData(parsed);
    } catch {
      router.replace("/admin/isg/risk-analysis");
    }
  }, [router]);

  // page.tsx içindeki analysis useMemo bloğunu bu haliyle değiştir
    const analysis = useMemo(() => {
      if (!data) return null;

      // AI Başarılıysa
      if (data.analysis && data.analysis.topRisks) {
        return {
          ...data.analysis,
          // Eğer AI stats göndermeyi unuttuysa deterministic'den çek
          stats: data.analysis.stats || data.deterministic,
          managementActionPlan: data.analysis.managementActionPlan || [],
          complianceGaps: data.analysis.complianceGaps || []
        };
      }

      // AI Başarısızsa veya Fallback modundaysa
      if (data.deterministic) {
        return {
          documentSummary: "Analiz özeti oluşturuluyor...",
          stats: data.deterministic,
          topRisks: data.deterministic.topRisks || [],
          managementActionPlan: [],
          complianceGaps: []
        };
      }

      return null;
    }, [data]);

    const highRiskCount = useMemo(() => {
    if (!analysis?.topRisks) return 0;

    return analysis.topRisks.filter(
        (r: any) =>
        r.riskLevel === "Yüksek" ||
        r.riskLevel === "Çok yüksek"
    ).length;
    }, [analysis]);

    if (!data) return null;


  return (
    <div className="bg-gray-50 min-h-screen px-4 md:px-6 py-12">
      <div className="max-w-6xl mx-auto space-y-12">

        {/* AI DISCLAIMER */}
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
          <div className="font-semibold mb-1">
            Yapay Zekâ Destekli Ön Değerlendirme
          </div>
          <p>
            Bu analiz otomatik sistem tarafından oluşturulmuştur. Nihai karar öncesinde
            6331 sayılı Kanun kapsamında yetkili iş güvenliği uzmanı tarafından
            doğrulanmalıdır.
          </p>
        </div>

        {/* HEADER */}
        <header className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Risk Analizi Yönetim Özeti
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Dosya: <strong>{data.fileName}</strong> • Sayfa:{" "}
            {data.primarySheetName || "Belirsiz"}
          </p>
        </header>

        {/* SUMMARY CARDS */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">

         {/* Toplam Risk Kartı Örneği */}
          <StatCard
            icon={<ShieldAlert size={20} />}
            title="Toplam Risk"
            value={analysis?.stats?.rowsEstimated ?? "-"}
          />

          <StatCard
            icon={<TrendingUp size={20} />}
            title="Skorlu Risk"
            value={analysis?.stats?.scoredRowsEstimated ?? "-"}
          />

          <StatCard
            icon={<AlertTriangle size={20} />}
            title="Yüksek / Çok Yüksek"
            value={highRiskCount}
            danger
          />

          <StatCard
            icon={<ClipboardCheck size={20} />}
            title="En Yüksek Skor"
            value={analysis?.stats?.highestRiskScore ?? "-"}
          />
        </section>

        {/* DOCUMENT SUMMARY */}
        <SectionCard title="Belge Değerlendirme Özeti">
          <p className="text-sm text-gray-700">
            {analysis?.documentSummary}
          </p>
        </SectionCard>

        {/* TOP RISKS */}
        <SectionCard title="Kritik Riskler">
          <div className="space-y-4">
            {analysis?.topRisks?.map((risk: any) => (
              <div
                key={risk.rank}
                className="rounded-xl border bg-gray-50 p-5 space-y-3"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">
                    {risk.rank}. {risk.hazard}
                  </h3>
                  <RiskBadge level={risk.riskLevel} />
                </div>

                <p className="text-sm text-gray-700">
                  {risk.observation}
                </p>

                <div className="text-xs text-gray-600">
                  Risk Skoru: {risk.riskScore ?? "Belirsiz"}
                </div>

                {/* Actions */}
                <div className="mt-3 space-y-1 text-sm">
                  {risk.recommendedActions?.map(
                    (a: string, i: number) => (
                      <div key={i}>• {a}</div>
                    )
                  )}
                </div>

                <div className="text-xs text-gray-500 mt-2">
                  6331: {risk.legalReference?.primaryLaw}
                  <br />
                  Yönetmelik: {risk.legalReference?.regulation || "Belirsiz"}
                  <br />
                  ISO 45001: {risk.legalReference?.isoClause || "Belirsiz"}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* COMPLIANCE GAPS */}
        <SectionCard title="Mevzuat Uyumsuzlukları">
          {analysis?.complianceGaps?.length === 0 && (
            <p className="text-sm text-gray-600">
              Kritik mevzuat boşluğu tespit edilmedi.
            </p>
          )}

          {analysis?.complianceGaps?.map((gap: any, i: number) => (
            <div key={i} className="border rounded-xl p-4 bg-white">
              <div className="flex justify-between">
                <span className="font-medium">{gap.gap}</span>
                <span className="text-xs text-red-600">
                  {gap.impact}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                6331 sayılı İş Sağlığı ve Güvenliği Kanunu
              </div>
            </div>
          ))}
        </SectionCard>

        {/* MANAGEMENT ACTION PLAN */}
        <SectionCard title="Yönetim Aksiyon Planı">
          {analysis?.managementActionPlan?.map(
            (action: any, i: number) => (
              <div
                key={i}
                className="border rounded-xl p-4 bg-gray-50"
              >
                <div className="font-medium">
                  {action.action}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Öncelik: {action.priority} •
                  Sorumlu: {action.ownerRole} •
                  Süre: {action.deadline}
                </div>
              </div>
            )
          )}
        </SectionCard>

        {/* BACK BUTTON */}
        <button
          onClick={() =>
            router.push("/admin/isg/risk-analysis")
          }
          className="flex items-center gap-2 px-6 py-3 rounded-xl border bg-white hover:bg-gray-100"
        >
          <ArrowLeft size={16} />
          Yeni Risk Analizi Yükle
        </button>

      </div>
    </div>
  );
}

/* -------------------- COMPONENTS -------------------- */

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="bg-white rounded-2xl border p-6 space-y-4 shadow-sm">
        {children}
      </div>
    </section>
  );
}

function StatCard({
  icon,
  title,
  value,
  danger,
}: {
  icon: React.ReactNode;
  title: string;
  value: any;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 border bg-white shadow-sm space-y-2 ${
        danger ? "border-red-300" : "border-gray-200"
      }`}
    >
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {icon}
        {title}
      </div>
      <div
        className={`text-2xl font-semibold ${
          danger ? "text-red-600" : "text-gray-900"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const map: any = {
    "Çok yüksek": "bg-red-600 text-white",
    "Yüksek": "bg-red-100 text-red-700",
    "Önemli": "bg-orange-100 text-orange-700",
    "Dikkate değer": "bg-amber-100 text-amber-700",
    "Kabul edilebilir": "bg-green-100 text-green-700",
  };

  return (
    <span
      className={`text-xs px-3 py-1 rounded-full font-medium ${
        map[level] || "bg-gray-100 text-gray-700"
      }`}
    >
      {level}
    </span>
  );
}
