// APP/app/admin/templates/saveTemplateAction.ts
"use server";

import { redirect } from "next/navigation";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";

export async function saveTemplateAction(fd: FormData) {
  const name = fd.get("name") as string;
  const fieldsJson = fd.get("fields") as string;
  const tagsRaw = fd.get("tags") as string;
  const is_active = fd.get("is_active") === "true";
  const org_id = fd.get("org_id") as string;

  if (!org_id || org_id.trim() === "") {
    throw new Error("org_id gönderilmedi veya geçersiz");
  }

  // -------------------------------------------------------------
  // FIELDS PARSE
  // -------------------------------------------------------------
  let fields: any[] = [];

  try {
    fields = JSON.parse(fieldsJson || "[]");
  } catch (e) {
    console.error("FIELDS PARSE ERROR:", e);
    throw new Error("fields JSON parse hatası");
  }

  // -------------------------------------------------------------
  // TAGS
  // -------------------------------------------------------------
  const tags = tagsRaw
    ? tagsRaw.split(",").map((x) => x.trim()).filter(Boolean)
    : [];

  const fields_count = fields.filter((f) => f.type !== "divider").length;

  // -------------------------------------------------------------
  // SUPABASE
  // -------------------------------------------------------------
  const supabase = supabaseServiceRoleClient();

  const { data, error } = await supabase
    .from("templates")
    .insert({
      name,
      fields,
      is_active,
      org_id,
      fields_count,
      tags,
      schema: null,
    })
    .select()
    .single();

  if (error) {
    console.error("SERVER :: Supabase INSERT ERROR:", error);
    throw new Error(error.message);
  }

  // -------------------------------------------------------------
  // FORM SUBMITTİNİ SONRA YÖNLENDİR!
  // -------------------------------------------------------------
  redirect("/admin/templates"); // ← otomatik yönlendirme

  return data;
}
