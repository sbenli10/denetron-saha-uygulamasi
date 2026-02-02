// APP/app/admin/isg/annual-plan/components/ActionList.tsx
"use client";

import { CheckCircle, Clock } from "lucide-react";
import { AssistantAction } from "./types";

type Props = {
  actions: AssistantAction[];
  onApply: (id: string) => void;
};

export default function ActionList({ actions, onApply }: Props) {
  if (!actions.length) return null;

  return (
    <div className="rounded-xl border bg-white p-6 space-y-4">
      <h2 className="text-lg font-semibold">
        🛠️ Asistanın Önerdiği Aksiyonlar
      </h2>

      <p className="text-sm text-gray-600">
        Bu aksiyonlar denetim riskini düşürmek için önerilmektedir.
        Uygulanan her adım denetim izi olarak kaydedilir.
      </p>

      <ul className="space-y-3">
        {actions.map((action) => {
          const applied = action.status === "applied";

          return (
            <li
              key={action.id}
              className={`flex items-start justify-between gap-4 rounded-lg border p-4 transition
                ${applied ? "bg-green-50 border-green-200" : "bg-gray-50"}
              `}
            >
              <div className="flex gap-3">
                {applied ? (
                  <CheckCircle className="text-green-600 mt-0.5" size={20} />
                ) : (
                  <Clock className="text-gray-400 mt-0.5" size={20} />
                )}

                <div>
                  <p className="text-sm text-gray-800">{action.text}</p>

                  {applied && action.appliedAt && (
                    <p className="text-xs text-green-700 mt-1">
                      {new Date(action.appliedAt).toLocaleDateString("tr-TR")} tarihinde uygulandı
                    </p>
                  )}
                </div>
              </div>

              {/* {!applied ? (
                <button
                  onClick={() => onApply(action.id)}
                  className="shrink-0 rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
                >
                  Uygula
                </button>
              ) : (
                <span className="text-xs font-medium text-green-700">
                  ✔ Uygulandı
                </span>
              )} */}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
