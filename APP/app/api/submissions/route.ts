//APP\app\api\submissions\route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = supabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const { data: member } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!member) {
    return NextResponse.json(
      { error: "Organizasyon bulunamadı" },
      { status: 403 }
    );
  }

  const { data } = await supabase
    .from("submissions")
    .select("*, ai_analysis(*)")
    .eq("org_id", member.org_id)
    .order("created_at", { ascending: false });

  return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  const supabase = supabaseServerClient();
  const body = await req.json();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const { data: member } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!member) {
    return NextResponse.json(
      { error: "Organizasyon bulunamadı" },
      { status: 403 }
    );
  }

  const { error } = await supabase.from("submissions").insert({
    ...body,
    org_id: member.org_id,
    user_id: userId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
