// APP/app/api/risk-templates/route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = supabaseServerClient();

  const { data, error } = await supabase
    .from("risk_templates")
    .select(`
      id,
      area,
      equipment,
      risk_text,
      action_text,
      legislation,
      default_severity,
      created_at
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ templates: data ?? [] });
}
