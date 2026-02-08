//APP\app\components\premium\DashboardBanner.tsx
import DenetronPremiumBadge from "./DenetronPremiumBadge";

export default function PremiumDashboardBanner({
  subscription,
}: {
  subscription: {
    status: "active" | "trial" | "past_due";
    renewAt?: string;
  };
}) {
  if (subscription.status !== "active") return null;

  return (
    <div className="w-full p-5 rounded-lg bg-[#0D0D0D] border border-[#D4AF37]/40">
      <div>
        <h2 className="text-lg font-semibold text-white">
          Premium Üyeliğiniz Aktif
        </h2>

        {subscription.renewAt && (
          <p className="text-xs text-neutral-400 mt-1">
            Yenileme tarihi: {subscription.renewAt}
          </p>
        )}
      </div>

      <DenetronPremiumBadge />
    </div>
  );
}
