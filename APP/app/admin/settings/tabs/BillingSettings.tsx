"use client";

import { useState } from "react";
import { CreditCard, Crown, Sparkles } from "lucide-react";

import PlanCard from "../_components/PlanCard";
import PlanComparison from "../_components/PlanComparison";
import { startTrial } from "../actions/billingActions";

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

  const isAdmin = role === "admin";

  return (
    <div className="space-y-12 max-w-7xl">
      {/* ================= HEADER ================= */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          Plan & Faturalama
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Mevcut planınızı görüntüleyin, deneme sürecini başlatın veya
          premium özelliklere geçiş yapın.
        </p>
      </div>

      {/* ================= STATUS BANNER ================= */}
      <div
        className="
          flex items-center justify-between gap-4
          rounded-2xl border border-border
          bg-muted/40 px-5 py-4
        "
      >
        <div className="flex items-center gap-3">
          {isPremium ? (
            <Crown className="text-amber-500" />
          ) : (
            <CreditCard className="text-slate-500" />
          )}

          <div>
            <p className="text-sm font-medium">
              {isPremium
                ? "Premium plan aktif"
                : "Ücretsiz plan kullanıyorsunuz"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isPremium
                ? "Tüm premium özelliklere erişiminiz var."
                : "Premium özellikleri denemek için deneme başlatabilirsiniz."}
            </p>
          </div>
        </div>

        {!isPremium && isAdmin && (
          <button
            onClick={handleStartTrial}
            disabled={loading}
            className="
              inline-flex items-center gap-2
              rounded-xl bg-indigo-600 px-4 py-2
              text-sm font-medium text-white
              hover:bg-indigo-700 transition
              disabled:opacity-60
            "
          >
            <Sparkles size={16} />
            {loading ? "Başlatılıyor…" : "7 Günlük Deneme Başlat"}
          </button>
        )}
      </div>

      {/* ================= PLANS ================= */}
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
            "Otomatik Denetim Şablonu",
            "Sınırsız Denetim Raporu",
            "Yapay Zeka ile Rapor Analizi",
            "Yapay Zeka İş Asistanı",
          ]}
          action={
            !isPremium && isAdmin ? (
              <button
                onClick={handleStartTrial}
                disabled={loading}
                className="
                  w-full mt-4
                  rounded-xl bg-indigo-600 px-4 py-2
                  text-sm font-medium text-white
                  hover:bg-indigo-700 transition
                  disabled:opacity-60
                "
              >
                {loading
                  ? "Başlatılıyor…"
                  : "7 Günlük Denemeyi Başlat"}
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
            "Otomatik Denetim Şablonu",
            "Sınırsız Denetim Raporu",
            "Yapay Zeka ile Rapor Analizi",
            "Yapay Zeka İş Asistanı",
          ]}
          action={
            isAdmin && !isPremium ? (
              <button
                className="
                  w-full mt-4
                  rounded-xl border border-indigo-600
                  px-4 py-2 text-sm font-medium
                  text-indigo-600
                  hover:bg-indigo-50 transition
                "
              >
                Satış Ekibiyle İletişime Geç
              </button>
            ) : null
          }
        />
      </div>

      {/* ================= COMPARISON ================= */}
      <div>
        <PlanComparison />
      </div>
    </div>
  );
}
