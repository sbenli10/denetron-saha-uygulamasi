// APP/app/api/risk-templates/create/route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = supabaseServerClient();
  const body = await req.json();

  const {
    id,
    area,
    equipment,
    risk_text,
    action_text,
    legislation,
    default_severity,
  } = body;

  if (!area || !equipment || !risk_text || !action_text) {
    return NextResponse.json(
      { error: "Zorunlu alanlar eksik" },
      { status: 400 }
    );
  }

  const payload = {
    area,
    equipment,
    risk_text,
    action_text,
    legislation: legislation ?? null,
    default_severity: default_severity ?? "medium",
  };

  const query = id
    ? supabase.from("risk_templates").update(payload).eq("id", id)
    : supabase.from("risk_templates").insert(payload);

  const { error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
