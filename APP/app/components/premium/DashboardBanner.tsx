import DenetronPremiumBadge from "./DenetronPremiumBadge";

export default function PremiumDashboardBanner() {
  return (
    <div
      className="
        w-full p-5 rounded-lg 
        bg-[#0D0D0D] 
        border border-[#D4AF37]/40 
        shadow-[0_0_20px_rgba(212,175,55,0.15)]
        flex items-center justify-between
      "
    >
      <div>
        <h2 className="text-lg font-semibold text-white">
          Premium Üyeliğiniz Aktif
        </h2>
        <p className="text-sm text-[#D4AF37] mt-1">
          Tüm ileri seviye Denetron özelliklerini kullanabilirsiniz.
        </p>
      </div>

      <DenetronPremiumBadge />
    </div>
  );
}
