//APP\app\components\operator\tasks\[id]\TaskDetail.client.tsx
"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const STATUS_LABEL: Record<string, string> = {
  pending: "Bekliyor",
  in_progress: "Devam Ediyor",
  completed: "Tamamlandı",
  overdue: "Gecikmiş",
};

export default function TaskDetailClient({ task }: { task: any }) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-xs text-slate-400"
      >
        <ChevronLeft className="h-4 w-4" />
        Geri
      </button>

      <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3">
        <h1 className="text-base font-semibold">
          Denetim Görevi
        </h1>

        <span className="text-xs text-slate-300">
          {STATUS_LABEL[task.status]}
        </span>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3">
        {task.status !== "completed" && (
            <Link
              href={`/operator/tasks/${task.id}/start`}
              className="inline-flex rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold"
            >
              Denetimi Başlat
            </Link>
        )}
      </div>
    </div>
  );
}
