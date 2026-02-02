//APP\app\admin\tasks\new\page.tsx
export const dynamic = "force-dynamic";

import ManualTaskClient from "./page.client";
import { getAdminContext } from "@/lib/admin/context";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";


type PageData =
  | { redirectPremium: true }
  | {
      redirectPremium: false;
      templates: any[];
      operators: any[];
    };

async function getData(): Promise<PageData> {
  const { member, org } = await getAdminContext();

  if (!member || !org) {
    throw new Error("Yetkisiz erişim");
  }

  // ❗ Premium kullanıcı bu sayfayı kullanamaz
  if (org.is_premium) {
    return { redirectPremium: true };
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
    redirectPremium: false,
    templates:
      templatesRes.data?.map((t) => ({
        id: t.id,
        name: t.name,
      })) ?? [],
    operators:
      operatorsRes.data?.map((o) => ({
        id: o.user_id,
        full_name: o.name,
        email: o.email,
      })) ?? [],
  };
}

export default async function NewManualTaskPage() {
  const data = await getData();

  if (data.redirectPremium) {
    return (
  
        <div className="p-10 text-center text-slate-600">
          Bu sayfa yalnızca Free plan içindir.
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
