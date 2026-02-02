"use client";

import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import DenetronPremiumBadge from "./DenetronPremiumBadge";

export default function PremiumLockScreen({ feature }: { feature: string }) {
  const router = useRouter();

  return (
    <div className="max-w-xl mx-auto p-10 mt-10 rounded-2xl border bg-white shadow-sm text-center">

      {/* Premium Badge Üstte */}
      <div className="flex justify-center mb-4">
        <DenetronPremiumBadge />
      </div>

      {/* Lock Icon */}
      <div className="flex justify-center mb-4">
        <Lock className="h-10 w-10 text-red-500" />
      </div>

      <h2 className="text-2xl font-semibold mb-2">Premium Özellik Engellendi</h2>

      <p className="text-sm text-gray-600 mb-4">
        {feature} yalnızca <strong>Premium organizasyonlar</strong> için aktiftir.
        <br />
        Yöneticinizle iletişime geçebilirsiniz.
      </p>

      <div className="flex justify-center gap-3 mt-6">
        <button
          onClick={() => router.push("/admin/dashboard")}
          className="px-5 py-2 rounded-xl border text-sm hover:bg-gray-100"
        >
          Panele Dön
        </button>
      </div>

      <p className="mt-6 text-xs text-gray-500">
        Premium paket: OCR ile şablon oluşturma, gelişmiş analiz, AI Insights,
        gelişmiş template editörü, risk skoru otomasyonu ve daha fazlası.
      </p>
    </div>
  );
}
