//APP\app\admin\tasks\assign\actions.ts
"use server";

import { revalidatePath } from "next/cache";

export async function assignTasks(_prev: any, formData: FormData) {
  const payload = {
    template_id: formData.get("template_id"),
    operator_ids: JSON.parse(
      (formData.get("operator_ids") as string) || "[]"
    ),
  };

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/tasks/assign`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    return { success: false, message: err.error };
  }

  revalidatePath("/admin/tasks");

  return {
    success: true,
    message: "Görevler operatörlere başarıyla atandı.",
  };
}
