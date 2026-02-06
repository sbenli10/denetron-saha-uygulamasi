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

  /* 🔒 LOADING GUARD */
  if (ctx.loading) {
    return (
      <header className="h-16 bg-white/60 backdrop-blur-xl border-b animate-pulse" />
    );
  }

  const userInfo = {
    name: ctx.profile?.full_name ?? undefined,
    email: ctx.user?.email ?? undefined,
    role: ctx.member?.role ?? undefined,
    isPremium,
  };

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">

        {/* LEFT */}
        <button
          onClick={(e) => {
            applyRipple(e, e.currentTarget);
            toggleSidebar();
          }}
          className="lg:hidden h-10 w-10 rounded-xl border bg-white"
        >
          <Menu size={20} />
        </button>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          <SettingsButton onClick={openSettings} />
          <NotificationBell />
          <ProfileMenu user={userInfo} />
        </div>
      </div>
    </header>
  );
}
