"use client";

import { useState } from "react";
import PlanCard from "../_components/PlanCard";
import { startTrial } from "../actions/billingActions";
import PlanComparison from "../_components/PlanComparison";
interface BillingSettingsProps {
  isPremium: boolean;
  role: string;
}

export default function BillingSettings({
  isPremium,
  role,
}: BillingSettingsProps) {
  const [loading, setLoading] = useState(false);

  async function handleStartTrial() {
    setLoading(true);
    const res = await startTrial();
    setLoading(false);

    if (res?.error) {
      alert(res.error);
    } else {
      window.location.reload();
    }
  }

  return (
    <div className="space-y-10">

      {/* HEADER */}
      <div>
        <h2 className="text-xl font-semibold">
          Plan & Faturalama
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Planınızı yönetin ve premium özelliklere erişin.
        </p>
      </div>

      {/* PLANS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* FREE */}
        <PlanCard
          title="Free"
          price="₺0"
          features={[
            "Temel denetimler",
            "Görev takibi",
            "Mobil erişim",
          ]}
        />

        {/* TRIAL */}
        <PlanCard
          title="Deneme (7 Gün)"
          price="Ücretsiz"
          highlighted
          features={[
            "Tüm premium özellikler",
            "IBYS / e-Reçete entegrasyonu",
            "Sınırsız rapor",
            "Otomatik Denetim Şablonu Oluşturma",
            "Sınırısız Denetim Raporu Gönderimi",
            "Yapay Zeka ile Anlık Rapor Analizi",
            "Yapay Zeka İş Asistanı"          
          ]}
          action={
            !isPremium && role === "admin" ? (
              <button
                onClick={handleStartTrial}
                disabled={loading}
                className="w-full mt-4 px-4 py-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition"
              >
                7 Günlük Denemeyi Başlat
              </button>
            ) : null
          }
        />

        {/* PREMIUM */}
        <PlanCard
          title="Premium"
          price="Teklif Al"
          features={[
            "Sınırsız denetim",
            "Tüm entegrasyonlar",
            "Öncelikli destek",
            "Otomatik Denetim Şablonu Oluşturma",
            "Sınırısız Denetim Raporu Gönderimi",
            "Yapay Zeka ile Anlık Rapor Analizi",
            "Yapay Zeka İş Asistanı"
          ]}
          action={
            role === "admin" && !isPremium ? (
              <button
                className="w-full mt-4 px-4 py-2 rounded-xl border border-indigo-500 text-indigo-600 hover:bg-indigo-50 transition"
              >
                Satış Ekibiyle İletişime Geç
              </button>
            ) : null
          }
        />

        <PlanComparison />
      </div>
    </div>
  );
}
