"use client";

import { useState } from "react";
import {
  CreditCard,
  Crown,
  Sparkles,
  Timer,
} from "lucide-react";

import PlanCard from "../_components/PlanCard";
import PlanComparison from "../_components/PlanComparison";
import { startTrial } from "../actions/billingActions";
import TrialBanner from "../_components/TrialBanner";

/* ================================
   TYPES
================================ */

interface Subscription {
  plan: "free" | "trial" | "premium";
  status: "active" | "expired" | "cancelled";
  trial_used: boolean;
  expires_at: string | null;
}

interface BillingSettingsProps {
  role: string;
  subscription: Subscription;
}

/* ================================
   HELPERS
================================ */


/* ================================
   COMPONENT
================================ */

export default function BillingSettings({
  role,
  subscription,
}: BillingSettingsProps) {
  const [loading, setLoading] = useState(false);

  const isAdmin = role === "admin";
  const isPremium = subscription.plan === "premium";
  const isTrial = subscription.plan === "trial";

  const canStartTrial =
    isAdmin &&
    subscription.plan === "free" &&
    !subscription.trial_used &&
    subscription.status === "active";

  async function handleStartTrial() {
    if (!canStartTrial || loading) return;

    setLoading(true);
    const res = await startTrial();
    setLoading(false);

    if ("error" in res) {
      alert(res.error);
      return;
    }

    window.location.reload();
  }

  

  /* ================================
     STATUS CONTENT
  ================================ */

  function getStatusContent() {
    if (isPremium) {
      return {
        title: "Premium plan aktif",
        description:
          "Tüm premium özelliklere sınırsız erişiminiz var.",
        icon: <Crown className="text-amber-500" />,
      };
    }
    return {
      title: "Ücretsiz plan",
      description: subscription.trial_used
        ? "Deneme süresi daha önce kullanıldı."
        : "Premium özellikleri denemek için deneme başlatabilirsiniz.",
      icon: <CreditCard className="text-slate-500" />,
    };
  }

  const status = getStatusContent();

  /* ================================
     RENDER
  ================================ */

  return (
    <div className="space-y-12 max-w-7xl">
      {/* HEADER */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          Plan & Faturalama
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Planınızı yönetin, deneme sürecini başlatın veya
          premium pakete geçin.
        </p>
      </div>

      {/* TRIAL BANNER */}
      {subscription.plan === "trial" &&
        subscription.expires_at && (
          <TrialBanner
            expiresAt={subscription.expires_at}
          />
      )}
      {/* STATUS */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-muted/40 px-5 py-4">
        <div className="flex items-center gap-3">
          {status.icon}
          <div>
            <p className="text-sm font-medium">
              {status.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {status.description}
            </p>
          </div>
        </div>

        {canStartTrial && (
          <button
            onClick={handleStartTrial}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            <Sparkles size={16} />
            {loading
              ? "Başlatılıyor…"
              : "7 Günlük Deneme Başlat"}
          </button>
        )}
      </div>

      {/* PLANS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PlanCard
          title="Free"
          price="₺0"
          features={[
            "Temel denetimler",
            "Görev takibi",
            "Mobil erişim",
          ]}
        />

        <PlanCard
          title="Deneme (7 Gün)"
          price="Ücretsiz"
          highlighted
          features={[
            "Tüm premium özellikler",
            "DÖF Raporlama Sistemi",
            "Dosya arşivleme",
            "2FA güvenlik",
            "Yapay zeka destekli analiz",
          ]}
          action={
            canStartTrial ? (
              <button
                onClick={handleStartTrial}
                disabled={loading}
                className="w-full mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                Denemeyi Başlat
              </button>
            ) : null
          }
        />

        <PlanCard
          title="Premium"
          price="Teklif Al"
          features={[
            "Sınırsız denetim",
            "Tüm entegrasyonlar",
            "Öncelikli destek",
            "Kurumsal raporlama",
          ]}
          action={
            isAdmin && !isPremium ? (
              <button className="w-full mt-4 rounded-xl border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition">
                Satış Ekibiyle İletişime Geç
              </button>
            ) : null
          }
        />
      </div>

      <PlanComparison />
    </div>
  );
}
