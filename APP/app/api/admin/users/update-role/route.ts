export const dynamic = "force-dynamic";
import { supabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await supabaseServerClient();
  const { userId, role, orgId } = await req.json();

  // 1) Admin mi?
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2) Admin yetkisini doğrula
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", auth.user.id)
    .single();

  if (!profile || profile.role !== "admin" || profile.organization_id !== orgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 3) Rol güncelleme
  await supabase.from("org_members")
    .update({ role })
    .eq("user_id", userId)
    .eq("org_id", orgId);

  await supabase.from("profiles")
    .update({ role })
    .eq("id", userId);

  return NextResponse.json({ success: true });
}
