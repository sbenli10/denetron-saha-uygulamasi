// APP/app/api/risk-templates/delete/route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function DELETE(req: Request) {
  const supabase = supabaseServerClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "id zorunlu" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("risk_templates")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
