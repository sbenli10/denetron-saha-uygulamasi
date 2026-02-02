//APP\app\components\operator\TaskTemplateForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TaskTemplateForm({
  assignedTaskId,
  template,
}: {
  assignedTaskId: string;
  template: any;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/operator/tasks/save-answers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assigned_task_id: assignedTaskId,
        answers,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      alert("Kaydedilemedi");
      return;
    }

    router.push(`/operator/tasks/${assignedTaskId}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {template.fields.map((f: any) => (
        <input
          key={f.key}
          placeholder={f.label}
          onChange={(e) =>
            setAnswers((p) => ({ ...p, [f.key]: e.target.value }))
          }
          className="w-full rounded-xl p-2"
        />
      ))}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-emerald-500 py-2 font-semibold"
      >
        Kaydet
      </button>
    </form>
  );
}
