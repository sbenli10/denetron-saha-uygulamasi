import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

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
    .select("id, org_id, status")
    .eq("id", dof_id)
    .eq("org_id", orgMember.org_id)
    .single();

  if (dofError || !dof) {
    return NextResponse.json(
      { error: "DÖF bulunamadı" },
      { status: 404 }
    );
  }

  /* ================= DELETE ================= */
  const { error } = await supabase
    .from("dof_reports")
    .delete()
    .eq("id", dof_id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
