// APP/app/api/admin/library/search/route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  console.info("========== LIBRARY SEARCH START ==========");

  const supabase = supabaseServerClient();
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q") ?? "";
  const folderId = searchParams.get("folder_id");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.warn("[AUTH] Unauthorized");
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  let query = supabase
    .from("library_files")
    .select("*")
    .eq("org_id", profile?.organization_id)
    .order("created_at", { ascending: false });

  if (folderId) {
    query = query.eq("folder_id", folderId);
  }

  if (q) {
    query = query.or(
      `name.ilike.%${q}%,mime_type.ilike.%${q}%,tags.cs.{${q}}`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("[DB] Search failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.info(`[DB] Search results: ${data?.length ?? 0}`);
  console.info("========== LIBRARY SEARCH END ==========");

  return NextResponse.json({ files: data });
}
