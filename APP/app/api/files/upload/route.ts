// APP/app/api/files/upload/route.ts

import { NextResponse } from "next/server";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";
import { guardDofNotSubmitted } from "@/lib/dof/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */
function sanitizeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9._-]/g, "_");
}

/* -------------------------------------------------------------------------- */
/* ROUTE                                                                      */
/* -------------------------------------------------------------------------- */
export async function POST(req: Request) {
  console.info("🧾 [FILES:UPLOAD] Request başladı");

  const supabase = supabaseServiceRoleClient();

  /* ---------------- FORM DATA ---------------- */
  const formData = await req.formData();

  const file = formData.get("file") as File | null;
  const submission_id = formData.get("submission_id") as string | null;
  const item_id = formData.get("item_id") as string | null;

  console.info("🧾 [FILES:UPLOAD] Parametreler", {
    hasFile: !!file,
    submission_id,
    item_id,
    name: file?.name,
    size: file?.size,
    type: file?.type,
  });

  if (!file || !submission_id) {
    return NextResponse.json(
      {
        success: false,
        step: "validation",
        error: "Dosya veya submission_id eksik",
      },
      { status: 400 }
    );
  }

  if (file.size === 0) {
    return NextResponse.json(
      {
        success: false,
        step: "validation",
        error: "Dosya boş (0 byte)",
      },
      { status: 400 }
    );
  }

  /* ---------------- GUARD ---------------- */
  const guard = await guardDofNotSubmitted(
    supabase,
    { submissionId: submission_id },
    "Kanıt yükleme"
  );
  if (guard) return guard;

  /* ---------------- SUBMISSION ---------------- */
  const { data: submission, error: subError } = await supabase
    .from("submissions")
    .select("org_id")
    .eq("id", submission_id)
    .single();

  if (subError || !submission) {
    return NextResponse.json(
      {
        success: false,
        step: "submission",
        error: "Submission bulunamadı",
        details: subError,
      },
      { status: 404 }
    );
  }

  /* ---------------- STORAGE ---------------- */
  const safeName = sanitizeFileName(file.name);
  const storagePath = `dof/${submission_id}/${Date.now()}-${safeName}`;

  console.info("🧾 [FILES:UPLOAD] Storage upload", { storagePath });

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

    

  if (uploadError) {
    return NextResponse.json(
      {
        success: false,
        step: "storage",
        error: uploadError.message,
      },
      { status: 400 }
    );
  }

  const { data: publicUrl } = supabase.storage
    .from("documents")
    .getPublicUrl(storagePath);

    const { data, error } = await supabase.storage
    .from("documents")
    .list(`dof/${submission_id}`);

    console.log("STORAGE LIST:", data, error);


  /* ---------------- FILE RECORD ---------------- */
  const { data: insertedFile, error: fileError } = await supabase
    .from("files")
    .insert({
      organization_id: submission.org_id,
      submission_id,
      url: publicUrl.publicUrl,
      type: item_id ? "document" : "general",
      metadata: {
        original_name: file.name,
        mime: file.type,
        size: file.size,
        uploaded_at: new Date().toISOString(),
      },
    })
    .select()
    .single();

  if (fileError || !insertedFile) {
    return NextResponse.json(
      {
        success: false,
        step: "db:files",
        error: fileError?.message,
      },
      { status: 400 }
    );
  }

  /* ---------------- ITEM LINK ---------------- */
  if (item_id) {
    const { error: linkError } = await supabase
      .from("dof_item_files")
      .insert({
        dof_item_id: item_id,
        file_id: insertedFile.id,
        type: "document",
      });

    if (linkError) {
      return NextResponse.json(
        {
          success: false,
          step: "db:dof_item_files",
          error: linkError.message,
        },
        { status: 400 }
      );
    }
  }

  /* ---------------- SUCCESS ---------------- */
  console.info("🧾 [FILES:UPLOAD] Upload tamamlandı", {
    file_id: insertedFile.id,
    url: insertedFile.url,
  });

  return NextResponse.json({
    success: true,
    message: "Kanıt başarıyla yüklendi",
    file: {
      id: insertedFile.id,
      url: insertedFile.url,
      type: insertedFile.type,
      originalName: file.name,
      size: file.size,
    },
  });
}
