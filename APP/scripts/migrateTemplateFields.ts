//APP\scripts\migrateTemplateFields.ts
"use server";

import { supabaseServerClient } from "@/lib/supabase/server";

// --------------------------------------
// Normalize tek bir field
// --------------------------------------
function normalizeField(f: any) {
  const base = {
    __id: f.__id ?? crypto.randomUUID(),
    label: f.label ?? "",
  };

  switch (f.type) {
    case "divider":
      return { ...base, type: "divider" };

    case "boolean":
      return {
        ...base,
        type: "boolean",
        key: f.key ?? "check.auto",
        critical: f.critical ?? false,
      };

    case "text":
      return {
        ...base,
        type: "text",
        key: f.key ?? "text.auto",
        placeholder: f.placeholder ?? "",
      };

    case "textarea":
      return {
        ...base,
        type: "textarea",
        key: f.key ?? "note.auto",
        maxLength: f.maxLength ?? 300,
      };

    case "select":
      return {
        ...base,
        type: "select",
        key: f.key ?? "select.auto",
        default: f.default ?? "",
        options: Array.isArray(f.options)
          ? f.options.map((o: any) =>
              typeof o === "string" ? { label: o, value: o } : o
            )
          : [],
      };

    default:
      return { ...base, type: "divider" };
  }
}

// --------------------------------------
// Tüm template'leri migrate et
// --------------------------------------
export async function migrateTemplateFields() {
  const supabase = supabaseServerClient();

  console.log("⏳ Template migration başlıyor...");

  const { data: templates, error } = await supabase
    .from("templates")
    .select("id, fields");

  if (error) {
    console.error("DB hata:", error);
    throw new Error(error.message);
  }

  if (!templates.length) {
    console.log("Hiç template bulunamadı.");
    return;
  }

  for (const t of templates) {
    const rawFields = t.fields;

    // alan yoksa geç
    if (!Array.isArray(rawFields)) continue;

    const normalized = rawFields.map((f) => normalizeField(f));

    const updateRes = await supabase
      .from("templates")
      .update({
        fields: normalized,
        fields_count: normalized.length,
        updated_at: new Date().toISOString(),
      })
      .eq("id", t.id);

    if (updateRes.error) {
      console.error(`❌ Şablon güncellenemedi (${t.id})`, updateRes.error);
      continue;
    }

    console.log(`✔ Şablon düzeltildi: ${t.id}`);
  }

  console.log("🎉 Migration tamamlandı!");
}
