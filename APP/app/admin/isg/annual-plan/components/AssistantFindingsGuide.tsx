import { AnnualPlanAnalysis } from "./types";

type Props = {
  summary: AnnualPlanAnalysis["summary"];
};

export function AssistantFindingsGuide({ summary }: Props) {
  if (!summary.criticalFindings.length) return null;

  return (
    <div className="space-y-3">
      <p className="font-medium text-sm text-gray-800">
        🔎 Dikkat etmen gereken noktalar:
      </p>

      <ul className="space-y-2">
        {summary.criticalFindings.map((f, i) => (
          <li
            key={i}
            className="bg-white rounded-lg p-3 text-sm text-gray-700"
          >
            {f}
            <p className="mt-1 text-xs text-gray-500">
              Denetimde bu konu özellikle sorulabilir.
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
