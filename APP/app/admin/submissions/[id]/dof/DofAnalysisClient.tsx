//APP\app\admin\submissions\[id]\dof\DofAnalysisClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { CriticalAnswer } from "./types";

/* ================= PROPS ================= */

interface Props {
  submissionId: string;
  criticalAnswers: CriticalAnswer[];
}

/* ================= COMPONENT ================= */

export default function DofAnalysisClient({
  submissionId,
  criticalAnswers,
}: Props) {
  console.log("🟦 [DOF UI] mounted");
  console.log("🟦 [DOF UI] submissionId =", submissionId);
  console.log("🟦 [DOF UI] criticalAnswers =", criticalAnswers);

  /* ================= STATE ================= */

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set()
  );

  /* ================= EFFECTS ================= */

  useEffect(() => {
    console.log(
      "🔁 [DOF UI] criticalAnswers changed → reset selection"
    );
    setSelectedIds(new Set());
  }, [criticalAnswers]);

  /* ================= TOGGLE ================= */

  function toggle(questionId: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(questionId)
        ? next.delete(questionId)
        : next.add(questionId);

      console.log("🧲 [DOF UI] toggle", {
        questionId,
        selected: next.has(questionId),
      });

      return next;
    });
  }

  /* ================= DERIVED ================= */

  const selectedItems = useMemo(() => {
    const items = criticalAnswers
      .filter(a => selectedIds.has(a.questionId))
      .map(a => ({
        questionId: a.questionId,
        questionText: a.questionText,
        findingText: a.findingText ?? a.answerText ?? "",
        media: a.media ?? [],
      }));

    console.log("📦 [DOF UI] selectedItems =", items);

    return items;
  }, [criticalAnswers, selectedIds]);

  const progress =
    criticalAnswers.length === 0
      ? 0
      : Math.round(
          (selectedItems.length / criticalAnswers.length) * 100
        );

 // sadece createDof içi
async function createDof() {
  if (selectedItems.length === 0) {
    alert("En az bir madde seçmelisiniz");
    return;
  }

  console.log("🚀 [DOF UI] CREATE DOF payload =", {
    submission_id: submissionId,
    items: selectedItems.map(i => ({
      questionId: i.questionId,
      questionText: i.questionText,
      mediaFileIds: i.media.map(m => m.file_id),
    })),
  });

  const res = await fetch("/api/dof/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      submission_id: submissionId,
      items: selectedItems, // 🔥 media dolu
    }),
  });

  const data = await res.json();

  if (!res.ok || !data?.success) {
    console.error("❌ [DOF UI] create failed", data);
    alert(data?.error ?? "DÖF oluşturulamadı");
    return;
  }

  console.log("✅ [DOF UI] DOF CREATED =", data.dof_id);
  window.location.href = `/admin/dof/${data.dof_id}`;
}


  /* ================= RENDER ================= */

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-32">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">DÖF Analizi</h1>
        <p className="text-gray-600">
          Kritik bulguları seçin ve DÖF oluşturun
        </p>
      </header>

      {criticalAnswers.length === 0 && (
        <div className="rounded-xl border border-dashed p-10 text-center text-gray-500">
          Kritik bulgu bulunamadı
        </div>
      )}

      {criticalAnswers.map(item => {
        const selected = selectedIds.has(item.questionId);

        return (
          <div
            key={item.questionId}
            onClick={() => toggle(item.questionId)}
            className={`cursor-pointer rounded-xl border p-6 transition ${
              selected
                ? "border-rose-600 bg-rose-50"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                checked={selected}
                onClick={e => e.stopPropagation()}
                onChange={() => toggle(item.questionId)}
                className="mt-1 h-5 w-5 accent-rose-600"
              />
              <div className="space-y-1">
                <h3 className="font-medium">
                  {item.questionText}
                </h3>

                {item.answerText && (
                  <p className="text-sm text-gray-600">
                    {item.answerText}
                  </p>
                )}

                {item.media.length > 0 ? (
                  <p className="text-xs text-green-600">
                    📎{" "}
                    {item.media.filter(m => m.type === "photo").length} fotoğraf,{" "}
                    {item.media.filter(m => m.type === "video").length} video
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">
                    Fotoğraf yok
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {selectedItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-white">
          <div className="mx-auto flex max-w-4xl items-center justify-between p-6">
            <span className="text-sm text-gray-600">
              {selectedItems.length} / {criticalAnswers.length} seçildi (%{progress})
            </span>

            <button
              onClick={createDof}
              className="rounded-xl bg-rose-600 px-6 py-3 text-white hover:bg-rose-700"
            >
              Seçilenlerden DÖF Oluştur
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
