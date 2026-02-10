// APP/app/admin/tasks/schedules/new/page.tsx
export const dynamic = "force-dynamic";

import ScheduleBuilder from "@/components/assign/ScheduleBuilder";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";
import { TemplateDTO, OperatorDTO } from "@/components/assign/types";

/* ============================
   SERVER'DA VERİ YÜKLEME
=============================== */
async function getData(orgId: string) {
  const db = supabaseServiceRoleClient();

  const [templatesRes, operatorsRes] = await Promise.all([
    db
      .from("templates")
      .select("id, name")
      .eq("org_id", orgId)
      .eq("is_active", true),

    db
      .from("v_org_operators")
      .select("user_id, name, email")
      .eq("org_id", orgId),
  ]);

  const templates: TemplateDTO[] =
    templatesRes.data?.map(t => ({
      id: String(t.id),
      name: t.name,
    })) ?? [];

  const operators: OperatorDTO[] =
    operatorsRes.data?.map(o => ({
      id: String(o.user_id),
      full_name: o.name,
      email: o.email,
    })) ?? [];

  return { templates, operators };
}

/* ============================
   PAGE COMPONENT
=============================== */
export default async function NewSchedulePage() {
  const { org, member, access } = await getAdminContext();

  const { templates, operators } = await getData(member.org_id);

  return (
    <div className="max-w-6xl mx-auto py-10 space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-amber-300">
          Yeni Görev Planı (Ön İzleme)
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Bu sayfa sadece UI ön izlemesi içindir. Buradan görev oluşturulmaz.
        </p>
      </header>

      <ScheduleBuilder
        templates={templates}
        operators={operators}
        isPremium={access.premium}   // ✅ trial + premium
        role={member.role}           // ✅ role_name YOK
      />
    </div>
  );
}
