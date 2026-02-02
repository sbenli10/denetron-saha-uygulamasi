//APP\app\admin\tasks\new\actions.ts
"use server";

import { getAdminContext } from "@/lib/admin/context";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";

export async function createManualTask(
  _: any,
  formData: FormData
) {
  const { member, org } = await getAdminContext();

  if (!member || !org) {
    throw new Error("Yetkisiz");
  }

  // ❗ Free-only guard
  if (org.is_premium) {
    throw new Error("Bu işlem Free plan içindir");
  }

  const templateId = formData.get("template_id") as string;
  const operatorIdsRaw = formData.get("operator_ids") as string;

  if (!templateId || !operatorIdsRaw) {
    throw new Error("Eksik veri");
  }

  const operatorIds: string[] = JSON.parse(operatorIdsRaw);

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

  await db.from("tasks").insert(inserts);

  return { success: true };
}
