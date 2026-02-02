import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = supabaseServerClient();
  const { id } = await req.json();

  if (!id) {
    return NextResponse.json(
      { error: "id zorunludur" },
      { status: 400 }
    );
  }

  // Şablonu bul
  const { data: tpl, error: tplErr } = await supabase
    .from("dof_word_templates")
    .select("id, org_id, is_active")
    .eq("id", id)
    .single();

  if (tplErr || !tpl) {
    return NextResponse.json(
      { error: "Şablon bulunamadı" },
      { status: 404 }
    );
  }

  // Aynı org içindeki tüm şablonları pasif yap
  await supabase
    .from("dof_word_templates")
    .update({ is_active: false })
    .eq("org_id", tpl.org_id);

  // Seçili olanı aktif yap
  await supabase
    .from("dof_word_templates")
    .update({ is_active: true })
    .eq("id", id);

  return NextResponse.json({ success: true });
}
