import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";
import { guardDofNotSubmitted } from "@/lib/dof/guards";

export async function POST(req: Request) {
  const supabase = supabaseServerClient();

  try {
    const formData = await req.formData();

    const item_id = formData.get("item_id") as string;
    const dof_id = formData.get("dof_id") as string;
    const risk_description = formData.get("risk_description") as string;
    const severity = formData.get("severity") as string;
    const deadline = formData.get("deadline") as string;
    const area = formData.get("area") as string;

    const newFiles = formData.getAll("images") as File[];

    /* ================= VALIDATION ================= */

    if (!item_id || !dof_id || !risk_description || !deadline || !area) {
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

    /* ================= REPORT & ORG CHECK ================= */

    const { data: report } = await supabase
      .from("dof_reports")
      .select("org_id")
      .eq("id", dof_id)
      .single();

    if (!report) {
      return NextResponse.json(
        { error: "Rapor bulunamadı" },
        { status: 404 }
      );
    }

    const orgId = report.org_id;

    const guardResponse = await guardDofNotSubmitted(
      supabase,
      { dofId: dof_id },
      "Madde güncelleme"
    );

    if (guardResponse) return guardResponse;

    /* ================= UPDATE ITEM ================= */

    const { error: updateError } = await supabase
      .from("dof_items")
      .update({
        risk_description: risk_description.trim(),
        severity: severity?.trim() || null,
        deadline: deadline.trim(),
        area: area.trim(),
      })
      .eq("id", item_id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    /* ================= NEW FILE UPLOAD ================= */

    const uploadedFiles: any[] = [];

    for (const file of newFiles) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const storagePath = `org-${orgId}/dof/${item_id}/${crypto.randomUUID()}-${file.name}`;

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

      // 3️⃣ pivot insert
      await supabase.from("dof_item_files").insert({
        dof_item_id: item_id,
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

    /* ================= FETCH UPDATED ITEM ================= */

    const { data: updatedItem } = await supabase
      .from("dof_items")
      .select(`
        *,
        dof_item_files (
          id,
          files (
            id,
            url
          )
        )
      `)
      .eq("id", item_id)
      .single();

    const formattedItem = {
      ...updatedItem,
      files:
        updatedItem?.dof_item_files?.map((f: any) => ({
          id: f.files.id,
          file: {
            url: f.files.url,
          },
        })) ?? [],
    };

    return NextResponse.json({ item: formattedItem });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}