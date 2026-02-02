import { LiveRisk } from "@/components/operator/VisionOverlay";

type Props = {
  risks: LiveRisk[];
};

export default function AIResultCard({ risks }: Props) {
  if (!risks || risks.length === 0) {
    return (
      <section className="rounded-2xl border border-white/10 bg-black/70 p-5">
        <h3 className="text-sm font-semibold text-white">
          AI Detaylı Risk Raporu
        </h3>
        <p className="mt-2 text-sm text-white/60">
          Bu karede AI tarafından fark ettirilen bir risk bulunmadı.
        </p>
      </section>
    );
  }

  /* ================= GROUPING ================= */

  const grouped = {
    high: risks.filter(r => r.severity === "high"),
    medium: risks.filter(r => r.severity === "medium"),
    low: risks.filter(r => r.severity === "low"),
  };

  /* ================= IMMEDIATE ACTIONS ================= */
  // mitigation alanlarını tekilleştir
  const immediateActions = Array.from(
    new Set(
      risks
        .map(r => r.mitigation)
        .filter(
          (m): m is string =>
            typeof m === "string" && m.trim().length > 0
        )
    )
  );

  /* ================= SUB COMPONENTS ================= */

  function RiskBlock({ r }: { r: LiveRisk }) {
    return (
      <div className="space-y-2 border-b border-white/10 pb-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-white">
            {r.label}
          </div>
          {typeof r.confidence === "number" && (
            <div className="text-xs text-white/60">
              %{Math.round(r.confidence * 100)}
            </div>
          )}
        </div>

        {r.awareness && (
          <div className="text-sm text-white/75 leading-relaxed">
            <b className="text-white/90">Neden risk:</b>{" "}
            {r.awareness}
          </div>
        )}

        {r.mitigation && (
          <div className="text-sm text-emerald-300/90 leading-relaxed">
            <b>Ne yapılmalı:</b> {r.mitigation}
          </div>
        )}

        {r.consequence && (
          <div className="text-sm text-red-300/80 leading-relaxed">
            <b>Önlem alınmazsa:</b> {r.consequence}
          </div>
        )}
      </div>
    );
  }

  function Section({
    title,
    risks,
  }: {
    title: string;
    risks: LiveRisk[];
  }) {
    if (!risks || risks.length === 0) return null;

    return (
      <section className="space-y-4">
        <h4 className="text-sm font-semibold text-amber-400">
          {title}
        </h4>
        {risks.map(r => (
          <RiskBlock key={r.id} r={r} />
        ))}
      </section>
    );
  }

  /* ================= RENDER ================= */

  return (
    <section className="rounded-2xl border border-white/10 bg-black/70 p-5 space-y-6">
      <header>
        <h3 className="text-sm font-semibold text-white">
          AI Detaylı Risk Raporu
        </h3>
        <p className="mt-1 text-xs text-white/50">
          Bu rapor farkındalık amaçlıdır. Nihai değerlendirme
          operatöre aittir.
        </p>
      </header>

      <Section title="🔴 Yüksek Riskler" risks={grouped.high} />
      <Section title="🟠 Orta Riskler" risks={grouped.medium} />
      <Section title="🟢 Düşük Riskler" risks={grouped.low} />

      {immediateActions.length > 0 && (
        <section className="pt-4 border-t border-white/10">
          <h4 className="text-sm font-semibold text-emerald-400 mb-2">
            ⚡ Hemen Yapılacaklar
          </h4>
          <ul className="list-disc list-inside text-sm text-white/85 space-y-1">
            {immediateActions.map((action, i) => (
              <li key={i}>{action}</li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
