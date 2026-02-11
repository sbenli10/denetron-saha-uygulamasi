"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  CheckSquare,
  History,
  User,
  WifiOff,
  Brain,
  Plus,
  RefreshCw,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { useEffect, useState,useRef } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { getOfflineQueueCount, clearOfflineQueue } from "@/lib/offlineQueue";
import { cn } from "@/app/components/ui/cn";
import { Badge, Button, Sheet } from "@/app/components/ui/ui";

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

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const NAV: NavItem[] = [
  { href: "/operator", label: "Anasayfa", icon: LayoutDashboard },
  { href: "/operator/tasks", label: "Görevler", icon: ClipboardList },
  { href: "/operator/forms", label: "Formlar", icon: CheckSquare },
  { href: "/operator/history", label: "Geçmiş", icon: History },
  { href: "/operator/ai-analiz", label: "Yapay Zeka", icon: Brain },
];

/* -------------------- COMPONENT -------------------- */

export default function OperatorShell({ user, org, children }: OperatorShellProps) {
  const pathname = usePathname();
  const supabase = supabaseBrowser();
  const online = useOnlineStatus();
  const [logoutState, setLogoutState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [toast, setToast] = useState<{ open: boolean; tone: "success" | "warning" | "danger"; text: string }>({
    open: false,
    tone: "warning",
    text: "",
  });
  const [openTasks, setOpenTasks] = useState<number>(0);
  const toastTimer = useRef<number | null>(null);
  const [offlineCount, setOfflineCount] = useState<number>(0);
  const [syncing, setSyncing] = useState<boolean>(false);

  const [showProfile, setShowProfile] = useState<boolean>(false);

  const haptic = (ms = 10) => navigator.vibrate?.(ms);

  /* -------------------- REALTIME TASK COUNT -------------------- */
  useEffect(() => {
    let mounted = true;

    async function init() {
      const { count } = await supabase
        .from("assigned_tasks")
        .select("*", { count: "exact", head: true })
        .eq("org_id", org.id)
        .eq("operator_id", user.id)
        .neq("status", "completed");

      if (mounted) setOpenTasks(count ?? 0);
    }

    init();

    const channel = supabase
      .channel("tasks-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "assigned_tasks" }, () => init())
      .subscribe();

    return () => {
      mounted = false;
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
      const t = window.setTimeout(() => {
        clearOfflineQueue();
        setOfflineCount(0);
        setSyncing(false);
      }, 1200);

      return () => window.clearTimeout(t);
    }
    return;
  }, [online, offlineCount]);

  function showToast(tone: "success" | "warning" | "danger", text: string) {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({ open: true, tone, text });
    toastTimer.current = window.setTimeout(() => {
      setToast((s) => ({ ...s, open: false }));
    }, 2200);
  }

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);


  async function handleLogout() {
    if (logoutState === "loading") return;

    setLogoutState("loading");
    showToast("warning", "Çıkış yapılıyor…");

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setLogoutState("success");
      showToast("success", "Çıkış yapıldı");

      // küçük bir gecikme: kullanıcı toast'ı görsün
      window.setTimeout(() => {
        window.location.href = "/login";
      }, 600);
    } catch (e) {
      console.error("logout error:", e);
      setLogoutState("error");
      showToast("danger", "Çıkış yapılamadı. Tekrar deneyin.");
    } finally {
      // başarısızsa tekrar tıklanabilsin
      window.setTimeout(() => setLogoutState("idle"), 900);
    }
  }


  const headerStatus = !online ? (
    <div className="flex items-center justify-center gap-2 py-2 text-[12px] bg-[color:color-mix(in_oklab,var(--op-warning)_18%,transparent)] text-[color:color-mix(in_oklab,var(--op-warning)_92%,white)] border-b border-[color:color-mix(in_oklab,var(--op-warning)_35%,transparent)]">
      <WifiOff className="h-4 w-4" />
      Çevrimdışı — {offlineCount} kayıt sırada
    </div>
  ) : syncing ? (
    <div className="flex items-center justify-center gap-2 py-2 text-[12px] bg-[color:color-mix(in_oklab,var(--op-primary)_15%,transparent)] text-[color:var(--op-text)] border-b border-[color:color-mix(in_oklab,var(--op-primary)_30%,transparent)]">
      <RefreshCw className="h-4 w-4 animate-spin" />
      Senkronize ediliyor…
    </div>
  ) : null;

  return (
    <div
      className="min-h-screen text-[color:var(--op-text)]"
      style={{ background: "radial-gradient(1200px 600px at 20% 0%, rgba(37,99,235,0.18), transparent 55%), radial-gradient(900px 500px at 80% 15%, rgba(245,158,11,0.10), transparent 60%), var(--op-bg)" }}
    >
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex md:fixed md:inset-y-0 md:w-72 md:flex-col md:border-r md:border-[color:var(--op-border)] bg-black/35 backdrop-blur-xl z-30">
        <div className="h-16 flex items-center px-5 border-b border-[color:var(--op-border)]">
          <div className="min-w-0">
            <div className="font-extrabold tracking-tight truncate">{org.name}</div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--op-muted)]">
              Operatör Paneli
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-[14px] font-semibold transition",
                  active
                    ? "bg-[color:color-mix(in_oklab,var(--op-primary)_16%,transparent)] border border-[color:color-mix(in_oklab,var(--op-primary)_35%,transparent)]"
                    : "text-[color:var(--op-muted)] hover:bg-white/5"
                )}
              >
                <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center border",
                  active
                    ? "border-[color:color-mix(in_oklab,var(--op-primary)_40%,transparent)] bg-black/20"
                    : "border-[color:var(--op-border)] bg-black/10"
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="truncate">{item.label}</span>

                {item.href === "/operator/tasks" && openTasks > 0 ? (
                  <span className="ml-auto rounded-full bg-[color:var(--op-danger)] px-2 py-0.5 text-[11px] font-extrabold text-white">
                    {openTasks}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[color:var(--op-border)]">
          <Button href="/operator/start" tone="primary" size="lg" leftIcon={Plus} className="w-full">
            Denetime Başla
          </Button>
          <button
            onClick={() => setShowProfile(true)}
            className="mt-3 w-full h-12 rounded-[var(--op-radius-2xl)] border border-[color:var(--op-border)] bg-white/5 flex items-center justify-between px-4"
          >
            <div className="min-w-0 text-left">
              <div className="text-[13px] font-semibold truncate">{user.name ?? "Operatör"}</div>
              <div className="text-[11px] text-[color:var(--op-muted)] truncate">{user.email ?? ""}</div>
            </div>
            <User className="h-5 w-5 text-[color:var(--op-primary-2)]" />
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="md:ml-72">
        {/* HEADER */}
        <header className="sticky top-0 z-20 bg-black/35 backdrop-blur-xl border-b border-[color:var(--op-border)]">
          <div className="mx-auto flex h-16 max-w-md md:max-w-none items-center justify-between px-4">
            <div className="min-w-0">
              <div className="text-[14px] font-extrabold truncate">{org.name}</div>
              <div className="flex items-center gap-2">
                <div className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--op-muted)]">
                  Operatör Paneli
                </div>
                {openTasks > 0 ? (
                  <Badge tone="warning" className="border-0">
                    {openTasks} açık görev
                  </Badge>
                ) : null}
              </div>
            </div>

            <button
              onClick={() => {
                haptic();
                setShowProfile(true);
              }}
              className="h-12 w-12 rounded-[var(--op-radius-2xl)] border border-[color:var(--op-border)] bg-white/5 flex items-center justify-center"
            >
              <User className="h-5 w-5 text-[color:var(--op-primary-2)]" />
            </button>
          </div>

          {headerStatus}
        </header>

        {/* CONTENT */}
        <main className="mx-auto w-full max-w-md md:max-w-none px-4 pt-5 pb-28 md:pb-8">
          {children}
        </main>
      </div>

      {/* MOBILE BOTTOM NAV + CENTER CTA */}
      <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden">
        <div className="mx-auto max-w-md">
          <div className="relative mx-3 mb-3 rounded-[28px] border border-[color:var(--op-border)] bg-black/55 backdrop-blur-xl shadow-[var(--op-shadow-2)]">
            <div className="grid grid-cols-5 items-center px-2 py-2">
              {renderMobileItem({ href: "/operator", label: "Ana", icon: LayoutDashboard }, pathname, haptic)}
              {renderMobileItem({ href: "/operator/tasks", label: "Görev", icon: ClipboardList }, pathname, haptic, openTasks)}
              <div className="flex items-center justify-center">
                <Link
                  href="/operator/start"
                  onClick={() => haptic(15)}
                  className="h-14 w-14 -mt-8 rounded-[22px] bg-[color:var(--op-primary)] text-black shadow-[var(--op-shadow-2)] flex items-center justify-center border border-[color:color-mix(in_oklab,var(--op-primary)_55%,black)]"
                >
                  <Plus className="h-7 w-7" />
                </Link>
              </div>
              {renderMobileItem({ href: "/operator/forms", label: "Form", icon: CheckSquare }, pathname, haptic)}
              {renderMobileItem({ href: "/operator/history", label: "Geçmiş", icon: History }, pathname, haptic)}
            </div>
          </div>
        </div>
      </nav>

      {/* PROFILE SHEET */}
      <Sheet open={showProfile} onClose={() => setShowProfile(false)}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[15px] font-extrabold">{user.name ?? "Operatör"}</div>
            <div className="text-[12px] text-[color:var(--op-muted)] truncate">{user.email ?? ""}</div>
            <div className="mt-2">
              <Badge tone="neutral">{org.name}</Badge>
            </div>
          </div>
          <button
            onClick={() => setShowProfile(false)}
            className="h-11 w-11 rounded-2xl border border-[color:var(--op-border)] bg-white/5 flex items-center justify-center"
          >
            <User className="h-5 w-5 text-[color:var(--op-primary-2)]" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3">
          <Button href="/operator/start" tone="primary" size="lg" leftIcon={Plus} className="w-full">
            Denetime Başla
          </Button>

         <button
            type="button"
            onClick={handleLogout}
            disabled={logoutState === "loading"}
            aria-busy={logoutState === "loading"}
            className={[
              "w-full h-[var(--op-touch)] rounded-[var(--op-radius-2xl)]",
              "bg-[color:var(--op-danger)] text-white font-extrabold",
              "flex items-center justify-center gap-2 transition",
              logoutState === "loading" ? "opacity-70 cursor-not-allowed" : "active:scale-[0.99]",
            ].join(" ")}
          >
            <LogOut className="h-5 w-5" />
            {logoutState === "loading" ? "Çıkış yapılıyor…" : "Çıkış Yap"}
        </button>
        </div>
      </Sheet>

      {toast.open && (
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-md">
        <div
          className={[
            "rounded-[18px] border px-4 py-3 backdrop-blur shadow-[var(--op-shadow-2)]",
            "bg-black/70 text-white",
            toast.tone === "success"
              ? "border-[color:color-mix(in_oklab,var(--op-success)_40%,transparent)]"
              : toast.tone === "danger"
              ? "border-[color:color-mix(in_oklab,var(--op-danger)_40%,transparent)]"
              : "border-[color:color-mix(in_oklab,var(--op-warning)_40%,transparent)]",
          ].join(" ")}
        >
          <div className="text-[13px] font-extrabold">{toast.text}</div>
        </div>
      </div>
    )}

    </div>
  );
}

function renderMobileItem(
  item: { href: string; label: string; icon: LucideIcon },
  pathname: string,
  haptic: (ms?: number) => void,
  badgeCount?: number
) {
  const active = pathname === item.href || pathname.startsWith(item.href + "/");
  const Icon = item.icon;

  return (
    <Link
      key={item.href}
      href={item.href}
      onClick={() => haptic()}
      className={cn(
        "relative flex flex-col items-center justify-center gap-1 py-2",
        active ? "text-[color:var(--op-text)]" : "text-[color:var(--op-muted)]"
      )}
    >
      <div
        className={cn(
          "h-11 w-11 rounded-2xl border flex items-center justify-center transition",
          active
            ? "border-[color:color-mix(in_oklab,var(--op-primary)_45%,transparent)] bg-[color:color-mix(in_oklab,var(--op-primary)_16%,transparent)]"
            : "border-[color:var(--op-border)] bg-white/5"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="text-[10px] font-semibold">{item.label}</div>

      

      {badgeCount && badgeCount > 0 ? (
        <span className="absolute top-1 right-3 min-w-[18px] rounded-full bg-[color:var(--op-danger)] px-1.5 py-0.5 text-[10px] font-extrabold text-white">
          {badgeCount}
        </span>
      ) : null}

      
    </Link>
  );
}
