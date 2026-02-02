// APP/app/components/assign/AssignForm.tsx
"use client";

import { useState } from "react";
import TemplatePicker from "./TemplatePicker";
import OperatorDragDrop from "./OperatorDragDrop";
import OperatorPickerPanel from "./OperatorPickerPanel";
import { TemplateDTO, OperatorDTO } from "./types";

interface Props {
  templates: TemplateDTO[];
  operators: OperatorDTO[];
  action: (fd: FormData) => void;
}

export default function AssignForm({ templates, operators, action }: Props) {
  const [templateId, setTemplateId] = useState("");
  const [selectedOperators, setSelectedOperators] = useState<string[]>([]);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("template_id", templateId);
    fd.append("operator_ids", JSON.stringify(selectedOperators));
    action(fd);
  };

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      <TemplatePicker templates={templates} value={templateId} onChange={setTemplateId} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <OperatorPickerPanel
          operators={operators}
          selected={selectedOperators}
          onAdd={(id) => setSelectedOperators([...selectedOperators, id])}
        />

        <OperatorDragDrop
          operators={operators}
          value={selectedOperators}
          onChange={setSelectedOperators}
          onRemove={(id) =>
            setSelectedOperators(selectedOperators.filter((x) => x !== id))
          }
        />
      </div>

      <button className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg">
        Görev Ata
      </button>
    </form>
  );
}
