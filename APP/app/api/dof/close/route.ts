//APP\app\api\dof\close\route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  console.log("[DOF CLOSE] POST request");

  try {
    const supabase = supabaseServerClient();
    const { dof_id } = await req.json();

    console.log("[DOF CLOSE] Payload", { dof_id });

    if (!dof_id) {
      return NextResponse.json(
        { error: "dof_id zorunludur" },
        { status: 400 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn("[DOF CLOSE] Unauthorized");
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { data: openItems } = await supabase
      .from("dof_items")
      .select("id")
      .eq("dof_id", dof_id)
      .neq("status", "completed");

    console.log("[DOF CLOSE] Open items count", {
      count: openItems?.length ?? 0,
    });

    if (openItems && openItems.length > 0) {
      return NextResponse.json(
        { error: "Tüm DÖF maddeleri tamamlanmadan kapatılamaz" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("dof_reports")
      .update({
        status: "closed",
        closed_at: new Date().toISOString(),
      })
      .eq("id", dof_id);

    if (error) {
      console.error("[DOF CLOSE] UPDATE ERROR", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("[DOF CLOSE] SUCCESS", { dof_id });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DOF CLOSE] FATAL", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
