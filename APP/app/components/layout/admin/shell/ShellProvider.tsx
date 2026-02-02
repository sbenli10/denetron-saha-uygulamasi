//APP\app\components\layout\admin\shell\ShellProvider.tsx
"use client";

import { useState, useCallback, useMemo } from "react";
import { ShellContext } from "./ShellContext";

export default function ShellProvider({ children }: { children: React.ReactNode }) {
  /** Sidebar state */
  const [sidebarOpen, setSidebarOpen] = useState(false);         // mobile slide-in
  const [sidebarExpanded, setSidebarExpanded] = useState(true);   // click-expand model

  /** Shell modals */
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  /** Toggle functions */
  const toggleSidebar = useCallback(() => setSidebarOpen(v => !v), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const toggleExpand = useCallback(() => setSidebarExpanded(v => !v), []);

  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  const openNotifications = useCallback(() => setNotificationsOpen(true), []);
  const closeNotifications = useCallback(() => setNotificationsOpen(false), []);

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

 const ctx = useMemo(
  () => ({
    sidebarOpen,
    sidebarExpanded,
    settingsOpen,
    notificationsOpen,
    paletteOpen,

    toggleSidebar,
    closeSidebar,
    toggleExpand,

    openSettings,
    closeSettings,
    openNotifications,
    closeNotifications,
    openPalette,
    closePalette,
  }),
  [
    sidebarOpen,
    sidebarExpanded,
    settingsOpen,
    notificationsOpen,
    paletteOpen,
    toggleSidebar,
    closeSidebar,
    toggleExpand,
    openSettings,
    closeSettings,
    openNotifications,
    closeNotifications,
    openPalette,
    closePalette,
  ]
);


  return <ShellContext.Provider value={ctx}>{children}</ShellContext.Provider>;
}
