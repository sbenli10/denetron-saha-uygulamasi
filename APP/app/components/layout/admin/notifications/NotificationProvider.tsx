"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase/client";

/* ================= TYPES ================= */

export type NotificationItem = {
  id: number;
  org_id: string | null;
  user_id: string | null;
  title: string;
  message: string | null;
  created_at: string;
  read: boolean;
};

type Ctx = {
  notifications: NotificationItem[];
  unread: number;

  /* 🔔 Panel State (GLOBAL) */
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;

  /* 🔹 Actions */
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
};

const NotificationContext = createContext<Ctx | null>(null);

/* ================= PROVIDER ================= */

export function NotificationProvider({
  children,
  userId,
  orgId,
}: {
  children: React.ReactNode;
  userId: string;
  orgId: string;
}) {
  const supabase = supabaseClient();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const unread = notifications.filter((n) => !n.read).length;

  /* ================= PANEL CONTROLS ================= */

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((v) => !v);

  /* ================= 1) INITIAL LOAD ================= */

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) setNotifications(data);
    }

    load();
  }, [orgId]);

  /* ================= 2) REALTIME ================= */

  useEffect(() => {
    const channel = supabase
      .channel("org-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const n = payload.new as NotificationItem;

          if (n.org_id !== orgId) return;

          setNotifications((prev) => [n, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId]);

  /* ================= 3) ACTIONS ================= */

  const markAsRead = async (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("org_id", orgId)
      .eq("read", false);
  };

  /* ================= PROVIDER ================= */

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unread,
        isOpen,
        open,
        close,
        toggle,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

/* ================= HOOK ================= */

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used inside NotificationProvider");
  }
  return ctx;
}
