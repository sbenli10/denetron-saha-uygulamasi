import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  console.info("=== LOCK FOLDER START ===");

  const supabase = supabaseServerClient();
  const { folder_id, password } = await req.json();

  if (!folder_id || !password) {
    return NextResponse.json(
      { error: "Eksik veri" },
      { status: 400 }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const hash = await bcrypt.hash(password, 10);

  const { error } = await supabase
    .from("library_folders")
    .update({
      is_locked: true,
      password_hash: hash,
    })
    .eq("id", folder_id);

  if (error) {
    console.error("Lock error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  console.info("=== LOCK FOLDER END ===");

  return NextResponse.json({ success: true });
}
