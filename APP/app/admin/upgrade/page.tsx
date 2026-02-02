// APP/app/admin/upgrade/page.tsx
import ShellLayout from "@/components/layout/admin/shell/ShellLayout";
import { getAdminContext } from "@/lib/admin/context";
import UpgradeClient from "./upgradeClient";

export default async function UpgradePage() {
  const { org, member } = await getAdminContext();

  const isPremium = org.is_premium === true;
  const role = member.role ?? null;

  return (
    <ShellLayout>
      <UpgradeClient
        isPremium={isPremium}
        role={role}
        orgName={org.name ?? "Organizasyon"}
      />
    </ShellLayout>
  );
}
