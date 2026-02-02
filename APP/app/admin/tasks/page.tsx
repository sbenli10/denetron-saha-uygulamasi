// APP/app/admin/tasks/page.tsx
export const dynamic = "force-dynamic";

import AssignScheduleClient from "./page.client";
import { loadTaskData } from "./load";


export default async function Page() {
  console.log("🧠 [TASKS PAGE] SERVER RENDER");
  const data = await loadTaskData();

  return (
   
      <AssignScheduleClient
        templates={data.templates}
        operators={data.operators}
        isPremium={data.isPremium} // ✅ DOĞRU KAYNAK
        role={data.role}           // ✅ DOĞRU KAYNAK
      />
  );
}
