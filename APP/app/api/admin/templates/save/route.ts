export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = supabaseServerClient();
    const body = await req.json();

    console.log("SAVE BODY:", body);

    const { name, fields } = body;

    if (!name || !Array.isArray(fields)) {
      return NextResponse.json(
        { success: false, error: "Geçersiz şablon verisi." },
        { status: 400 }
      );
    }

    // Kullanıcı bilgisi
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Auth bulunamadı." },
        { status: 401 }
      );
    }

    // Profil bilgisi
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json(
        { success: false, error: "Profil bulunamadı." },
        { status: 400 }
      );
    }

    const orgId = profile.organization_id;

    // TEMPLATE INSERT
    const { data, error } = await supabase
      .from("templates")
      .insert({
        name,
        fields,
        org_id: orgId,
        fields_count: fields.length,
        tags: ["OCR", "auto-generated"],
      })
      .select()
      .single();

    if (error) {
      console.error("SUPABASE ERROR:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, template: data });
  } catch (err: any) {
    console.error("SAVE ROUTE ERROR:", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
