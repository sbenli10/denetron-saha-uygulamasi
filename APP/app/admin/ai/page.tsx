// APP/app/admin/ai/page.tsx
export const dynamic = "force-dynamic";

import { getAdminContext } from "@/lib/admin/context";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";
import InsightsBoard from "./insights/ui/InsightsBoard";
import PremiumRequired from "@/app/admin/_components/PremiumRequired";

type SubmissionRow = {
  id: string;
  created_at: string;
  template_name: string | null;
  location: string | null;
  ai_analysis: {
    category?: string | null;
    severity?: string | null;
    risk_score?: number | null;
    title?: string | null;
    note?: string | null;
  } | null;
};

export default async function AdminAiPage() {
  /* 1) Admin Context (RBAC + Access) */
  const { member, org, access } = await getAdminContext();

  /* 2) PREMIUM GUARD — EN BAŞTA */
  if (!access.premium) {
    return <PremiumRequired role={member.role} />;
  }

  /* 3) DATA */
  const admin = supabaseServiceRoleClient();

  const { data, error } = await admin
    .from("submissions")
    .select("id, created_at, template_name, location, ai_analysis")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("AI submissions error:", error.message);
  }

  const submissions = (data ?? []) as SubmissionRow[];

  /* 4) RENDER */
  return (
    <div className="space-y-8 mb-10">
      {/* PAGE HEADER */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          AI İçgörüleri
        </h1>
        <p className="text-sm text-foreground/60 mt-1">
          Yapay zeka tarafından otomatik işlenen saha gönderimlerini görüntüleyin.
        </p>
      </div>

      {/* INSIGHTS */}
      <div className="rounded-xl border border-border bg-card p-4">
        <InsightsBoard submissions={submissions} />
      </div>
    </div>
  );
}
