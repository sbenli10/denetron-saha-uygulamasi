// APP/app/admin/upgrade/page.tsx
import { getAdminContext } from "@/lib/admin/context";
import UpgradeClient from "./upgradeClient";

export default async function UpgradePage() {
  const { org, member, access } = await getAdminContext();

  return (
    <UpgradeClient
      isPremium={access.premium}   // ✅ trial + premium
      role={member.role}
      orgName={org.name}
      plan={access.plan}           // 🔥 CTA logic için faydalı
    />
  );
}
