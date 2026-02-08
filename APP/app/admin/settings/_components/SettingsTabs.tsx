"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Settings,
  Shield,
  CreditCard,
  Plug,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ================================
   TYPES
================================ */
export type SettingsTabKey =
  | "general"
  | "security"
  | "billing"
  | "integrations";

interface SettingsTabsProps {
  isPremium: boolean;
}

/* ================================
   CONFIG
================================ */
const TABS: {
  key: SettingsTabKey;
  label: string;
  icon: React.ElementType;
  premium?: boolean;
}[] = [
  {
    key: "general",
    label: "Genel",
    icon: Settings,
  },
  {
    key: "security",
    label: "Güvenlik",
    icon: Shield,
  },
  {
    key: "billing",
    label: "Faturalama",
    icon: CreditCard,
    premium: true,
  },
  {
    key: "integrations",
    label: "Entegrasyonlar",
    icon: Plug,
    premium: true,
  },
];

/* ================================
   COMPONENT
================================ */
export default function SettingsTabs({
  isPremium,
}: SettingsTabsProps) {
  const searchParams = useSearchParams();
  const activeTab =
    (searchParams.get("tab") as SettingsTabKey) ?? "general";

  return (
    <nav
      aria-label="Ayar sekmeleri"
      className="
        flex gap-1 overflow-x-auto
        rounded-2xl border border-border
        bg-muted/30 p-1
      "
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        const locked = tab.premium && !isPremium;
        const Icon = tab.icon;

        return (
          <Link
            key={tab.key}
            href={`/admin/settings?tab=${tab.key}`}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-2",
              "rounded-xl px-4 py-2 text-sm font-medium",
              "transition-all whitespace-nowrap",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/60",
              locked && "opacity-60"
            )}
          >
            <Icon size={16} />

            <span>{tab.label}</span>

            {/* PREMIUM LOCK */}
            {locked && (
              <span
                className="
                  ml-1 inline-flex items-center gap-1
                  rounded-full border border-amber-300/40
                  bg-amber-100/40
                  px-2 py-0.5
                  text-[10px] font-semibold
                  text-amber-700
                "
              >
                <Lock size={10} />
                Premium
              </span>
            )}

            {/* Active indicator */}
            {isActive && (
              <span
                aria-hidden
                className="
                  absolute inset-x-2 -bottom-1
                  h-0.5 rounded-full
                  bg-primary
                "
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
