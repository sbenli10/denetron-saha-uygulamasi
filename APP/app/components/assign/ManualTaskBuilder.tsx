//APP\app\components\assign\ManualTaskBuilder.tsx
"use client";

import { useState } from "react";
import { TemplateDTO, OperatorDTO } from "./types";
import TemplatePicker from "./TemplatePicker";
import OperatorPickerPanel from "./OperatorPickerPanel";
import OperatorDragDrop from "./OperatorDragDrop";

interface ManualTaskBuilderProps {
  templates: TemplateDTO[];
  operators: OperatorDTO[];
  action: (...args: any[]) => Promise<any>;
}


const cardBase =
  "relative rounded-2xl bg-white/80 border border-slate-200 " +
  "backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.15)]";

export default function ManualTaskBuilder({
  templates,
  operators,
  action,
}: ManualTaskBuilderProps) {
  const [templateId, setTemplateId] = useState("");
  const [operatorIds, setOperatorIds] = useState<string[]>([]);

  return (
    <form action={action} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
      {/* HIDDEN FIELDS → SERVER ACTION’A GİDER */}
      <input type="hidden" name="template_id" value={templateId} />
      <input
        type="hidden"
        name="operator_ids"
        value={JSON.stringify(operatorIds)}
      />


      {/* LEFT */}
      <div className="lg:col-span-2 space-y-8">
        <div className={`${cardBase} p-6`}>
          <h2 className="text-lg font-semibold mb-4">Şablon Seçimi</h2>
          <TemplatePicker
            templates={templates}
            value={templateId}
            onChange={setTemplateId}
          />
        </div>

        <div className={`${cardBase} p-6`}>
          <h2 className="text-lg font-semibold mb-4">Operatör Seçimi</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <OperatorPickerPanel
              operators={operators}
              selected={operatorIds}
              onAdd={(id) =>
                !operatorIds.includes(id) &&
                setOperatorIds([...operatorIds, id])
              }
            />

            <OperatorDragDrop
              operators={operators}
              value={operatorIds}
              onChange={setOperatorIds}
              onRemove={(id) =>
                setOperatorIds(operatorIds.filter((x) => x !== id))
              }
            />
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className={`${cardBase} p-6 h-fit`}>
        <h3 className="text-xl font-semibold mb-4">Görev Özeti</h3>

        <button
        type="submit"
        disabled={!templateId || operatorIds.length === 0}
        className="
          w-full py-3 rounded-xl font-semibold
          bg-amber-400 hover:bg-amber-500
          disabled:bg-slate-200 disabled:cursor-not-allowed
        "
      >
        Görevi Kaydet
      </button>
      </div>
    </form>
  );
}
