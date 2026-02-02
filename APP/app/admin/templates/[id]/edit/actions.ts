// APP/app/admin/templates/[id]/edit/actions.ts
"use server";

import { supabaseServerClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";
import type { Field } from "./TemplateEditor.types";
import { revalidatePath } from "next/cache";

/* -------------------------------------------------------------
 * TEMPLATE GET + VERSIONS GET
 * ------------------------------------------------------------- */
export async function getTemplateWithVersions(id: string) {
  const supabase = supabaseServerClient();

  const templateRes = await supabase
    .from("templates")
    .select("*")
    .eq("id", id)
    .single();

  if (templateRes.error) {
    throw new Error(templateRes.error.message);
  }

  const versionsRes = await supabase
    .from("template_versions")
    .select("*")
    .eq("template_id", id)
    .order("created_at", { ascending: false });

  if (versionsRes.error) {
    throw new Error(versionsRes.error.message);
  }

  return {
    template: templateRes.data,
    versions: versionsRes.data,
  };
}

/* -------------------------------------------------------------
 * TEMPLATE SAVE (HERKES KULLANABİLİR)
 * ------------------------------------------------------------- */
export async function saveTemplateAction(formData: FormData) {
  const supabase = supabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    throw new Error("User has no organization.");
  }

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const is_active = formData.get("is_active") === "true";
  const fields = JSON.parse(formData.get("fields") as string) as Field[];

  const payload = {
    name,
    is_active,
    fields,
    fields_count: fields.length,
    updated_at: new Date().toISOString(),
    org_id: profile.organization_id,
  };

  const dbRes =
    id === "new"
      ? await supabase
          .from("templates")
          .insert({
            ...payload,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
          })
          .select()
          .single()
      : await supabase
          .from("templates")
          .update(payload)
          .eq("id", id)
          .select()
          .single();

  if (dbRes.error) {
    throw new Error(dbRes.error.message);
  }

  revalidatePath("/admin/templates");
}

/* -------------------------------------------------------------
 * VERSION DELETE (PREMIUM ONLY)
 * ------------------------------------------------------------- */
export async function deleteTemplateVersionAction(fd: FormData) {
  const { member } = await getAdminContext();

  if (member?.role !== "admin") {
    throw new Error("Premium plan gerekli");
  }

  const supabase = supabaseServerClient();

  const templateId = fd.get("templateId") as string;
  const version = fd.get("version") as string;

  if (!templateId || !version) {
    throw new Error("templateId ve version zorunludur");
  }

  const { error } = await supabase
    .from("template_versions")
    .delete()
    .eq("template_id", templateId)
    .eq("version", version);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/admin/templates/${templateId}/edit`);
}

/* -------------------------------------------------------------
 * VERSION CREATE (PREMIUM ONLY)
 * ------------------------------------------------------------- */
export async function createVersionAction(formData: FormData): Promise<string> {
  const { member } = await getAdminContext();

  if (member?.role !== "admin") {
    throw new Error("Premium plan gerekli");
  }

  const supabase = supabaseServerClient();

  const templateId = formData.get("templateId") as string;
  const fields = JSON.parse(formData.get("fields") as string) as Field[];

  const last = await supabase
    .from("template_versions")
    .select("version")
    .eq("template_id", templateId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let newVersion = "1.0";

  if (last.data?.version) {
    newVersion = (parseFloat(last.data.version) + 0.1).toFixed(1);
  }

  const insert = await supabase.from("template_versions").insert({
    id: crypto.randomUUID(),
    template_id: templateId,
    version: newVersion,
    fields,
    schema: {},
    created_at: new Date().toISOString(),
  });

  if (insert.error) {
    throw new Error(insert.error.message);
  }

  return newVersion;
}

/* -------------------------------------------------------------
 * VERSION RESTORE (PREMIUM ONLY)
 * ------------------------------------------------------------- */
export async function restoreVersionAction(formData: FormData) {
  const { member } = await getAdminContext();

  if (member?.role !== "admin") {
    throw new Error("Premium plan gerekli");
  }

  const supabase = supabaseServerClient();

  const templateId = formData.get("templateId") as string;
  const version = formData.get("version") as string;

  const { data, error } = await supabase
    .from("template_versions")
    .select("fields")
    .eq("template_id", templateId)
    .eq("version", version)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.fields as Field[];
}
