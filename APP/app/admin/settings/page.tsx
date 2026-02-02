// APP/app/admin/settings/page.tsx
export const dynamic = "force-dynamic";

import { getAdminContext } from "@/lib/admin/context";
import ShellLayout from "@/components/layout/admin/shell/ShellLayout";
import SettingsLayout from "./_components/SettingsLayout";
import SettingsTabs, {
  SettingsTabKey,
} from "./_components/SettingsTabs";

/* TAB CONTENT COMPONENTS */
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
  const { org, member } = await getAdminContext();

  console.log("[SETTINGS PAGE] org_id:", org.id);
  console.log("[SETTINGS PAGE] org_settings:", org.settings);

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
          <SecuritySettings isPremium={isPremium} role={member.role} />
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
    <ShellLayout>
      <SettingsLayout>
        <div className="space-y-8">
          <SettingsTabs isPremium={isPremium} />
          <div>{renderTabContent()}</div>
        </div>
      </SettingsLayout>
    </ShellLayout>
  );
}
