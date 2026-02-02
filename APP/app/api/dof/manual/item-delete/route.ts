// APP/app/api/dof/item-delete/route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = supabaseServerClient();

  try {
    const body = await req.json();
    const { item_id } = body;

    console.log("[DOF_ITEM_DELETE] Request received", {
      item_id,
    });

    if (!item_id) {
      console.warn("[DOF_ITEM_DELETE] item_id missing");
      return NextResponse.json(
        { error: "item_id zorunludur" },
        { status: 400 }
      );
    }

    // 🔍 Önce var mı kontrol et
    const { data: existingItem, error: fetchError } = await supabase
      .from("dof_items")
      .select("id, dof_report_id, status")
      .eq("id", item_id)
      .single();

    if (fetchError || !existingItem) {
      console.warn("[DOF_ITEM_DELETE] Item not found", {
        item_id,
        fetchError,
      });

      return NextResponse.json(
        { error: "DÖF maddesi bulunamadı" },
        { status: 404 }
      );
    }

    console.log("[DOF_ITEM_DELETE] Item found", {
      item_id: existingItem.id,
      dof_report_id: existingItem.dof_report_id,
      status: existingItem.status,
    });

    // ❌ Sil
    const { error: deleteError } = await supabase
      .from("dof_items")
      .delete()
      .eq("id", item_id);

    if (deleteError) {
      console.error("[DOF_ITEM_DELETE] Delete failed", {
        item_id,
        error: deleteError.message,
      });

      return NextResponse.json(
        { error: deleteError.message },
        { status: 400 }
      );
    }

    console.log("[DOF_ITEM_DELETE] Item deleted successfully", {
      item_id,
      dof_report_id: existingItem.dof_report_id,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DOF_ITEM_DELETE] Unexpected error", {
      message: err?.message,
      stack: err?.stack,
    });

    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}
