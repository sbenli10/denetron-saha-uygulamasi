//APP\app\components\layout\admin\navigation\Sidebar.tsx
"use client";

import { X } from "lucide-react";

import SidebarItem from "./SidebarItem";
import SidebarSection from "./SidebarSection";
import SidebarCollapse from "./SidebarCollapse";
import DenetronPremiumBadge from "@/app/components/premium/DenetronPremiumBadge";
import { useAppContext } from "@/app/components/providers/AppProvider";
import { usePremium } from "@/app/hooks/usePremium";
import { NAV_ITEMS, SidebarNavItem } from "./nav-config";

export default function Sidebar({
  expanded,
  closeMobile,
}: {
  expanded: boolean;       // desktop collapse
  closeMobile: () => void; // mobil kapatma
}) {
  const ctx = useAppContext();
  const { isPremium } = usePremium();

  const user = ctx?.profile
    ? {
        name: ctx.profile.full_name ?? ctx.user.email ?? "Kullanıcı",
        email: ctx.user.email ?? "",
        role: ctx.member?.role,
      }
    : null;

  const org = ctx?.organization
    ? {
        name: ctx.organization.name,
        logo: ctx.orgSettings?.logo_url ?? null,
        isPremium: ctx.organization.is_premium,
      }
    : null;

  const filtered: SidebarNavItem[] = NAV_ITEMS.filter(
    (item) =>
      item.roles.includes(user?.role ?? "") &&
      (!item.premium || isPremium)
  );

  return (
    <div className="h-full w-full flex flex-col bg-white/95 backdrop-blur-xl border-r border-border">
      {/* ================= HEADER ================= */}
      <div className="h-16 px-4 flex items-center justify-between border-b">
        <div className="font-semibold truncate">Denetron</div>

        {/* ❗ SADECE MOBİL
        <button
          onClick={closeMobile}
          className="lg:hidden h-8 w-8 flex items-center justify-center rounded-lg border"
          aria-label="Menüyü kapat"
        >
          <X size={18} />
        </button> */}
      </div>

      {/* ================= ORGANIZATION ================= */}
      {org && (
        <div className="p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white p-3 border">
            <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center overflow-hidden">
              {org.logo ? (
                <img
                  src={org.logo}
                  alt={org.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="font-semibold">
                  {org.name[0]?.toUpperCase()}
                </span>
              )}
            </div>

            {expanded && (
              <div className="min-w-0">
                <div className="font-medium truncate">{org.name}</div>
                {org.isPremium && <DenetronPremiumBadge />}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= NAV ================= */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-1">
        {filtered.map((item) =>
          item.children ? (
            <SidebarSection
              key={item.label}
              item={item}
              expanded={expanded}
              closeMobile={closeMobile}
            />
          ) : (
            <SidebarItem
              key={item.label}
              item={item}
              expanded={expanded}
              closeMobile={closeMobile}
            />
          )
        )}
      </nav>

      {/* ================= FOOTER ================= */}
      <div className="border-t p-3">
        <SidebarCollapse expanded={expanded} />
      </div>
    </div>
  );
}
