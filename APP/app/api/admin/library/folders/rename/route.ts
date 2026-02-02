import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = supabaseServerClient();
  const { id, name } = await req.json();

  await supabase
    .from("library_folders")
    .update({ name })
    .eq("id", id);

  return NextResponse.json({ success: true });
}
