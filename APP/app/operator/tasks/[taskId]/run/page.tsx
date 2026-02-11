// APP/app/operator/tasks/[taskId]/run/page.tsx

import TaskRunClient from "@/components/operator/TaskRunClient";
import { getOperatorContext } from "@/lib/operator/context";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

interface TaskRunPageProps {
  params: { taskId: string };
}

export default async function TaskRunPage({ params }: TaskRunPageProps) {
  const { user, member } = await getOperatorContext();
  if (!user || !member) return notFound();

  const db = supabaseServiceRoleClient();
  const taskId = params.taskId;

  // 1️⃣ Assigned task (RLS bypass)
  const { data: assigned } = await db
    .from("assigned_tasks")
    .select("id, template_id, status, operator_id, org_id")
    .eq("id", taskId)
    .maybeSingle();

  if (!assigned) return notFound();
  if (assigned.operator_id !== user.id) return notFound();
  if (assigned.org_id !== member.org_id) return notFound();

  // 2️⃣ Status auto-start
  if (assigned.status === "pending") {
    await db
      .from("assigned_tasks")
      .update({ status: "in_progress", updated_at: new Date().toISOString() })
      .eq("id", assigned.id);
  }

  // 3️⃣ Template
  const { data: tpl } = await db
    .from("templates")
    .select("fields")
    .eq("id", assigned.template_id)
    .maybeSingle();

  if (!tpl) return notFound();

  // 4️⃣ Questions normalize
  const questions = (Array.isArray(tpl.fields) ? tpl.fields : [])
    .filter(f => f.type !== "divider")
    .map((f, i) => ({
      id: f.key ?? `q_${i}`,
      text: f.label ?? "",
    }));

  const org = {
    id: member.org_id,
    name: "Operatör Organizasyon",
  };

  return (
    
      <TaskRunClient
        taskId={assigned.id}
        user={user}
        org={org}
        questions={questions}
      />
  );
}
