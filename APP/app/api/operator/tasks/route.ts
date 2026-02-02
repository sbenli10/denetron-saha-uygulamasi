// APP/app/api/operator/tasks/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseServerClient, supabaseServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  const supabaseAuth = supabaseServerClient();

  console.log("🔵 /api/operator/tasks called");

  // 1️⃣ AUTH (hala user session ile)
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  console.log("👤 auth user:", user?.id);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2️⃣ SERVICE ROLE → DB
  const db = supabaseServiceRoleClient();

  // 3️⃣ Aktif org üyelikleri
  const { data: memberships } = await db
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .is("deleted_at", null);

  console.log("🏢 memberships:", memberships);

  if (!memberships || memberships.length === 0) {
    return NextResponse.json(
      { error: "Not an active org member" },
      { status: 403 }
    );
  }

  const orgIds = memberships.map((m) => m.org_id);

  // 4️⃣ ASSIGNED TASKS (RLS BYPASS)
  const { data: tasks, error } = await db
    .from("assigned_tasks")
    .select(`
      id,
      status,
      severity,
      due_date,
      assigned_at,
      created_at,
      org_id,
      template_id
    `)
    .eq("operator_id", user.id)
    .in("org_id", orgIds)
    .order("assigned_at", { ascending: false });

  console.log("📋 tasks:", tasks);
  console.log("❌ taskErr:", error);

  if (error) {
    return NextResponse.json(
      { error: "Task fetch failed", detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(tasks ?? []);
}
