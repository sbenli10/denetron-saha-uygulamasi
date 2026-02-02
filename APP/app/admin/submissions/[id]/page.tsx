export const dynamic = "force-dynamic"; // her zaman güncel veri

import { supabaseServiceRoleClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";
import ClientSideView from "./ClientSideView";
import type {
  SubmissionRecord,
  RawAnswer,
  FileRecord,
} from "@/types/submission";

interface PageProps {
  params: { id: string };
}



export default async function SubmissionDetailPage({
  params,
}: PageProps) {
  const submissionId = params.id;

  const { org, member } = await getAdminContext();
  const db = supabaseServiceRoleClient();

  /* ---------- SUBMISSION ---------- */
  const { data, error } = await db
    .from("v_assigned_tasks_detailed")
    .select("*")
    .eq("submission_id", submissionId)
    .eq("org_id", org.id)
    .maybeSingle();

  if (error || !data) {
    return (
      
        <div className="p-12 text-center text-red-500">
          Kayıt bulunamadı veya erişim izni yok.
        </div>
      
    );
  }

  /* ---------- FILES ---------- */
  const { data: files } = await db
    .from("files")
    .select("id, url, type, question_id, metadata")
    .eq("submission_id", submissionId)
    .eq("organization_id", org.id);

  /* ---------- FINDINGS (NEW SOURCE) ---------- */
  const { data: findings } = await db
    .from("submission_findings")
    .select(`
      id,
      question_id,
      question_text,
      finding_text,
      severity,
      created_at
    `)
    .eq("submission_id", submissionId);

  /* ---------- MERGED SUBMISSION ---------- */
  const submission: SubmissionRecord = {
    ...data,
    files: files ?? [],
    findings: findings ?? [],
  };

  const grouped = groupAnswers(
    submission.answers ?? [],
    submission.files,
    submission.findings
  );

  return (
    
      <ClientSideView
        submission={submission}
        grouped={grouped}
        isPremium={org.is_premium === true}
        role={member.role_name}
        submissionId={submissionId}
      />
  );
}

/* ================= HELPERS ================= */

function groupAnswers(
  raw: RawAnswer[],
  files: FileRecord[],
  findings: {
    question_id: string;
    finding_text: string | null;
    severity: string | null;
  }[]
): Record<string, RawAnswer[]> {
  const groups: Record<string, RawAnswer[]> = {};

  raw.forEach((ans) => {
    const [category] = ans.questionId.split(".");
    if (!groups[category]) groups[category] = [];

    const finding = findings.find(
      (f) => f.question_id === ans.questionId
    );

    const relatedMedia =
      ans.answer === "no"
        ? files.filter(
            (f) => f.question_id === ans.questionId
          )
        : [];

    groups[category].push({
      ...ans,
      findingText: finding?.finding_text ?? null,
      severity: finding?.severity ?? null,
      media: relatedMedia,
    });
  });

  return groups;
}
