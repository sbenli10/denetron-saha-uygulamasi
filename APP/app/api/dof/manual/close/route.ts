import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";
import { guardDofNotSubmitted } from "@/lib/dof/guards";

export async function POST(req: Request) {
  const supabase = supabaseServerClient();
  const { dof_id } = await req.json();

  if (!dof_id) {
    return NextResponse.json(
      { error: "dof_id zorunludur" },
      { status: 400 }
    );
  }

  /* ================= AUTH ================= */
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Yetkisiz" },
      { status: 401 }
    );
  }

  /* ================= ORG ================= */
  const { data: orgMember, error: orgError } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (orgError || !orgMember) {
    return NextResponse.json(
      { error: "Organizasyon bulunamadı" },
      { status: 404 }
    );
  }

  /* ================= DÖF KONTROL ================= */
  const { data: dof, error: dofError } = await supabase
    .from("dof_reports")
    .select("id, status, org_id")
    .eq("id", dof_id)
    .eq("org_id", orgMember.org_id)
    .single();

  if (dofError || !dof) {
    return NextResponse.json(
      { error: "DÖF bulunamadı" },
      { status: 404 }
    );
  }

  if (dof.status === "closed") {
    return NextResponse.json(
      { error: "DÖF zaten kapalı" },
      { status: 400 }
    );
  }

  /* ================= GUARD ================= */
  const guard = await guardDofNotSubmitted(
    supabase,
    { dofId: dof_id },
    "DÖF kapatma"
  );
  if (guard) return guard;

  /* ================= ITEM KONTROL ================= */
  const { data: items, error: itemsError } = await supabase
    .from("dof_items")
    .select("id, status")
    .eq("dof_report_id", dof_id);

  if (itemsError) {
    return NextResponse.json(
      { error: itemsError.message },
      { status: 400 }
    );
  }

  const unfinishedItems =
    items?.filter(i => i.status !== "completed") ?? [];

  if (unfinishedItems.length > 0) {
    return NextResponse.json(
      {
        error: "Tüm maddeler tamamlanmadan DÖF kapatılamaz",
        code: "UNFINISHED_ITEMS",
        openItemCount: unfinishedItems.length,
      },
      { status: 400 }
    );
  }

  /* ================= CLOSE ================= */
  const { error } = await supabase
    .from("dof_reports")
    .update({
      status: "closed", // ✅ TABLOYA UYGUN
    })
    .eq("id", dof_id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
