// APP/app/admin/settings/page.tsx
export const dynamic = "force-dynamic";

import { supabaseServerClient } from "@/lib/supabase/server";
import { supabaseServiceRoleClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin/context";

import SettingsLayout from "./_components/SettingsLayout";
import SettingsTabs, { SettingsTabKey } from "./_components/SettingsTabs";

/* TAB CONTENT */
import GeneralSettings from "./tabs/GeneralSettings";
import SecuritySettings from "./tabs/SecuritySettings";
import BillingSettings from "./tabs/BillingSettings";
import IntegrationSettings from "./tabs/IntegrationSettings";

interface SettingsPageProps {
  searchParams?: {
    tab?: SettingsTabKey;
  };
}

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
  /* ================= AUTH USER ================= */
  const supabase = supabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    throw new Error("Unauthorized");
  }

  const user = data.user;

  /* ================= ADMIN CONTEXT ================= */
  const { org, member, access } = await getAdminContext();

  /* ================= SUBSCRIPTION ================= */
  const admin = supabaseServiceRoleClient();

  const { data: subscription } = await admin
    .from("org_subscriptions")
    .select("plan, status, trial_used, expires_at")
    .eq("org_id", org.id)
    .maybeSingle();

  /**
   * Fallback:
   * - Eski premium org’lar
   * - Henüz subscription kaydı olmayanlar
   */
  const safeSubscription = subscription ?? {
    plan: access.premium ? "premium" : "free",
    status: "active",
    trial_used: false,
    expires_at: null,
  };

  const isPremium = access.premium; // ✅ TEK KAYNAK

  const activeTab: SettingsTabKey = searchParams?.tab ?? "general";

  /* ================= TAB RENDER ================= */
  function renderTabContent() {
    switch (activeTab) {
      case "general":
        return (
          <GeneralSettings
            initial={{
              orgName: org.name,
              logoUrl: org.settings?.logo_url ?? null,
              language: org.settings?.language ?? "tr",
              timezone: org.settings?.timezone ?? "Europe/Istanbul",
            }}
          />
        );

      case "security":
        return (
          <SecuritySettings
            isPremium={isPremium}
            role={member.role}
            userId={user.id}
            orgId={member.org_id}
          />
        );

      case "billing":
        return (
          <BillingSettings
            role={member.role}
            subscription={safeSubscription}
          />
        );

      case "integrations":
        return (
          <IntegrationSettings
            isPremium={isPremium}
            role={member.role}
          />
        );

      default:
        return null;
    }
  }

  return (
    <SettingsLayout>
      <div className="space-y-8">
        <SettingsTabs isPremium={isPremium} />
        {renderTabContent()}
      </div>
    </SettingsLayout>
  );
}
