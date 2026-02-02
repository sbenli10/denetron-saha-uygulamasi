import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = supabaseServerClient();
  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("folder_id");

  /* ================= AUTH ================= */

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ files: [] }, { status: 401 });
  }

  /* ================= PROFILE ================= */

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.organization_id) {
    return NextResponse.json(
      { files: [], error: "Organization not found" },
      { status: 400 }
    );
  }

  /* ================= QUERY ================= */

  let query = supabase
    .from("library_files")
    .select("*")
    .eq("org_id", profile.organization_id)
    .order("created_at", { ascending: false });

  if (folderId) {
    query = query.eq("folder_id", folderId);
  } else {
    query = query.is("folder_id", null);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[LIBRARY FILES FETCH ERROR]", error);
    return NextResponse.json({ files: [] });
  }

  return NextResponse.json({ files: data ?? [] });
}
