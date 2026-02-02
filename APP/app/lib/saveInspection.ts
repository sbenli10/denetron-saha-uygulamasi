import { supabaseBrowser } from "./supabaseBrowser";
import { saveDraft } from "./offlineStore";

export async function saveInspection(
  results: {
    answers: any;
    findings?: any;
    photos?: any;
    risk_score?: number | null;
    severity?: string | null;
    location?: string | null;
    equipment?: string | null;
    task_id?: string | null;
    template_id?: string | null;
  },
  orgId: string,
  userId: string,
  online: boolean
) {
  // OFFLINE ÇALIŞIYORSA → Draft Kaydet
  if (!online) {
    await saveDraft({
      id: crypto.randomUUID(),
      org_id: orgId,
      operator_id: userId,
      results,
      timestamp: Date.now(),
    });
    return { status: "offline-saved" };
  }

  // ONLINE İSE → Supabase'e yaz
  const supabase = supabaseBrowser();

  const { error } = await supabase.from("inspections").insert({
    org_id: orgId,
    operator_id: userId,
    task_id: results.task_id ?? null,
    template_id: results.template_id ?? null,
    status: "completed",

    // JSON Alanlar
    answers: results.answers,
    findings: results.findings ?? null,
    photos: results.photos ?? null,

    // Opsiyonel alanlar
    risk_score: results.risk_score ?? null,
    severity: results.severity ?? null,
    location: results.location ?? null,
    equipment: results.equipment ?? null,

    completed_at: new Date().toISOString(),
  });

  // Supabase çökerse → draft kaydet
  if (error) {
    await saveDraft({
      id: crypto.randomUUID(),
      org_id: orgId,
      operator_id: userId,
      results,
      timestamp: Date.now(),
    });
    return { status: "draft-saved" };
  }

  return { status: "saved" };
}
