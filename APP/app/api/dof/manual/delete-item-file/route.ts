// APP/app/api/dof/manual/delete-item-file/route.ts

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const reqId = crypto.randomUUID();
  console.log(`[DELETE_ITEM_FILE][${reqId}] ===== START =====`);

  try {
    const supabase = supabaseServerClient();
    const { file_id } = await req.json(); 
    // ⚠ file_id aslında dof_item_files.id

    if (!file_id) {
      return NextResponse.json(
        { error: "file_id zorunludur." },
        { status: 400 }
      );
    }

    /* ================= AUTH ================= */

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Yetkisiz işlem." },
        { status: 401 }
      );
    }

    /* ================= PIVOT FETCH ================= */

    const { data: pivot, error: pivotError } = await supabase
      .from("dof_item_files")
      .select("id, file_id")
      .eq("id", file_id)
      .single();

    if (pivotError || !pivot) {
      console.warn(`[DELETE_ITEM_FILE][${reqId}] Pivot not found`);
      return NextResponse.json(
        { error: "Dosya ilişkisi bulunamadı." },
        { status: 404 }
      );
    }

    const realFileId = pivot.file_id;

    console.log(
      `[DELETE_ITEM_FILE][${reqId}] Real file id:`,
      realFileId
    );

    /* ================= FILE FETCH ================= */

    const { data: file, error: fileError } = await supabase
      .from("files")
      .select("id, url, organization_id")
      .eq("id", realFileId)
      .single();

    if (fileError || !file) {
      return NextResponse.json(
        { error: "Dosya bulunamadı." },
        { status: 404 }
      );
    }

    /* ================= DELETE PIVOT ================= */

    await supabase
      .from("dof_item_files")
      .delete()
      .eq("id", file_id);

    /* ================= CHECK STILL USED ================= */

    const { count } = await supabase
      .from("dof_item_files")
      .select("*", { count: "exact", head: true })
      .eq("file_id", realFileId);

    if (count && count > 0) {
      console.log(
        `[DELETE_ITEM_FILE][${reqId}] File used elsewhere. Only relation deleted.`
      );
      return NextResponse.json({ success: true });
    }

    /* ================= STORAGE DELETE ================= */

    const splitKey = "/storage/v1/object/public/";
    const relativePath = file.url.split(splitKey)[1];

    if (!relativePath) {
      return NextResponse.json(
        { error: "Storage yolu çözümlenemedi." },
        { status: 500 }
      );
    }

    const [bucket, ...rest] = relativePath.split("/");
    const filePath = rest.join("/");

    await supabase.storage.from(bucket).remove([filePath]);

    /* ================= DELETE FILE ROW ================= */

    await supabase
      .from("files")
      .delete()
      .eq("id", realFileId);

    console.log(`[DELETE_ITEM_FILE][${reqId}] SUCCESS`);

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error(`[DELETE_ITEM_FILE][${reqId}] FATAL`, err);

    return NextResponse.json(
      { error: "Dosya silme işlemi sırasında hata oluştu." },
      { status: 500 }
    );
  }
}