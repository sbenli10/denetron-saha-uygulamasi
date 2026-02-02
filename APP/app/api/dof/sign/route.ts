// APP/app/api/dof/sign/route.ts
import { supabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { guardDofNotSubmitted } from "@/lib/dof/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = supabaseServerClient();

  const { dof_id, imageBase64, role } = await req.json();

  if (!dof_id || !imageBase64 || !role) {
    return NextResponse.json(
      { error: "Eksik parametre" },
      { status: 400 }
    );
  }

  /* ================= DOF ================= */
  const { data: dof, error: dofError } = await supabase
    .from("dof_reports")
    .select("id, submission_id, status")
    .eq("id", dof_id)
    .single();

  if (dofError || !dof) {
    return NextResponse.json(
      { error: "DÖF bulunamadı" },
      { status: 404 }
    );
  }

  /* ================= SUBMITTED GUARD ================= */
  const guard = await guardDofNotSubmitted(
    supabase,
    dof.id,
    "İmza ekleme"
  );
  if (guard) return guard;

  /* ================= SUBMISSION ================= */
  const { data: submission, error: subError } = await supabase
    .from("submissions")
    .select("id, org_id")
    .eq("id", dof.submission_id)
    .single();

  if (subError || !submission) {
    return NextResponse.json(
      { error: "Submission bulunamadı" },
      { status: 404 }
    );
  }

  /* ================= IMAGE ================= */
  const buffer = Buffer.from(
    imageBase64.replace(/^data:image\/png;base64,/, ""),
    "base64"
  );

  const storagePath = `signatures/${submission.id}/${role}.png`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(storagePath, buffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message },
      { status: 400 }
    );
  }

  const { data: publicUrl } = supabase.storage
    .from("documents")
    .getPublicUrl(storagePath);

  /* ================= FILE RECORD ================= */
  await supabase.from("files").insert({
    organization_id: submission.org_id, // ✅ DOĞRU KAYNAK
    submission_id: submission.id,       // ✅ FK UYUMLU
    url: publicUrl.publicUrl,
    type: "signature",
    metadata: {
      role, // operator | auditor
      signed_at: new Date().toISOString(),
    },
  });

  return NextResponse.json({ success: true });
}
