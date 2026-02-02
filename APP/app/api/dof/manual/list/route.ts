import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = supabaseServerClient();

  /* ================= AUTH ================= */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Yetkisiz" },
      { status: 401 }
    );
  }

  /* ================= ORG ================= */
  const { data: orgMember } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (!orgMember) {
    return NextResponse.json(
      { error: "Organizasyon bulunamadı" },
      { status: 404 }
    );
  }

  /* ================= PAGINATION ================= */
  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get("page") ?? 1);
  const pageSize = Number(searchParams.get("pageSize") ?? 10);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  /* ================= QUERY ================= */
  const { data, count, error } = await supabase
    .from("dof_reports")
    .select(
      `
      id,
      report_no,
      description,
      status,
      created_at
      `,
      { count: "exact" } // 🔑 TOTAL SAYI
    )
    .eq("org_id", orgMember.org_id)
    .eq("source_type", "manual")
    .order("created_at", { ascending: false })
    .range(from, to); // 🔑 SADECE BU SAYFA

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    dofs: data ?? [],
    total: count ?? 0, // 🔑 PAGINATION İÇİN ŞART
  });
}
