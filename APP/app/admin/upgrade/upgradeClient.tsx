"use client";

import { Crown, Lock, ArrowRight, CheckCircle2 } from "lucide-react";

export default function UpgradeClient({
  isPremium,
  role,
  orgName,
}: {
  isPremium: boolean;
  role: string | null;
  orgName: string;
}) {
  const isAdmin = role?.toLowerCase() === "admin";

  if (isPremium) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-3xl border border-slate-200 bg-white/80 backdrop-blur p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-3">
            <Crown className="text-yellow-500" />
            <h1 className="text-2xl font-semibold text-slate-900">
              Premium Aktif
            </h1>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            {orgName} organizasyonu Premium plan kullanıyor. Ek bir işlem yapmanıza gerek yok.
          </p>

          <div className="mt-6 flex items-center gap-2 text-emerald-700">
            <CheckCircle2 size={18} />
            <span className="text-sm font-medium">Tüm premium özellikler açık.</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-3xl border border-slate-200 bg-white/80 backdrop-blur p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-3">
            <Lock className="text-slate-500" />
            <h1 className="text-2xl font-semibold text-slate-900">
              Yükseltme Yetkisi Gerekli
            </h1>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Premium’a yükseltme işlemini yalnızca <strong>Admin</strong> rolündeki kullanıcı başlatabilir.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Lütfen yöneticinizle iletişime geçin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-white/80 backdrop-blur p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-3">
          <Crown className="text-yellow-500" />
          <h1 className="text-2xl font-semibold text-slate-900">
            Premium’a Yükselt
          </h1>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          {orgName} için Premium planı etkinleştirerek entegrasyonlar, gelişmiş raporlama ve kurumsal modülleri açın.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlanCard
          title="Free"
          price="₺0"
          features={[
            "Denetim & görev yönetimi",
            "Temel raporlar",
            "Operatör akışı",
          ]}
          muted
        />

        <PlanCard
          title="Premium"
          price="₺— / ay"
          features={[
            "İBYS entegrasyonu",
            "e-Reçete (yakında)",
            "Gelişmiş raporlar",
            "API / Webhook",
            "Öncelikli destek",
          ]}
          highlight
          action={
            <a
              href="/api/billing/checkout"
              className="
                inline-flex items-center justify-center gap-2
                w-full
                px-5 py-3 rounded-2xl
                bg-indigo-600 text-white
                text-sm font-medium
                hover:bg-indigo-700
                transition
              "
            >
              Ödemeye Geç
              <ArrowRight size={16} />
            </a>
          }
        />
      </div>

      <div className="text-xs text-slate-500">
        Not: Bu akış şu an “mock checkout” ile çalışacak. Stripe/iyzico entegrasyonu bir sonraki adımda eklenecek.
      </div>
    </div>
  );
}

function PlanCard({
  title,
  price,
  features,
  action,
  highlight,
  muted,
}: {
  title: string;
  price: string;
  features: string[];
  action?: React.ReactNode;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`
        rounded-3xl border p-7 space-y-5
        ${highlight ? "border-indigo-300 bg-indigo-50/50" : "border-slate-200 bg-white/70"}
        ${muted ? "opacity-95" : ""}
      `}
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <div className="mt-1 text-2xl font-bold text-slate-900">{price}</div>
      </div>

      <ul className="space-y-2">
        {features.map((f) => (
          <li key={f} className="text-sm text-slate-700 flex items-start gap-2">
            <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-slate-400" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
