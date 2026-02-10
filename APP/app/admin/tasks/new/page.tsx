// APP/app/admin/tasks/new/page.tsx
export const dynamic = "force-dynamic";

import ManualTaskClient from "./page.client";
import { getAdminContext } from "@/lib/admin/context";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";

type PageData =
  | { blocked: true }
  | {
      blocked: false;
      templates: {
        id: string;
        name: string;
      }[];
      operators: {
        id: string;
        full_name: string;
        email: string;
      }[];
    };

async function getData(): Promise<PageData> {
  const { member, org, access } = await getAdminContext();

  if (!member || !org) {
    throw new Error("Yetkisiz erişim");
  }

  // ❌ FREE PLAN ENGELİ
  if (!access.premium) {
    return { blocked: true };
  }

  const db = supabaseServiceRoleClient();

  const [templatesRes, operatorsRes] = await Promise.all([
    db
      .from("templates")
      .select("id, name")
      .eq("org_id", member.org_id)
      .eq("is_active", true),

    db
      .from("v_org_operators")
      .select("user_id, name, email")
      .eq("org_id", member.org_id),
  ]);

  return {
    blocked: false,
    templates:
      templatesRes.data?.map((t) => ({
        id: String(t.id),
        name: t.name,
      })) ?? [],
    operators:
      operatorsRes.data?.map((o) => ({
        id: String(o.user_id),
        full_name: o.name,
        email: o.email,
      })) ?? [],
  };
}

export default async function NewManualTaskPage() {
  const data = await getData();

  if (data.blocked) {
    return (
      <div className="p-10 text-center space-y-3">
        <div className="text-lg font-medium text-slate-700">
          Bu özellik Premium planlara özeldir
        </div>
        <p className="text-sm text-slate-500">
          Manuel görev oluşturmak için deneme veya premium plana geçmeniz gerekir.
        </p>
      </div>
    );
  }

  return (
    <ManualTaskClient
      templates={data.templates}
      operators={data.operators}
    />
  );
}
