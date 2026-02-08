"use client";

import { Check, X, Crown, Sparkles } from "lucide-react";
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
    badge?: string;
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
    badge: "Önerilen",
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
    badge: "En Güçlü",
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
    <div className="space-y-10">
      {/* Header */}
      <div className="max-w-2xl">
        <h3 className="text-xl font-semibold tracking-tight">
          Plan Karşılaştırması
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Özellikleri karşılaştırarak işletmeniz için en uygun planı seçin.
        </p>
      </div>

      {/* ================= Desktop Table ================= */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-6 py-4 font-medium">
                Özellikler
              </th>

              {(Object.keys(PLANS) as PlanKey[]).map((plan) => (
                <th key={plan} className="px-6 py-4 text-center">
                  <PlanHeader plan={plan} />
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {FEATURES.map((feature, i) => (
              <tr
                key={feature.key}
                className={cn(
                  "border-t border-border",
                  i % 2 === 0 && "bg-muted/20"
                )}
              >
                <td className="px-6 py-4 text-muted-foreground">
                  {feature.label}
                </td>

                {(Object.keys(PLANS) as PlanKey[]).map((plan) => (
                  <td key={plan} className="px-6 py-4 text-center">
                    {renderValue(
                      PLANS[plan].values[feature.key],
                      plan
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= Mobile Cards ================= */}
      <div className="md:hidden space-y-6">
        {(Object.keys(PLANS) as PlanKey[]).map((plan) => (
          <div
            key={plan}
            className={cn(
              "rounded-2xl border border-border bg-background p-5",
              plan === "trial" &&
                "ring-2 ring-indigo-500/20 border-indigo-400"
            )}
          >
            <PlanHeader plan={plan} mobile />

            <ul className="mt-4 space-y-3 text-sm">
              {FEATURES.map((feature) => (
                <li
                  key={feature.key}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-muted-foreground">
                    {feature.label}
                  </span>
                  {renderValue(
                    PLANS[plan].values[feature.key],
                    plan
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
   SUB COMPONENTS
================================ */

function PlanHeader({
  plan,
  mobile = false,
}: {
  plan: PlanKey;
  mobile?: boolean;
}) {
  const data = PLANS[plan];

  return (
    <div
      className={cn(
        "flex min-h-[48px] flex-col items-center justify-center gap-1",
        mobile && "items-start"
      )}
    >
      <div className="flex items-center gap-1.5 font-semibold">
        {plan === "trial" && (
          <Sparkles size={14} className="text-indigo-500" />
        )}
        {plan === "premium" && (
          <Crown size={14} className="text-amber-500" />
        )}
        {data.title}
      </div>

      {data.badge && (
        <span
          className="
            rounded-full bg-indigo-500/10
            px-2 py-0.5 text-[11px]
            font-medium text-indigo-600
          "
        >
          {data.badge}
        </span>
      )}
    </div>
  );
}

function renderValue(
  value: boolean | string,
  plan: PlanKey
) {
  return (
    <div className="flex h-6 items-center justify-center">
      {value === true && (
        <Check
          size={16}
          className={cn(
            plan === "premium"
              ? "text-amber-500"
              : plan === "trial"
              ? "text-indigo-500"
              : "text-emerald-500"
          )}
        />
      )}

      {value === false && (
        <X
          size={16}
          className="text-muted-foreground/40"
        />
      )}

      {typeof value === "string" && (
        <span className="text-xs font-medium text-foreground">
          {value}
        </span>
      )}
    </div>
  );
}
