// APP/app/api/dof/create/route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MediaInput = {
  file_id?: string;
  type?: string;
};

export async function POST(req: Request) {
  console.log("🧠 [DOF CREATE] Request received");

  try {
    const supabase = supabaseServerClient();
    const body = await req.json();

    console.log("📥 [DOF CREATE] RAW BODY =", JSON.stringify(body, null, 2));

    const { submission_id, description, items } = body;

    if (!submission_id || !Array.isArray(items)) {
      console.error("❌ [DOF CREATE] invalid payload");
      return NextResponse.json(
        { error: "submission_id ve items zorunlu" },
        { status: 400 }
      );
    }

    /* ================= AUTH ================= */
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error("❌ [DOF CREATE] unauthorized");
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    console.log("👤 [DOF CREATE] USER =", user.id);

    /* ================= SUBMISSION ================= */
    const { data: submission, error: subErr } = await supabase
      .from("submissions")
      .select("id, org_id")
      .eq("id", submission_id)
      .single();

    if (subErr || !submission) {
      console.error("❌ [DOF CREATE] submission not found", subErr);
      return NextResponse.json(
        { error: "Denetim bulunamadı" },
        { status: 404 }
      );
    }    

    console.log("📄 [DOF CREATE] SUBMISSION =", submission);

    /* ================= FIND OR CREATE DOF ================= */
    let dofId: string;

    const { data: existingDof } = await supabase
      .from("dof_reports")
      .select("id")
      .eq("submission_id", submission_id)
      .maybeSingle();

    if (existingDof) {
      dofId = existingDof.id;
      console.log("♻️ [DOF CREATE] Existing DOF reused =", dofId);
    } else {
      const { data: dof, error } = await supabase
        .from("dof_reports")
        .insert({
          org_id: submission.org_id,
          submission_id,
          report_no: `DOF-${new Date().getFullYear()}-${Date.now()}`,
          description: description ?? null,
          status: "open",
          created_by: user.id,
        })
        .select("id")
        .single();

      if (error || !dof) {
        console.error("❌ [DOF CREATE] dof create failed", error);
        return NextResponse.json(
          { error: "DÖF oluşturulamadı" },
          { status: 400 }
        );
      }

      dofId = dof.id;
      console.log("✅ [DOF CREATE] DOF CREATED =", dofId);
    }

    /* ================= PROCESS ITEMS ================= */
    for (const item of items) {
      const riskText = item?.questionText?.trim();
      const questionId = item?.questionId;

      if (!riskText || !questionId) {
        console.warn("⚠️ [DOF CREATE] item skipped (missing questionId/text)", item);
        continue;
      }

      console.log("🧩 [DOF CREATE] PROCESS ITEM =", {
        questionId,
        riskText,
      });

      /* ---------- DOF ITEM ---------- */
      let dofItemId: string;

      const { data: existingItem } = await supabase
        .from("dof_items")
        .select("id")
        .eq("dof_report_id", dofId)
        .eq("risk_description", riskText)
        .maybeSingle();

      if (existingItem) {
        dofItemId = existingItem.id;
        console.log("♻️ [DOF CREATE] ITEM EXISTS =", dofItemId);
      } else {
        const operatorFinding =
          item.findingText?.trim() || null;

        const { data: dofItem,error } = await supabase
        .from("dof_items")
        .insert({
          dof_report_id: dofId,
          risk_description: riskText,
          operator_finding: operatorFinding, // ✅ ARTIK GERÇEK VERİ
          action_description: "Düzeltici faaliyet belirlenecektir",
          status: "open",
        })
        .select("id")
        .single();

        if (error || !dofItem) {
          console.error("❌ [DOF CREATE] ITEM CREATE FAILED", error);
          continue;
        }

        dofItemId = dofItem.id;
        console.log("✅ [DOF CREATE] ITEM CREATED =", dofItemId);
      }

      /* ---------- MEDIA ---------- */
      let rawMedia: MediaInput[] = Array.isArray(item.media)
        ? item.media
        : [];

      console.log("📎 [DOF CREATE] RAW MEDIA COUNT =", rawMedia.length);

      /* 🔥 FALLBACK: UI boş gönderirse DB'den toparla */
      if (rawMedia.length === 0) {
        console.warn(
          "⚠️ [DOF CREATE] media empty from client, trying DB fallback",
          questionId
        );

        const { data: fallbackFiles } = await supabase
          .from("files")
          .select("id")
          .eq("submission_id", submission_id)
          .eq("question_id", questionId);

        rawMedia = (fallbackFiles ?? []).map(f => ({
          file_id: f.id,
        }));

        console.log(
          "🔁 [DOF CREATE] FALLBACK MEDIA COUNT =",
          rawMedia.length
        );
      }

            const { data: finding } = await supabase
            .from("submission_findings")
            .select("finding_text")
            .eq("submission_id", submission_id)
            .eq("question_id", questionId)
            .maybeSingle();

          const operatorFinding = finding?.finding_text ?? null;

      const mediaFileIds = rawMedia
        .map(m => m?.file_id)
        .filter((id): id is string => typeof id === "string");

      console.log("📎 [DOF CREATE] VALID file_ids =", mediaFileIds);

      if (mediaFileIds.length === 0) {
        console.warn("⚠️ [DOF CREATE] no valid media to link", questionId);
        continue;
      }

      const { data: existingLinks } = await supabase
        .from("dof_item_files")
        .select("file_id")
        .eq("dof_item_id", dofItemId);

      const existingFileIds = new Set(
        (existingLinks ?? []).map(l => l.file_id)
      );

      const newLinks = mediaFileIds
        .filter(file_id => !existingFileIds.has(file_id))
        .map(file_id => ({
          dof_item_id: dofItemId,
          file_id,
          type: "before",
        }));

      if (newLinks.length === 0) {
        console.log("♻️ [DOF CREATE] all media already linked");
        continue;
      }

      const { error: linkErr } = await supabase
        .from("dof_item_files")
        .insert(newLinks);

      if (linkErr) {
        console.error("❌ [DOF CREATE] MEDIA LINK INSERT FAILED", linkErr);
        continue;
      }

      console.log("🧷 [DOF CREATE] MEDIA LINKED COUNT =", newLinks.length);
    }

    console.log("🎉 [DOF CREATE] FINISHED =", dofId);
    return NextResponse.json({ success: true, dof_id: dofId });
  } catch (err) {
    console.error("🔥 [DOF CREATE] FATAL ERROR", err);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}
