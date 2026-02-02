import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  console.info("[DOF_ITEM_UPDATE_LONG_DESCRIPTION] ===== REQUEST START =====");

  try {
    const supabase = supabaseServerClient();
    const body = await req.json();

    const { item_id, long_description } = body;

    if (!item_id) {
      return NextResponse.json(
        { error: "item_id zorunludur" },
        { status: 400 }
      );
    }

    if (
      long_description !== null &&
      long_description !== undefined &&
      typeof long_description !== "string"
    ) {
      return NextResponse.json(
        { error: "long_description metin olmalıdır" },
        { status: 400 }
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { data: orgMember } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single();

    if (!orgMember) {
      return NextResponse.json(
        { error: "Organizasyon bulunamadı" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("dof_items")
      .update({
        long_description: long_description?.trim() || null,
      })
      .eq("id", item_id);

    if (error) {
      console.error("[DOF_ITEM_UPDATE_LONG_DESCRIPTION] DB ERROR", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.info("[DOF_ITEM_UPDATE_LONG_DESCRIPTION] SUCCESS", { item_id });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DOF_ITEM_UPDATE_LONG_DESCRIPTION] FATAL", err);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}
