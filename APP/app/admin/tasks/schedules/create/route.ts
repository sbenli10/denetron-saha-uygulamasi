// APP/app/admin/tasks/schedules/create/route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = supabaseServerClient();
  const body = await req.json();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    template_id,
    operator_ids,
    frequency,
    interval,
    day_of_week,
    day_of_month,
  } = body;

  const { data: member } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member) {
    return NextResponse.json({ error: "Org not found" }, { status: 400 });
  }

  await supabase.from("task_schedules").insert({
    org_id: member.org_id,
    template_id,
    operator_ids,
    frequency,
    interval,
    day_of_week: day_of_week ?? null,
    day_of_month: day_of_month ?? null,
    next_run_at: new Date().toISOString(),
    timezone: "Europe/Istanbul",
    status: "active",
    created_by: user.id,
  });

  return NextResponse.json({ success: true });
}
