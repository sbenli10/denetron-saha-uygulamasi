// APP/app/admin/isg/annual-plan/components/AssistantPanel.tsx

import { AnnualPlanAnalysis, AuditorSummary } from "./types";
import { AssistantFindingsGuide } from "./AssistantFindingsGuide";
import { AssistantTraceability } from "./AssistantTraceability";

type Props = {
  analysis: AnnualPlanAnalysis;
};

export default function AssistantPanel({ analysis }: Props) {
  const { summary } = analysis;
  const criticalCount = summary.criticalFindings?.length ?? 0;

  return (
    <div className="rounded-2xl border bg-indigo-50 p-6 space-y-6">
      {/* HEADER */}
      <div className="space-y-1">
        <p className="text-sm font-semibold text-indigo-700">
          🧠 İSG Denetçi Asistanı
        </p>

        <p className="text-base text-gray-800">
          {criticalCount === 0
            ? "Belgelerinizi inceledim. Denetim açısından kritik bir eksiklik tespit etmedim."
            : `Belgelerinizi inceledim. Denetimde sorun yaratabilecek ${criticalCount} kritik nokta tespit ettim.`}
        </p>
      </div>

      {/* KRİTİK BULGULAR */}
      {criticalCount > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <h4 className="font-semibold text-red-700 mb-3">
            ❗ Kritik Denetim Bulguları
          </h4>

          <ul className="list-disc list-inside text-sm text-red-700 space-y-2">
            {summary.criticalFindings!.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>

          <p className="mt-3 text-xs text-red-600">
            Bu bulgular denetimde doğrudan soru konusu olabilir.
            Düzeltici adımlar denetim riskini düşürür.
          </p>
        </div>
      )}

      
      <AssistantTraceability />
    </div>
  );
}

/* -------------------------------------------------- */
/* Helper: denetçi giriş mesajı                       */
/* -------------------------------------------------- */
function buildIntroMessage(summary: AuditorSummary): string {
  const count = summary.criticalFindings?.length ?? 0;

  if (count === 0) {
    return (
      "Belgelerinizi inceledim. Denetim açısından kritik bir risk tespit etmedim. " +
      "Mevcut yapı genel olarak mevzuata uygun görünüyor."
    );
  }

  return (
    `Belgelerinizi inceledim. Denetimde sorun yaratabilecek ` +
    `${count} kritik nokta tespit ettim. ` +
    `Bunları birlikte ele alarak denetim riskini düşürebiliriz.`
  );
}
