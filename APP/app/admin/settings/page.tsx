// APP/app/admin/settings/page.tsx
export const dynamic = "force-dynamic";

import { supabaseServerClient } from "@/lib/supabase/server";
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

const user = data.user; // ✅ artık TS için kesin non-null


  /* ================= ADMIN CONTEXT ================= */
  const { org, member } = await getAdminContext();

  const isPremium = org.is_premium === true;
  const activeTab: SettingsTabKey = searchParams?.tab ?? "general";

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
            userId={user.id}       // ✅ Auth user ID
            orgId={member.org_id}  // ✅ Member org ID
          />
        );

      case "billing":
        return (
          <BillingSettings
            isPremium={isPremium}
            role={member.role}
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
        <div>{renderTabContent()}</div>
      </div>
    </SettingsLayout>
  );
}
