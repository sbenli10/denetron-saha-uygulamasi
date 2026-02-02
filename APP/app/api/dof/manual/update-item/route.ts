// APP/app/api/dof/manual/update-item/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      item_id,
      risk_description,
      action_description,
      long_description,
      severity,
      deadline,
      area,
    } = body;

    if (!item_id) {
      return NextResponse.json(
        { error: "item_id zorunludur" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("dof_items")
      .update({
        risk_description: risk_description?.trim(),
        action_description: action_description?.trim() || null,
        long_description: long_description?.trim() || null,
        severity: severity?.trim() || null,
        deadline: deadline?.trim() || null,
        area: area?.trim() || null,
      })
      .eq("id", item_id);

    if (error) {
      console.error("[UPDATE_ITEM] DB ERROR", error);
      return NextResponse.json(
        { error: "Güncelleme başarısız" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[UPDATE_ITEM] ERROR", err);
    return NextResponse.json(
      { error: "Beklenmeyen hata" },
      { status: 500 }
    );
  }
}
