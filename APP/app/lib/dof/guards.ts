import { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * DÖF henüz kilitli mi kontrol eder.
 * inspection DÖF → submitted ise KİLİTLİ
 * manual DÖF → her zaman düzenlenebilir (kapalı değilse)
 */
export async function guardDofNotSubmitted(
  supabase: SupabaseClient,
  params: {
    dofId?: string;
    submissionId?: string;
  },
  actionLabel = "Bu işlem"
) {
  if (!params.dofId && !params.submissionId) {
    return NextResponse.json(
      { error: "Guard için dofId veya submissionId zorunludur." },
      { status: 400 }
    );
  }

  let query = supabase
    .from("dof_reports")
    .select("id, status, source_type")
    .limit(1);

  if (params.dofId) {
    query = query.eq("id", params.dofId);
  } else {
    query = query.eq("submission_id", params.submissionId);
  }

  const { data: dof, error } = await query.single();

  if (error || !dof) {
    return NextResponse.json(
      { error: "DÖF bulunamadı." },
      { status: 404 }
    );
  }

  /**
   * 🔒 SADECE inspection kaynaklı DÖF’lerde kilitle
   */
  if (
    dof.source_type === "inspection" &&
    dof.status === "submitted"
  ) {
    return NextResponse.json(
      {
        error: `${actionLabel} yapılamaz. DÖF gönderilmiştir.`,
      },
      { status: 403 }
    );
  }

  // ✅ Manuel DÖF veya henüz submitted olmayan inspection DÖF → serbest
  return null;
}
