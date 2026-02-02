//APP\app\admin\dashboard\page.tsx
export const dynamic = "force-dynamic";

import { getAdminContext } from "@/lib/admin/context";
import DashboardGrid from "@/components/dashboard/DashboardGrid";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";

// Dashboard verisi anlık/operasyonel olduğu için genelde cache istemez.
// İstersen kaldırabilirsin; sorgulara dokunmaz.
export const revalidate = 0;

export default async function AdminDashboardPage() {
  const { org } = await getAdminContext();
  const db = supabaseServiceRoleClient();

  /* === KPI === */
  const { data: active } = await db
    .from("assigned_tasks")
    .select("id")
    .eq("org_id", org.id)
    .in("status", ["assigned", "in_progress"]);

  const activeCount = active?.length ?? 0;

  const { data: completed } = await db
    .from("assigned_tasks")
    .select("id")
    .eq("org_id", org.id)
    .eq("status", "completed");

  const completedCount = completed?.length ?? 0;

  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: newUsers } = await db
    .from("profiles")
    .select("id")
    .eq("organization_id", org.id)
    .gte("created_at", since30);

  const newUsersCount = newUsers?.length ?? 0;

  const { data: pending } = await db
    .from("assigned_tasks")
    .select("id")
    .eq("org_id", org.id)
    .eq("status", "waiting_review");

  const pendingCount = pending?.length ?? 0;

  /* === 30 Günlük Trend === */
  const { data: trend30 } = await db.rpc("task_trend_last_30_days", {
    p_org_id: org.id,
  });

  /* === 12 Aylık Trend === */
  const { data: trend12m } = await db.rpc("task_trend_last_12_months", {
    p_org_id: org.id,
  });

  /* === 90 Günlük HEATMAP === */
  const { data: heatmap90 } = await db.rpc("heatmap_activity", {
    p_org_id: org.id,
  });

  /* === Son Aktiviteler (VIEW) === */
  const { data: recentActivities } = await db
    .from("v_assigned_tasks_detailed")
    .select("*")
    .eq("org_id", org.id)
    .order("updated_at", { ascending: false })
    .limit(10);

  // Sorgulara dokunmadan, UI tarafına giden veriyi güvenli hale getiriyoruz.
  const safeTrend30 = Array.isArray(trend30) ? trend30 : [];
  const safeTrend12m = Array.isArray(trend12m) ? trend12m : [];
  const safeHeatmap90 = Array.isArray(heatmap90) ? heatmap90 : [];
  const safeRecent = Array.isArray(recentActivities) ? recentActivities : [];

  return (
      <DashboardGrid
        activeInspections={activeCount}
        completedTasks={completedCount}
        newUsers={newUsersCount}
        pendingReports={pendingCount}
        trend30={safeTrend30}
        trend12m={safeTrend12m}
        heatmap90={safeHeatmap90}
        recentActivities={safeRecent}
      />
  );
}
