"use server";

import { supabaseServerClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";
import { revalidatePath } from "next/cache";

interface UpdateOrgSettingsInput {
  org_name: string;
  language: string;
  timezone: string;
  logo_url: string | null;
}

export async function updateOrgSettings(input: UpdateOrgSettingsInput) {
  console.log("[ORG SETTINGS] update started:", input);

  const { member } = await getAdminContext();

  if (!member || member.role !== "admin") {
    throw new Error("Bu işlem için yetkiniz yok.");
  }

  const supabase = supabaseServerClient();
  const orgId = member.org_id;

  if (!input.org_name || input.org_name.trim().length < 2) {
    throw new Error("Organizasyon adı en az 2 karakter olmalıdır.");
  }

  /* =========================
     ORG SETTINGS (UPSERT)
  ========================= */
  const { error: settingsErr } = await supabase
    .from("org_settings")
    .upsert(
      {
        org_id: orgId,
        language: input.language,
        timezone: input.timezone,
        logo_url: input.logo_url,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "org_id" }
    );

  if (settingsErr) {
    console.error("[ORG SETTINGS] org_settings error:", settingsErr);
    throw new Error("Organizasyon ayarları güncellenemedi.");
  }

  /* =========================
     ORGANIZATION NAME (TEK VE DOĞRU)
  ========================= */
  const {
    data: updatedOrg,
    error: updateOrgErr,
  } = await supabase
    .from("organizations")
    .update({
      name: input.org_name.trim(),
    })
    .eq("id", orgId)
    .select("id, name")
    .single();

  if (updateOrgErr || !updatedOrg) {
    console.error(
      "[ORG SETTINGS] organizations error:",
      updateOrgErr
    );
    throw new Error("Organizasyon adı güncellenemedi.");
  }

  console.log(
    "[ORG SETTINGS] organization updated:",
    updatedOrg
  );

  // 🔄 Server Component cache invalidate
  revalidatePath("/admin/settings");

  return { success: true };
}
