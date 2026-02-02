// APP/app/api/admin/library/files/tag/route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  console.info("========== FILE TAG UPDATE START ==========");

  const supabase = supabaseServerClient();
  const { file_id, tags } = await req.json();

  if (!file_id || !Array.isArray(tags)) {
    console.warn("[VALIDATION] Invalid payload", { file_id, tags });
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.warn("[AUTH] Unauthorized");
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { error } = await supabase
    .from("library_files")
    .update({ tags })
    .eq("id", file_id);

  if (error) {
    console.error("[DB] Tag update failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.info("[DB] Tags updated", { file_id, tags });
  console.info("========== FILE TAG UPDATE END ==========");

  return NextResponse.json({ success: true });
}
