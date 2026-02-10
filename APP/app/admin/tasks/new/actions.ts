// APP/app/admin/tasks/new/actions.ts
"use server";

import { getAdminContext } from "@/lib/admin/context";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";

export async function createManualTask(
  _: any,
  formData: FormData
) {
  const { member, org, access } = await getAdminContext();

  if (!member || !org) {
    throw new Error("Yetkisiz");
  }

  // ❌ FREE PLAN GUARD
  if (!access.premium) {
    throw new Error(
      "Bu özellik sadece deneme veya premium planlarda kullanılabilir."
    );
  }

  const templateId = formData.get("template_id") as string | null;
  const operatorIdsRaw = formData.get("operator_ids") as string | null;

  if (!templateId || !operatorIdsRaw) {
    throw new Error("Eksik veri");
  }

  let operatorIds: string[];

  try {
    operatorIds = JSON.parse(operatorIdsRaw);
  } catch {
    throw new Error("Operatör verisi geçersiz");
  }

  if (!Array.isArray(operatorIds) || operatorIds.length === 0) {
    throw new Error("En az bir operatör seçilmelidir");
  }

  const db = supabaseServiceRoleClient();

  const inserts = operatorIds.map((opId) => ({
    org_id: member.org_id,
    assignee_id: opId,
    created_by: member.user_id,
    template_id: templateId,
    status: "pending",
    title: "Manuel Görev",
    description: "Manuel olarak oluşturuldu",
    priority: "normal",
  }));

  const { error } = await db.from("tasks").insert(inserts);

  if (error) {
    console.error("createManualTask error:", error);
    throw new Error("Görevler oluşturulamadı");
  }

  return { success: true };
}
