// APP/app/components/assign/OperatorPickerPanel.tsx
"use client";

import { OperatorDTO } from "./types";
import { UserPlus } from "lucide-react";

interface Props {
  operators: OperatorDTO[];
  selected: string[];
  onAdd: (id: string) => void;
}

export default function OperatorPickerPanel({
  operators,
  selected,
  onAdd,
}: Props) {
  return (
    <div className="p-5 bg-slate-800/40 rounded-xl border border-slate-700 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <UserPlus size={18} className="text-amber-400" />
        <h3 className="text-sm font-semibold text-slate-200 tracking-wide">
          Operatör Ekle
        </h3>
      </div>

      <div className="max-h-80 overflow-y-auto pe-2 space-y-2">
        {operators
          .filter((o) => !selected.includes(o.id))
          .map((o) => (
            <button
              key={o.id}
              onClick={() => onAdd(o.id)}
              className="
                w-full text-left p-4 rounded-lg border transition relative
                bg-slate-900/40 border-slate-700
                hover:bg-slate-800 hover:border-amber-400/30
                group
              "
            >
              <div className="absolute inset-0 rounded-lg bg-amber-400/10 opacity-0 group-hover:opacity-5 transition" />

              <div className="relative">
                <div className="text-slate-100 font-medium">
                  {o.full_name ?? "İsimsiz operatör"}
                </div>
                <div className="text-xs text-slate-400 mt-1">{o.email}</div>
              </div>
            </button>
          ))}

        {operators.filter((o) => !selected.includes(o.id)).length === 0 && (
          <div className="text-slate-500 text-sm text-center py-4">
            Eklenebilir operatör kalmadı.
          </div>
        )}
      </div>
    </div>
  );
}
