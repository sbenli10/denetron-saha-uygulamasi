//APP\app\api\dof\manual\add-item-with-images\route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";
import { guardDofNotSubmitted } from "@/lib/dof/guards";

export async function POST(req: Request) {
  const supabase = supabaseServerClient();

  try {
    const formData = await req.formData();

    const dof_id = formData.get("dof_id") as string;
    const area = formData.get("area") as string;
    const risk_description = formData.get("risk_description") as string;
    const deadline = formData.get("deadline") as string;
    const severity = formData.get("severity") as string;

    const files = formData.getAll("images") as File[];

    /* ================= VALIDATION ================= */

    if (!dof_id || !area || !risk_description || !deadline) {
      return NextResponse.json(
        { error: "Zorunlu alanlar eksik" },
        { status: 400 }
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    /* ================= REPORT CHECK ================= */

    const { data: report } = await supabase
      .from("dof_reports")
      .select("org_id")
      .eq("id", dof_id)
      .single();

    if (!report) {
      return NextResponse.json({ error: "Rapor bulunamadı" }, { status: 404 });
    }

    const orgId = report.org_id;

    const guardResponse = await guardDofNotSubmitted(
      supabase,
      { dofId: dof_id },
      "Madde ekleme"
    );

    if (guardResponse) return guardResponse;

    /* ================= ITEM INSERT ================= */

    const { data: insertedItem, error: insertError } = await supabase
      .from("dof_items")
      .insert({
        dof_report_id: dof_id,
        area: area.trim(),
        risk_description: risk_description.trim(),
        action_description: "Düzeltici faaliyet belirlenecektir",
        deadline: deadline.trim(),
        severity: severity?.trim() || null,
        status: "open",
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 400 }
      );
    }

    /* ================= FILE UPLOAD ================= */

    const uploadedFiles: any[] = [];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const storagePath = `org-${orgId}/dof/${insertedItem.id}/${crypto.randomUUID()}-${file.name}`;

      // 1️⃣ Storage upload
      const { error: uploadError } = await supabase.storage
        .from("dof-files")
        .upload(storagePath, buffer, {
          contentType: file.type,
        });

      if (uploadError) {
        console.error(uploadError);
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from("dof-files")
        .getPublicUrl(storagePath);

      const publicUrl = publicUrlData.publicUrl;

      // 2️⃣ files tablosuna insert
      const { data: fileRow, error: fileInsertError } = await supabase
        .from("files")
        .insert({
          organization_id: orgId,
          user_id: user.id,
          url: publicUrl,
          type: file.type,
          metadata: {
            original_name: file.name,
            size: file.size,
          },
        })
        .select()
        .single();

      if (fileInsertError) {
        console.error(fileInsertError);
        continue;
      }

      // 3️⃣ dof_item_files pivot insert
      await supabase.from("dof_item_files").insert({
        dof_item_id: insertedItem.id,
        file_id: fileRow.id,
        type: "before",
      });

      uploadedFiles.push({
        id: fileRow.id,
        file: {
          url: publicUrl,
        },
      });
    }

    /* ================= RESPONSE ================= */

    return NextResponse.json({
      item: {
        ...insertedItem,
        files: uploadedFiles,
      },
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}