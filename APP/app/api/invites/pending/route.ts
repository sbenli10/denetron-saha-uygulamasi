//APP\app\api\invites\pending\route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = supabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Kullanıcının admin olduğu organizasyon
  const { data: member } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member || member.role !== "admin") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const { data: invites, error } = await supabase
    .from("invites")
    .select(`
      id,
      email,
      created_at,
      expires_at,
      roles:role_id ( id, name ),
      invited_by
    `)
    .eq("org_id", member.org_id)
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ invites });
}
