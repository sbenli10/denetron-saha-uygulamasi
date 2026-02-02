// APP/app/api/admin/tasks/assign/route.ts
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";

export async function POST(req: Request) {
  try {
    const supabase = supabaseServerClient();
    const { member, user } = await getAdminContext();

    if (!user || !member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      template_id,
      operator_ids,
      due_date,
      note,
    } = await req.json();

    if (!template_id || !Array.isArray(operator_ids) || operator_ids.length === 0) {
      return NextResponse.json(
        { error: "template_id ve operator_ids zorunlu" },
        { status: 400 }
      );
    }

    // Template doğrulama
    const { data: template } = await supabase
      .from("templates")
      .select("id, severity")
      .eq("id", template_id)
      .eq("org_id", member.org_id)
      .maybeSingle();

    if (!template) {
      return NextResponse.json({ error: "Template bulunamadı" }, { status: 404 });
    }

    // Operatör doğrulama
    const { data: members } = await supabase
      .from("org_members")
      .select("user_id")
      .eq("org_id", member.org_id)
      .in("user_id", operator_ids);

    if (!members || members.length !== operator_ids.length) {
      return NextResponse.json(
        { error: "Geçersiz operatör" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const rows = operator_ids.map((opId) => ({
      org_id: member.org_id,
      operator_id: opId,
      template_id,
      status: "pending",
      severity: template.severity ?? "low",
      due_date: due_date ?? null,
      assigned_at: now,
      created_at: now,
      updated_at: now,
    }));

    const { error } = await supabase.from("assigned_tasks").insert(rows);

    if (error) {
      console.error("assigned_tasks insert error:", error);
      return NextResponse.json({ error: "Görev atanamadı" }, { status: 500 });
    }

    // Audit log
    await supabase.from("audit_logs").insert({
      organization_id: member.org_id,
      user_id: user.id,
      action: "manual_task_assign",
      metadata: { template_id, operator_ids, due_date, note },
    });

    return NextResponse.json({
      success: true,
      assigned_count: operator_ids.length,
    });
  } catch (e) {
    console.error("assign error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
