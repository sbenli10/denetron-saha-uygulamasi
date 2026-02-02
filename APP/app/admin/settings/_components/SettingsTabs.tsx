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

/* TAB TYPES */
export type SettingsTabKey =
  | "general"
  | "security"
  | "billing"
  | "integrations";

interface SettingsTabsProps {
  isPremium: boolean;
}

/* TAB CONFIG */
const TABS: {
  key: SettingsTabKey;
  label: string;
  icon: any;
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

export default function SettingsTabs({
  isPremium,
}: SettingsTabsProps) {
  const searchParams = useSearchParams();
  const activeTab =
    (searchParams.get("tab") as SettingsTabKey) ?? "general";

  return (
    <div
      className="
        flex gap-2 overflow-x-auto
        rounded-2xl border border-border
        bg-background/40
        p-2
      "
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        const locked = tab.premium && !isPremium;

        return (
          <Link
            key={tab.key}
            href={`/admin/settings?tab=${tab.key}`}
            className={cn(
              `
              relative flex items-center gap-2
              px-4 py-2 rounded-xl
              text-sm font-medium
              transition-all whitespace-nowrap
              `,
              isActive
                ? "bg-primary text-primary-foreground shadow"
                : "text-foreground/70 hover:bg-accent",
              locked && "opacity-60"
            )}
          >
            <tab.icon size={16} />

            <span>{tab.label}</span>

            {/* PREMIUM LOCK */}
            {locked && (
              <span
                className="
                  ml-1 flex items-center gap-1
                  text-[10px]
                  text-amber-500
                "
              >
                <Lock size={12} />
                Premium
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
