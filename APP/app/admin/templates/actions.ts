//APP\app\admin\templates\actions.ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseServerClient } from "@/lib/supabase/server"; // auth + org için
import { supabaseAdmin } from "@/lib/supabase/admin";         // service role, RLS yok
import type { Field } from "./[id]/edit/TemplateEditor.types";
export type TemplateRow = {
  id: string;
  org_id: string;         // ✅
  name: string;
  fields?: any;
  fields_count?: number | null;
  is_active: boolean;
  tags?: string[] | null;
  updated_at?: string | null;
  created_at?: string | null;
};

/** Giriş yapmış, org_members’ta admin olan kullanıcıyı garanti eder */
async function ensureAdmin() {
  const supabase = supabaseServerClient();

  // 1) Auth kontrolü ANON ile yapılır
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?next=/admin/templates");
  }

  // 2) Admin kontrolü SERVICE ROLE ile yapılır
  const adminClient = supabaseAdmin;

  const { data: member, error: memberErr } = await adminClient
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (memberErr || !member || member.role !== "admin") {
    redirect("/login");
  }

  return { user, orgId: member.org_id as string };
}

/**
 * Şablon için yeni bir versiyon oluşturur.
 */
export async function createTemplateVersionAction(templateId: string, fields: Field[], createdBy: string) {
  const { data: last, error: lastErr } = await supabaseAdmin
    .from("template_versions")
    .select("version")
    .eq("template_id", templateId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastErr) throw lastErr;

  const nextVersion = (last?.version ?? 0) + 1;

  const { error } = await supabaseAdmin
    .from("template_versions")
    .insert({
      template_id: templateId,
      version: nextVersion,
      fields,
      schema: { fields },
      created_by: createdBy
    });

  if (error) throw error;

  return nextVersion;
}

export async function getTemplateVersionsAction(templateId: string) {
  const { data, error } = await supabaseAdmin
    .from("template_versions")
    .select("*")
    .eq("template_id", templateId)
    .order("version", { ascending: false });

  if (error) throw error;

  return data;
}


export async function restoreTemplateVersionAction(templateId: string, version: string, userId: string) {
  const supa = supabaseAdmin;

  const { data: v, error: e1 } = await supa
    .from("template_versions")
    .select("*")
    .eq("template_id", templateId)
    .eq("version", version)
    .single();

  if (e1) throw e1;

  const fields = v.fields ?? [];

  // 1) ACTİVE TEMPLATE’I GÜNCELLE
  const { error: e2 } = await supa
    .from("templates")
    .update({
      fields,
      updated_at: new Date().toISOString()
    })
    .eq("id", templateId);

  if (e2) throw e2;

  // 2) BU İŞLEMİ BİR YENİ VERSİYON OLARAK KAYDET
  await createTemplateVersionAction(templateId, fields, userId);

  return fields;
}

/* ───────── LİSTE ───────── */
export async function listTemplates(): Promise<TemplateRow[]> {
  const { orgId } = await ensureAdmin();

  const { data, error } = await supabaseAdmin
    .from("templates")
    .select(
      "id, org_id, name, fields, fields_count, is_active, tags, updated_at, created_at"
    )
    .eq("org_id", orgId)
    .eq("is_archived", false) // ⬅️ KRİTİK SATIR
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("templates select error:", error);
    return [];
  }

  return (data ?? []) as TemplateRow[];
}


/* ───────── OLUŞTUR ───────── */

export async function createTemplateAction(formData: FormData) {
  const { orgId } = await ensureAdmin();

  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  const seedFields = [
    { type: "divider", label: "Üst Bilgiler" },
    {
      key: "header.equipment",
      type: "text",
      label: "Ekipman",
      required: true,
    },
    {
      key: "header.location",
      type: "text",
      label: "Konum",
      required: true,
    },
    {
      key: "header.period",
      type: "select",
      label: "Periyot",
      options: [
        { label: "Günlük", value: "Gunluk" },
        { label: "Haftalık", value: "Haftalik" },
        { label: "Aylık", value: "Aylik" },
      ],
      default: "Gunluk",
    },
    { type: "divider", label: "Kontrol Listesi" },
    {
      key: "checklist.ornek",
      type: "boolean",
      label: "Örnek madde",
      critical: false,
    },
  ];

  const fields_count = seedFields.filter((f: any) => f.type !== "divider").length;

  const { error } = await supabaseAdmin.from("templates").insert({
  org_id: orgId,          
  name,
  fields: seedFields,
  fields_count,
  is_active: true,
  tags: [],
});


  if (error) {
    console.error("templates insert error:", error);
    throw new Error("templates insert: " + error.message);
  }

  revalidatePath("/admin/templates");
  revalidatePath("/admin/plans"); // ileride assignment için
  redirect("/admin/templates");
}

/* ───────── TEK ŞABLON ───────── */

export async function getTemplateAction(id: string): Promise<TemplateRow | null> {
  const { orgId } = await ensureAdmin();

  const { data, error } = await supabaseAdmin
    .from("templates")
    .select(
      "id, org_id, name, fields, fields_count, is_active, tags, updated_at, created_at"
    )
    .eq("id", id)
    .eq("org_id", orgId)
    .maybeSingle();

  if (error) throw new Error("templates get: " + error.message);
  return (data as TemplateRow) ?? null;
}



/* ───────── SİL ───────── */
export async function deleteTemplateAction(formData: FormData) {
  console.log("▶ deleteTemplateAction başladı");

  const { orgId } = await ensureAdmin();
  console.log("✔ ensureAdmin OK, orgId:", orgId);

  const id = String(formData.get("id") || "");
  console.log("📌 template id:", id);

  if (!id) {
    console.warn("⚠ template id yok, işlem iptal");
    return;
  }

  console.log("⏳ RPC çağrılıyor: archive_template_and_cleanup_tasks");

  const { error } = await supabaseAdmin.rpc(
    "archive_template_and_cleanup_tasks",
    {
      p_template_id: id,
      p_org_id: orgId,
    }
  );

  if (error) {
    console.error("❌ RPC hata verdi:", error);
    throw new Error("templates delete: " + error.message);
  }

  console.log("✅ RPC başarıyla tamamlandı");

  console.log("🔄 revalidatePath çağrılıyor");
  revalidatePath("/admin/templates");

  console.log("➡ redirect ediliyor: /admin/templates");
  redirect("/admin/templates");
}

/* ───────── GÜNCELLE ───────── */

export async function updateTemplateAction(formData: FormData) {
  const { orgId } = await ensureAdmin();

  const id = String(formData.get("id") || "");
  if (!id) return;

  const patch: Record<string, any> = {};

  const name = formData.get("name");
  if (typeof name === "string") patch.name = name.trim();

  const fieldsStr = formData.get("fields");
  if (typeof fieldsStr === "string") {
    try {
      const parsed = JSON.parse(fieldsStr);
      patch.fields = parsed;
      patch.fields_count = Array.isArray(parsed)
        ? parsed.filter((f: any) => f?.type !== "divider").length
        : 0;
    } catch {
      throw new Error("Geçersiz fields JSON");
    }
  }

  const tagsStr = formData.get("tags");
  if (typeof tagsStr === "string") {
    const tags = tagsStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    patch.tags = tags;
  }

  const isActive = formData.get("is_active");
  if (typeof isActive === "string") {
    patch.is_active = isActive === "on" || isActive === "true";
  }

  if (Object.keys(patch).length === 0) {
    redirect(`/admin/templates/${id}/edit`);
    return;
  }

  const { error } = await supabaseAdmin
    .from("templates")
    .update(patch)
    .eq("id", id)
    .eq("org_id", orgId);

  if (error) throw new Error("templates update: " + error.message);

  revalidatePath(`/admin/templates/${id}/edit`);
  revalidatePath("/admin/templates");
  revalidatePath("/admin/plans");
  redirect(`/admin/templates/${id}/edit`);
}

/* ───────── İÇE AKTAR ───────── */

export async function importTemplatesAction(formData: FormData) {
  const { orgId } = await ensureAdmin();

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return;

  let json: Array<Partial<TemplateRow>> = [];
  try {
    json = JSON.parse(await file.text());
  } catch {
    throw new Error("Geçersiz JSON dosyası");
  }

  const rows = (json ?? []).map((t) => {
    const fields = t.fields ?? [];
    const fields_count = Array.isArray(fields)
      ? fields.filter((f: any) => f?.type !== "divider").length
      : 0;

    return {
      org_id: orgId,
      name: (t.name ?? "İsimsiz").toString(),
      fields,
      fields_count,
      is_active: t.is_active ?? true,
      tags: t.tags ?? [],
    };
  });

  if (rows.length) {
    const { error } = await supabaseAdmin.from("templates").insert(rows as any[]);
    if (error) throw new Error("templates import: " + error.message);
  }

  revalidatePath("/admin/templates");
  revalidatePath("/admin/plans");
  redirect("/admin/templates");
}

/* ───────── AKTİF / PASİF ───────── */

export async function toggleTemplateActiveAction(formData: FormData) {
  console.log("▶ toggleTemplateActiveAction başladı");

  const { orgId } = await ensureAdmin();
  console.log("✔ ensureAdmin OK, orgId:", orgId);

  const id = String(formData.get("id") || "");
  console.log("📌 template id:", id);

  if (!id) {
    console.warn("⚠ template id yok, işlem iptal edildi");
    return;
  }

  console.log("🔍 mevcut is_active değeri alınıyor");

  const { data, error } = await supabaseAdmin
    .from("templates")
    .select("is_active")
    .eq("id", id)
    .eq("org_id", orgId)
    .maybeSingle();

  if (error) {
    console.error("❌ is_active select hatası:", error);
    throw new Error("templates select is_active: " + error.message);
  }

  console.log("ℹ mevcut is_active:", data?.is_active);

  const nextValue = !data?.is_active;
  console.log("✏ is_active güncelleniyor →", nextValue);

  const { error: updErr } = await supabaseAdmin
    .from("templates")
    .update({ is_active: nextValue })
    .eq("id", id)
    .eq("org_id", orgId);

  if (updErr) {
    console.error("❌ is_active update hatası:", updErr);
    throw new Error("templates update: " + updErr.message);
  }

  console.log("✅ is_active başarıyla güncellendi");

  console.log("🔄 revalidatePath çağrılıyor");
  revalidatePath("/admin/templates");
  revalidatePath("/admin/plans");

  console.log("➡ redirect ediliyor: /admin/templates");
  redirect("/admin/templates");
}

/* ───────── ÇOĞALT ───────── */

export async function duplicateTemplateAction(formData: FormData) {
  const { orgId } = await ensureAdmin();

  const id = String(formData.get("id") || "");
  if (!id) return;

  const { data: row, error } = await supabaseAdmin
    .from("templates")
    .select("org_id, name, fields, fields_count, tags")
    .eq("id", id)
    .eq("org_id", orgId)
    .maybeSingle();

  if (error) throw new Error("templates get for duplicate: " + error.message);
  if (!row) return;

  const { error: insErr } = await supabaseAdmin.from("templates").insert({
    org_id: row.org_id,
    name: `${row.name} (Kopya)`,
    fields: row.fields ?? [],
    fields_count: row.fields_count ?? 0,
    tags: row.tags ?? [],
    is_active: true,
  });

  if (insErr) throw new Error("templates duplicate: " + insErr.message);

  revalidatePath("/admin/templates");
  revalidatePath("/admin/plans");
  redirect("/admin/templates");
}
