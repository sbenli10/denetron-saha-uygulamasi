//APP\app\api\dof\item-complete\route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";
import { guardDofNotSubmitted } from "@/lib/dof/guards";

export async function POST(req: Request) {
  const supabase = supabaseServerClient();
  const { item_id } = await req.json();

  if (!item_id) {
    return NextResponse.json(
      { error: "item_id zorunludur" },
      { status: 400 }
    );
  }

  // 1️⃣ Önce item’ı çek → dof_id çöz
  const { data: item, error: itemError } = await supabase
    .from("dof_items")
    .select("id, dof_report_id, status")
    .eq("id", item_id)
    .single();

  if (itemError || !item) {
    return NextResponse.json(
      { error: "DÖF maddesi bulunamadı" },
      { status: 404 }
    );
  }

  // 2️⃣ GUARD → artık dofId VAR
  const guard = await guardDofNotSubmitted(
    supabase,
    { dofId: item.dof_report_id },
    "Madde tamamlama"
  );

  if (guard) return guard;

  // 3️⃣ Maddeyi tamamla
  const { error: updateError } = await supabase
    .from("dof_items")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", item_id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
