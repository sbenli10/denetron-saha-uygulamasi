//APP\app\components\operator\tasks\[id]\start\page.tsx
import { notFound } from "next/navigation";
import { getOperatorContext } from "@/lib/operator/context";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";
import TaskRunClient from "@/components/operator/TaskRunClient";

export default async function OperatorTaskStartPage({
  params,
}: {
  params: { id: string };
}) {
  const { member, user } = await getOperatorContext();
  if (!member || !user) return notFound();

  const db = supabaseServiceRoleClient();
  const taskId = params.id;

  // 1️⃣ Assigned task
  const { data: task } = await db
    .from("assigned_tasks")
    .select("id, org_id, template_id, operator_id, status")
    .eq("id", taskId)
    .maybeSingle();

  if (!task) return notFound();
  if (task.org_id !== member.org_id) return notFound();
  if (task.operator_id !== user.id) return notFound();

  // 2️⃣ Görev başlatıldı
  if (task.status === "pending") {
    await db
      .from("assigned_tasks")
      .update({
        status: "in_progress",
        updated_at: new Date().toISOString(),
      })
      .eq("id", task.id);
  }

  // 3️⃣ Template
  const { data: tpl } = await db
    .from("templates")
    .select("id, fields")
    .eq("id", task.template_id)
    .maybeSingle();

  if (!tpl || !Array.isArray(tpl.fields)) return notFound();

  // 4️⃣ Sorular — 🔴 InspectionFlow ile %100 UYUMLU
  const questions = tpl.fields
    .filter((f: any) => f.type !== "divider")
    .map((f: any, i: number) => ({
      id: f.key ?? `q_${i}`,      // InspectionFlow current.id
      text: f.label ?? "",        // InspectionFlow current.text
    }));

  // 5️⃣ Gerekli org bilgisi
  const org = {
    id: member.org_id,
    name: "Organizasyon",
  };

  return (
    <TaskRunClient
      taskId={task.id}
      user={{
        id: user.id,
        name: user.user_metadata?.full_name ?? null,
        email: user.email ?? null,
      }}
      org={org}
      questions={questions}
    />
  );
}
