// APP/app/api/dof/manual/delete/route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  console.log("[DOF_DELETE] Request received");

  const supabase = supabaseServerClient();

  /* ================= BODY ================= */
  let body: { dof_id?: string };
  try {
    body = await req.json();
    console.log("[DOF_DELETE] Request body:", body);
  } catch (err) {
    console.error("[DOF_DELETE] Invalid JSON body", err);
    return NextResponse.json(
      { error: "Geçersiz JSON body" },
      { status: 400 }
    );
  }

  const { dof_id } = body;

  if (!dof_id) {
    console.warn("[DOF_DELETE] Missing dof_id");
    return NextResponse.json(
      { error: "dof_id zorunludur" },
      { status: 400 }
    );
  }

  /* ================= AUTH ================= */
  console.log("[DOF_DELETE] Checking auth");

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("[DOF_DELETE] Auth error:", authError);
  }

  if (!user) {
    console.warn("[DOF_DELETE] Unauthorized request");
    return NextResponse.json(
      { error: "Yetkisiz" },
      { status: 401 }
    );
  }

  console.log("[DOF_DELETE] Authenticated user:", user.id);

  /* ================= ORG ================= */
  console.log("[DOF_DELETE] Fetching org membership");

  const { data: orgMember, error: orgError } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (orgError) {
    console.error("[DOF_DELETE] Org lookup error:", orgError);
  }

  if (!orgMember) {
    console.warn("[DOF_DELETE] Org not found for user:", user.id);
    return NextResponse.json(
      { error: "Organizasyon bulunamadı" },
      { status: 404 }
    );
  }

  console.log("[DOF_DELETE] User org_id:", orgMember.org_id);

  /* ================= DOF CHECK ================= */
  console.log("[DOF_DELETE] Fetching DOF:", dof_id);

  const { data: dof, error: dofError } = await supabase
    .from("dof_reports")
    .select("id, org_id, status")
    .eq("id", dof_id)
    .eq("org_id", orgMember.org_id)
    .single();

  if (dofError) {
    console.error("[DOF_DELETE] DOF lookup error:", dofError);
  }

  if (!dof) {
    console.warn("[DOF_DELETE] DOF not found or org mismatch:", dof_id);
    return NextResponse.json(
      { error: "DÖF bulunamadı" },
      { status: 404 }
    );
  }

  console.log("[DOF_DELETE] DOF found:", {
    id: dof.id,
    status: dof.status,
  });

  /* ================= BUSINESS RULE ================= */
  if (dof.status === "open") {
    console.warn("[DOF_DELETE] Attempt to delete OPEN DOF:", dof.id);
    return NextResponse.json(
      { error: "Açık durumdaki DÖF silinemez" },
      { status: 403 }
    );
  }

  /* ================= DELETE ================= */
  console.log("[DOF_DELETE] Deleting DOF:", dof.id);

  const { error: deleteError } = await supabase
    .from("dof_reports")
    .delete()
    .eq("id", dof_id);

  if (deleteError) {
    console.error("[DOF_DELETE] Delete failed:", deleteError);
    return NextResponse.json(
      { error: deleteError.message },
      { status: 400 }
    );
  }

  console.log("[DOF_DELETE] DOF deleted successfully:", dof.id);

  /* ================= SUCCESS ================= */
  return NextResponse.json({
    success: true,
    dof_id: dof.id,
  });
}
