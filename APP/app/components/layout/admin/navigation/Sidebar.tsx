"use client";

import { useMemo } from "react";
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
  expanded: boolean;
  closeMobile: () => void;
}) {
  const ctx = useAppContext();
  const { isPremium } = usePremium();

  /* ==================================================
    🔒 LOADING GUARD
    ================================================== */
  if (ctx.loading) {
    return (
      <div className="h-full w-full bg-white/95 border-r animate-pulse" />
    );
  }

  /* ==================================================
    👤 USER (ROLE SAFE + ADMIN ONLY)
    ================================================== */
  type AdminRole = "admin" | "manager";

  const user = useMemo<{
    name: string;
    email: string;
    role: AdminRole;
  } | null>(() => {
    if (!ctx.user || !ctx.profile || !ctx.member) return null;

    const role = ctx.member.role;

    // 🔐 Sidebar sadece admin/manager içindir
    if (role !== "admin" && role !== "manager") {
      return null;
    }

    return {
      name: ctx.profile.full_name ?? ctx.user.email ?? "Kullanıcı",
      email: ctx.user.email ?? "",
      role, // artık TS kesin olarak "admin" | "manager"
    };
  }, [ctx.user, ctx.profile, ctx.member]);

  /* ==================================================
    🏢 ORGANIZATION
    ================================================== */
  const org = useMemo<{
    name: string;
    logo: string | null;
    isPremium?: boolean;
  } | null>(() => {
    if (!ctx.organization) return null;

    return {
      name: ctx.organization.name,
      logo: ctx.orgSettings?.logo_url ?? null,
      isPremium: ctx.organization.is_premium,
    };
  }, [ctx.organization, ctx.orgSettings]);

  /* ==================================================
    📂 NAV FILTER (TS %100 SAFE)
    ================================================== */
  const filteredNavItems = useMemo<SidebarNavItem[]>(() => {
    if (!user) return [];

    return NAV_ITEMS
      .filter(
        (item) =>
          item.roles.includes(user.role) &&
          (!item.premium || isPremium)
      )
      .map((item) => {
        if (!item.children) return item;

        const children = item.children.filter(
          (child) => !child.premium || isPremium
        );

        return { ...item, children };
      })
      .filter(
        (item) => !item.children || item.children.length > 0
      );
  }, [user, isPremium]);


  return (
    <div className="h-full w-full flex flex-col bg-white/95 backdrop-blur-xl border-r">
      {/* HEADER */}
      <div className="h-16 px-4 flex items-center border-b font-semibold">
        Denetron
      </div>

      {/* ORG */}
      {org && (
        <div className="p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white p-3 border">
            <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center overflow-hidden">
              {org.logo ? (
                <img src={org.logo} alt={org.name} className="h-full w-full object-cover" />
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

      {/* NAV */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-1">
        {filteredNavItems.map((item) =>
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

      <div className="border-t p-3">
        <SidebarCollapse expanded={expanded} />
      </div>
    </div>
  );
}
