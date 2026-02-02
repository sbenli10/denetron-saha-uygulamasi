//APP\app\admin\tasks\new\page.client.tsx
"use client";

import ManualTaskBuilder from "@/components/assign/ManualTaskBuilder";
import { createManualTask } from "./actions";

export default function ManualTaskClient({
  templates,
  operators,
}: {
  templates: any[];
  operators: any[];
}) {
  return (
    <div className="max-w-6xl mx-auto py-12 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Manuel Görev Oluştur</h1>
        <p className="text-slate-500 mt-2">
          Bu görev tek seferliktir, otomatik tekrar etmez.
        </p>
      </header>

      <ManualTaskBuilder
        templates={templates}
        operators={operators}
        action={createManualTask}
        />
    </div>
  );
}
