import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = supabaseServerClient();

  const { data, error } = await supabase
    .from("dof_word_templates")
    .select(`
      id,
      name,
      version,
      file_path,
      is_active,
      created_at
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ templates: data ?? [] });
}
