"use client";

import { Check, X, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

/* ================================
   TYPES
================================ */

type FeatureKey =
  | "inspections"
  | "mobile"
  | "reports"
  | "ai"
  | "integrations"
  | "roles"
  | "audit"
  | "support";

type PlanKey = "free" | "trial" | "premium";

type PlanValues = Record<FeatureKey, boolean | string>;

/* ================================
   DATA
================================ */

const FEATURES: { key: FeatureKey; label: string }[] = [
  { key: "inspections", label: "Denetim Oluşturma" },
  { key: "mobile", label: "Mobil Uygulama" },
  { key: "reports", label: "Raporlama" },
  { key: "ai", label: "AI Risk Analizi" },
  { key: "integrations", label: "IBYS / e-Reçete Entegrasyonu" },
  { key: "roles", label: "Rol & Yetkilendirme" },
  { key: "audit", label: "Audit Logları" },
  { key: "support", label: "Destek Seviyesi" },
];

const PLANS: Record<
  PlanKey,
  {
    title: string;
    values: PlanValues;
  }
> = {
  free: {
    title: "Free",
    values: {
      inspections: true,
      mobile: true,
      reports: "Sınırlı",
      ai: false,
      integrations: false,
      roles: false,
      audit: false,
      support: "Topluluk",
    },
  },

  trial: {
    title: "Trial",
    values: {
      inspections: true,
      mobile: true,
      reports: "Sınırsız",
      ai: true,
      integrations: true,
      roles: true,
      audit: true,
      support: "Standart",
    },
  },

  premium: {
    title: "Premium",
    values: {
      inspections: true,
      mobile: true,
      reports: "Sınırsız",
      ai: true,
      integrations: true,
      roles: true,
      audit: true,
      support: "Öncelikli",
    },
  },
};

/* ================================
   COMPONENT
================================ */

export default function PlanComparison() {
  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">
          Plan Karşılaştırması
        </h3>
        <p className="text-sm text-slate-600 mt-1">
          Hangi planın size uygun olduğunu karşılaştırın.
        </p>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-xl">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-6 py-4">Özellik</th>
              <th className="px-6 py-4">Free</th>
              <th className="px-6 py-4">
                <div className="flex items-center justify-center gap-1">
                  <Crown size={14} className="text-indigo-500" />
                  Trial
                </div>
              </th>
              <th className="px-6 py-4">Premium</th>
            </tr>
          </thead>

          <tbody>
            {FEATURES.map((feature) => (
              <tr
                key={feature.key}
                className="border-t border-slate-200"
              >
                <td className="px-6 py-4 text-slate-700">
                  {feature.label}
                </td>

                {(Object.keys(PLANS) as PlanKey[]).map(
                  (plan) => (
                    <td
                      key={plan}
                      className="px-6 py-4 text-center"
                    >
                      {renderValue(
                        PLANS[plan].values[feature.key]
                      )}
                    </td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-6">
        {(Object.keys(PLANS) as PlanKey[]).map((plan) => (
          <div
            key={plan}
            className={cn(
              "rounded-2xl border p-5 bg-white/80 backdrop-blur-xl",
              plan === "trial" &&
                "border-indigo-400 shadow-[0_0_0_2px_rgba(99,102,241,0.15)]"
            )}
          >
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              {plan === "trial" && (
                <Crown size={16} className="text-indigo-500" />
              )}
              {PLANS[plan].title}
            </h4>

            <ul className="space-y-2 text-sm">
              {FEATURES.map((feature) => (
                <li
                  key={feature.key}
                  className="flex items-center justify-between"
                >
                  <span className="text-slate-600">
                    {feature.label}
                  </span>
                  {renderValue(
                    PLANS[plan].values[feature.key]
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================
   VALUE RENDERER
================================ */

function renderValue(value: boolean | string) {
  if (value === true) {
    return <Check className="text-emerald-500" size={16} />;
  }

  if (value === false) {
    return <X className="text-slate-300" size={16} />;
  }

  return (
    <span className="text-xs font-medium text-slate-700">
      {value}
    </span>
  );
}
