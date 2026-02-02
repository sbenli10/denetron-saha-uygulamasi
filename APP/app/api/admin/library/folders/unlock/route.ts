import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = supabaseServerClient();
  const { folder_id, password } = await req.json();

  const { data: folder } = await supabase
    .from("library_folders")
    .select("password_hash")
    .eq("id", folder_id)
    .single();

  if (!folder) {
    return NextResponse.json({ error: "Klasör yok" }, { status: 404 });
  }

  const valid = await bcrypt.compare(
    password,
    folder.password_hash
  );

  if (!valid) {
    return NextResponse.json(
      { error: "Şifre yanlış" },
      { status: 403 }
    );
  }

  return NextResponse.json({ success: true });
}
