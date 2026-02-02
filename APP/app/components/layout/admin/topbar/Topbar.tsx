//APP\app\components\layout\admin\topbar\Topbar.tsx
"use client";

import { Menu } from "lucide-react";
import SettingsButton from "../settings/SettingsButton";
import ProfileMenu from "./ProfileMenu";
import NotificationBell from "../notifications/NotificationBell";
import { usePremium } from "@/app/hooks/usePremium";
import { useAppContext } from "@/app/components/providers/AppProvider";
import { applyRipple } from "@/app/components/ui/ripple";

export default function Topbar({
  toggleSidebar,
  openSettings,
}: {
  toggleSidebar: () => void;
  openSettings: () => void;
}) {
  const ctx = useAppContext();
  const { isPremium } = usePremium();

  const userInfo = {
    name: ctx?.profile?.full_name ?? undefined,
    email: ctx?.user?.email ?? undefined,
    role: ctx?.member?.role ?? undefined,
    isPremium,
  };

  const panelTitle = isPremium
    ? "Denetron Premium Yönetici Paneli"
    : "Denetron Yönetim Paneli";

  return (
    <header
      className="
        sticky top-0 z-50
        backdrop-blur-2xl
        bg-[rgba(255,255,255,0.68)]
        border-b border-white/60
        shadow-[0_4px_18px_rgba(99,102,241,0.12)]
        transition-all
      "
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* ============================
            LEFT SIDE
        ============================ */}
        <div className="flex items-center gap-3">

          {/* Mobile Menu Button */}
          <button
            onClick={(e) => {
              applyRipple(e, e.currentTarget);
              toggleSidebar();
            }}
            aria-label="Menüyü Aç/Kapat"
            className="
              lg:hidden inline-flex h-10 w-10 items-center justify-center
              rounded-xl border border-border/60
              bg-white/60 backdrop-blur-md
              hover:bg-indigo-50 transition
              shadow-sm
            "
          >
            <Menu size={20} className="text-foreground" />
          </button>

          {/* Branding */}
          <div className="hidden sm:flex flex-col leading-tight fade-in">
            <div className="text-sm font-semibold tracking-wide text-foreground">
              Denetron
            </div>
            <div className="text-xs text-muted-foreground">{panelTitle}</div>
          </div>

          <div className="sm:hidden text-sm font-semibold text-foreground/90">
            Denetron
          </div>
        </div>

        {/* ============================
            RIGHT SIDE
        ============================ */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Settings + Notifications */}
          <div className="flex items-center gap-1 sm:gap-2">

            {/* Settings Button */}
            <div
              onMouseDown={(e) => applyRipple(e as any, e.currentTarget)}
              className="rounded-xl overflow-hidden"
            >
              <SettingsButton onClick={openSettings} />
            </div>

            <div className="rounded-xl overflow-visible">
              <NotificationBell />
            </div>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-border/60 mx-1 sm:mx-2" />

          {/* Profile Menu */}
          <ProfileMenu user={userInfo} />
        </div>
      </div>
    </header>
  );
}
