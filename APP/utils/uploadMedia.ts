// APP/utils/uploadMedia.ts
export async function uploadMedia({
  blob,
  orgId,
  taskId,
  submissionId,
  questionId, // ✅ EKLENDİ
}: {
  blob: Blob;
  orgId: string;
  taskId: string;
  submissionId: string;
  questionId: string; // ✅
}): Promise<{ url: string; file_id: string }> {
  const form = new FormData();

  const file =
    blob instanceof File
      ? blob
      : new File([blob], "media", { type: blob.type });

  form.append("file", file);
  form.append("org_id", orgId);
  form.append("task_id", taskId);
  form.append("submission_id", submissionId);
  form.append("question_id", questionId); // 🔥 EN KRİTİK SATIR

  console.log("📸 [UPLOAD MEDIA]", {
    questionId,
    type: file.type,
  });

  const res = await fetch("/api/operator/uploads/photo", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    console.error("❌ uploadMedia failed:", err);
    throw new Error("Medya yüklenemedi");
  }

  return res.json();
}
