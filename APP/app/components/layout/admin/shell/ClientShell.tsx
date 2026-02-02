// APP/app/components/layout/admin/shell/ClientShell.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

// Providers
import { EffectsProvider } from "../effects/EffectsProvider";
import { ThemeProvider } from "../theme/ThemeProvider";
import { SettingsProvider } from "../settings/useSettings";
import { NotificationProvider } from "../notifications/NotificationProvider";
import { CommandPaletteProvider } from "../command-palette/CommandPaletteProvider";

// Components
import SettingsModal from "../settings/SettingsModal";
import Sidebar from "../navigation/SidebarWrapper";
import Topbar from "../topbar/Topbar";
import CommandPalette from "../command-palette/CommandPalette";

/* ===========================
   DESKTOP DETECTION (SSR SAFE)
=========================== */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = () => setIsDesktop(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isDesktop;
}

export default function ClientShell({
  children,
  userId,
  orgId,
}: {
  children: React.ReactNode;
  userId: string;
  orgId: string;
}) {
  const isDesktop = useIsDesktop();

  /* ===========================
     STATE
  =========================== */
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const sidebarWidth = useMemo(
    () => (expanded ? 260 : 88),
    [expanded]
  );

  /* ===========================
     ESC → MOBİL SIDEBAR KAPAT
  =========================== */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ===========================
     BODY SCROLL LOCK
  =========================== */
  useEffect(() => {
    const prev = document.body.style.overflow;

    if (!isDesktop && mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = prev || "";
    }

    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [mobileOpen, isDesktop]);

  return (
    <SettingsProvider>
      <ThemeProvider>
        <EffectsProvider>
          {/* 🔔 GERÇEK BİLDİRİM BAĞLANTISI */}
          <NotificationProvider userId={userId} orgId={orgId}>
            <CommandPaletteProvider
              openSettings={() => setSettingsOpen(true)}
              openNotifications={() => {}}
              logout={() => {}}
            >
              <SettingsModal
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
              />

              {/* ================= ROOT ================= */}
              <div className="relative min-h-screen bg-background text-foreground">
                {!isDesktop && mobileOpen && (
                  <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                  />
                )}

                {/* ================= SIDEBAR ================= */}
                <aside
                  className={`
                    fixed top-0 left-0 z-50 h-dvh
                    bg-white/90 backdrop-blur-xl
                    border-r border-border
                    transition-transform duration-300
                    ${isDesktop
                      ? "translate-x-0"
                      : mobileOpen
                      ? "translate-x-0"
                      : "-translate-x-full"}
                  `}
                  style={{
                    width: isDesktop ? sidebarWidth : "80vw",
                    maxWidth: 320,
                  }}
                  onMouseEnter={() => isDesktop && setExpanded(true)}
                  onMouseLeave={() => isDesktop && setExpanded(false)}
                >
                  <Sidebar
                    expanded={isDesktop ? expanded : true}
                    closeMobile={() => setMobileOpen(false)}
                  />
                </aside>

                {/* ================= CONTENT ================= */}
                <div
                  className="min-h-screen transition-all"
                  style={{ marginLeft: isDesktop ? sidebarWidth : 0 }}
                >
                  <Topbar
                    toggleSidebar={() =>
                      isDesktop
                        ? setExpanded((v) => !v)
                        : setMobileOpen(true)
                    }
                    openSettings={() => setSettingsOpen(true)}
                  />

                  <CommandPalette />

                  <main className="mx-auto w-full max-w-7xl px-4 py-6">
                    {children}
                  </main>
                </div>
              </div>
            </CommandPaletteProvider>
          </NotificationProvider>
        </EffectsProvider>
      </ThemeProvider>
    </SettingsProvider>
  );
}
