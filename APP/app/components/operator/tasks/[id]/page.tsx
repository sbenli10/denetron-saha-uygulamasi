// APP/app/components/operator/tasks/[id]/page.tsx
import { notFound } from "next/navigation";
import { getOperatorContext } from "@/lib/operator/context";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";
import TaskDetailClient from "./TaskDetail.client";

export default async function TaskDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { member, user } = await getOperatorContext();
  if (!member || !user) return notFound();

  const db = supabaseServiceRoleClient();

  const { data: task } = await db
    .from("assigned_tasks")
    .select(`
      id,
      status,
      severity,
      due_date,
      created_at,
      org_id,
      operator_id,
      template_id
    `)
    .eq("id", params.id)
    .maybeSingle();

  if (!task) return notFound();
  if (task.org_id !== member.org_id) return notFound();
  if (task.operator_id !== user.id) return notFound();

  return <TaskDetailClient task={task} />;
}
