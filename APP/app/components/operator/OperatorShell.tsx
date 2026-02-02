"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  CheckSquare,
  History,
  User,
  WifiOff,
  Brain,
  X,
  QrCode,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import {
  getOfflineQueueCount,
  clearOfflineQueue,
} from "@/lib/offlineQueue";

/* -------------------- TYPES -------------------- */

type OperatorUser = {
  id: string;
  name?: string | null;
  email?: string | null;
};

type OperatorOrg = {
  id: string;
  name: string;
};

interface OperatorShellProps {
  user: OperatorUser;
  org: OperatorOrg;
  children: React.ReactNode;
}

/* -------------------- NAV -------------------- */

const NAV = [
  { href: "/operator", label: "Anasayfa", icon: ClipboardList },
  { href: "/operator/tasks", label: "Görevler", icon: ClipboardList },
  { href: "/operator/forms", label: "Formlar", icon: CheckSquare },
  { href: "/operator/history", label: "Geçmiş", icon: History },
  { href: "/operator/ai-analiz", label: "Yapay Zeka", icon: Brain },
];

function cx(...xs: (string | false | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

/* -------------------- COMPONENT -------------------- */

export default function OperatorShell({
  user,
  org,
  children,
}: OperatorShellProps) {
  const pathname = usePathname();
  const supabase = supabaseBrowser();
  const online = useOnlineStatus();

  const [openTasks, setOpenTasks] = useState(0);
  const [offlineCount, setOfflineCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showQuick, setShowQuick] = useState(false);

  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  /* -------------------- HAPTIC -------------------- */
  const haptic = (ms = 10) => navigator.vibrate?.(ms);

  /* -------------------- REALTIME TASK COUNT -------------------- */
  useEffect(() => {
    async function init() {
      const { count } = await supabase
        .from("assigned_tasks")
        .select("*", { count: "exact", head: true })
        .neq("status", "completed");

      setOpenTasks(count ?? 0);
    }

    init();

    const channel = supabase
      .channel("tasks-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assigned_tasks" },
        () => init()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  /* -------------------- OFFLINE QUEUE -------------------- */
  useEffect(() => {
    const update = () => setOfflineCount(getOfflineQueueCount());
    update();

    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, []);

  useEffect(() => {
    if (online && offlineCount > 0) {
      setSyncing(true);
      setTimeout(() => {
        clearOfflineQueue();
        setOfflineCount(0);
        setSyncing(false);
      }, 1500);
    }
  }, [online, offlineCount]);

  /* -------------------- LOGOUT -------------------- */
  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  /* -------------------- LONG PRESS -------------------- */
  function onPressStart() {
    pressTimer.current = setTimeout(() => {
      haptic(20);
      setShowQuick(true);
    }, 500);
  }

  function onPressEnd() {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  }

  /* ==================== RENDER ==================== */

  return (
    <div className="relative flex min-h-screen bg-[#020617] text-neutral-100">
      {/* ==================== DESKTOP SIDEBAR ==================== */}
      <aside className="hidden md:flex md:fixed md:inset-y-0 md:w-64 md:flex-col md:border-r md:border-white/10 bg-black/80 backdrop-blur z-30">
        <div className="h-14 flex items-center px-4 border-b border-white/10 font-semibold">
          {org.name}
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-neutral-400 hover:bg-white/5"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ==================== MAIN WRAPPER ==================== */}
      <div className="flex flex-1 flex-col md:ml-64">
        {/* ==================== HEADER ==================== */}
        <header className="sticky top-0 z-20 bg-black/80 backdrop-blur border-b border-white/10">
          <div className="mx-auto flex h-14 max-w-md md:max-w-none items-center justify-between px-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{org.name}</div>
              <div className="text-[10px] uppercase tracking-widest text-primary/70">
                Operatör Paneli
              </div>
            </div>

            <button
              onClick={() => {
                haptic();
                setShowProfile(true);
              }}
              className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center"
            >
              <User className="h-4 w-4 text-primary" />
            </button>
          </div>

          {(!online || syncing) && (
            <div className="flex items-center justify-center gap-2 py-1 text-[11px] bg-amber-500/15 text-amber-200">
              {!online ? (
                <>
                  <WifiOff className="h-3.5 w-3.5" />
                  Çevrimdışı – {offlineCount} kayıt sırada
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Senkronize ediliyor…
                </>
              )}
            </div>
          )}
        </header>

        {/* ==================== CONTENT ==================== */}
        <main className="mx-auto w-full max-w-md md:max-w-none flex-1 overflow-y-auto px-3 pt-4 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* ==================== MOBILE BOTTOM NAV ==================== */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-black/90 backdrop-blur border-t border-white/10 md:hidden">
        <div className="mx-auto flex max-w-md justify-around px-4 py-2">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => haptic()}
                onMouseDown={
                  item.href === "/operator/tasks" ? onPressStart : undefined
                }
                onMouseUp={onPressEnd}
                onTouchStart={
                  item.href === "/operator/tasks" ? onPressStart : undefined
                }
                onTouchEnd={onPressEnd}
                className={cx(
                  "relative flex flex-col items-center gap-1 px-3 py-2 text-[11px]",
                  active ? "text-primary" : "text-neutral-400"
                )}
              >
                <div
                  className={cx(
                    "h-12 w-12 rounded-2xl border flex items-center justify-center",
                    active
                      ? "border-primary/50 bg-primary/15"
                      : "border-white/10"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>

                {item.href === "/operator/tasks" && openTasks > 0 && (
                  <span className="absolute top-1 right-3 min-w-[18px] rounded-full bg-danger px-1.5 text-[10px] text-white">
                    {openTasks}
                  </span>
                )}

                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ==================== QUICK ACTIONS ==================== */}
      {showQuick && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end">
          <div className="w-full rounded-t-2xl bg-bg800 p-5">
            <button
              onClick={() => setShowQuick(false)}
              className="absolute right-4 top-4"
            >
              <X className="h-5 w-5 text-white/60" />
            </button>

            <Link
              href="/operator/start"
              className="flex h-12 items-center gap-3 rounded-xl bg-primary text-black px-4"
            >
              <Plus className="h-4 w-4" />
              Yeni Denetim
            </Link>

            <Link
              href="/operator/scan"
              className="mt-3 flex h-12 items-center gap-3 rounded-xl bg-bg700 text-white px-4"
            >
              <QrCode className="h-4 w-4" />
              QR ile Başla
            </Link>
          </div>
        </div>
      )}

      {/* ==================== PROFILE ==================== */}
      {showProfile && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-end"
          onClick={() => setShowProfile(false)}
        >
          <div
            className="w-full rounded-t-2xl bg-bg800 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3">
              <div className="text-sm font-semibold text-white">
                {user.name ?? "Operatör"}
              </div>
              <div className="text-xs text-neutral-400">{user.email}</div>
            </div>

            <button
              onClick={handleLogout}
              className="mt-4 w-full rounded-xl bg-danger py-3 text-white"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
