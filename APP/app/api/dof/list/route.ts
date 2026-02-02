import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = supabaseServerClient();
  const { searchParams } = new URL(req.url);

  const status = searchParams.get("status");
  const hasAi = searchParams.get("has_ai") === "true";
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 10);

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  console.info("[DOF LIST]", { status, hasAi, page, limit });

  /* AUTH */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ dofs: [], total: 0 }, { status: 401 });
  }

  /* ORG */
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return NextResponse.json({ dofs: [], total: 0 });
  }

  /* QUERY */
  let query = supabase
    .from("dof_reports")
    .select(
      `
      id,
      report_no,
      status,
      created_at,
      description,
      konu,
      dof_items (
        id,
        dof_item_ai_analysis ( id )
      )
    `,
      { count: "exact" }
    )
    .eq("org_id", profile.organization_id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("[DOF LIST ERROR]", error);
    return NextResponse.json({ dofs: [], total: 0 }, { status: 500 });
  }

  const dofs = (data ?? [])
    .filter((d) => {
      if (!hasAi) return true;
      return d.dof_items?.some(
        (i: any) => i.dof_item_ai_analysis
      );
    })
    .map((d) => ({
      id: d.id,
      title: d.konu || d.description || d.report_no,
      status: d.status === "closed" ? "closed" : "open",
      created_at: d.created_at,
      has_ai:
        d.dof_items?.some(
          (i: any) => i.dof_item_ai_analysis
        ) ?? false,
    }));

  return NextResponse.json({
    dofs,
    total: count ?? 0,
    page,
    limit,
  });
}
