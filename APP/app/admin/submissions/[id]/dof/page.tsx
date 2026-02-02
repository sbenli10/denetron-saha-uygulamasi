// APP/app/admin/submissions/[id]/dof/page.tsx
export const dynamic = "force-dynamic"; // her zaman güncel veri

import { supabaseServerClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";
import DofAnalysisClient from "./DofAnalysisClient";
import type { CriticalAnswer, MediaItem } from "./types";

interface Answer {
  questionId: string;
  questionText: string;
  answer: string | boolean;
  answerText?: string;
  media?: any[];
}

export default async function DofAnalysisPage({
  params,
}: {
  params: { id: string };
}) {
  const submissionId = params.id;
  console.log("🟦 [DOF ANALYSIS PAGE] submissionId =", submissionId);

  const { org } = await getAdminContext();
  const db = supabaseServerClient();

  /* ================= SUBMISSION + FILES ================= */
  const { data, error } = await db
    .from("v_assigned_tasks_detailed")
    .select(`
      answers,
      files (
        id,
        url,
        type,
        question_id
      )
    `)
    .eq("submission_id", submissionId)
    .eq("org_id", org.id)
    .single();

  if (error || !data) {
    console.error("❌ [DOF ANALYSIS PAGE] Submission not found", error);
    return (
    
        <div className="p-12 text-red-500">Denetim bulunamadı.</div>
      
    );
  }

  /* ================= FILE MAP (question_id → files[]) ================= */
  const fileMap = new Map<string, MediaItem[]>();

  (data.files ?? []).forEach((f: any) => {
    if (!f.question_id) return;

    if (!fileMap.has(f.question_id)) {
      fileMap.set(f.question_id, []);
    }

    fileMap.get(f.question_id)!.push({
      file_id: f.id,
      url: f.url,
      type: f.type,
    });
  });

  console.log(
    "📎 [DOF ANALYSIS PAGE] fileMap keys =",
    Array.from(fileMap.keys())
  );

  /* ================= CRITICAL ANSWERS ================= */
  const criticalAnswers: CriticalAnswer[] = (
    (data.answers as Answer[]) ?? []
  )
    .filter(a => a.answer === "no" || a.answer === false)
    .filter(a => typeof a.questionId === "string")
    .map(a => {
      const media = fileMap.get(a.questionId) ?? [];

      console.log("🧩 [CRITICAL ANSWER]", {
        questionId: a.questionId,
        mediaCount: media.length,
      });

      return {
        questionId: a.questionId,
        questionText: a.questionText,
        answer: a.answer,
        answerText: a.answerText,
        media,
      };
    });

  console.log(
    "✅ [DOF ANALYSIS PAGE] criticalAnswers count =",
    criticalAnswers.length
  );

  return (
      <DofAnalysisClient
        submissionId={submissionId}
        criticalAnswers={criticalAnswers}
      />
  );
}
