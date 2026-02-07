"use client";

import {
  LogOut,
  Settings,
  User,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import DenetronPremiumBadge from "@/app/components/premium/DenetronPremiumBadge";
import { applyRipple } from "@/app/components/ui/ripple";
import { signOutAction } from "@/app/auth/signOutAction";
import { cn } from "@/lib/utils";

interface ProfileUser {
  name?: string;
  email?: string;
  role?: string;
  isPremium?: boolean;
}

/* =========================
   Utils
========================= */
function initials(v?: string) {
  const str = (v ?? "U").trim();
  const parts = str.split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return str[0]?.toUpperCase() ?? "U";
}

/* =========================
   Component
========================= */
export default function ProfileMenu({ user }: { user: ProfileUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  const name = user.name ?? user.email ?? "Kullanıcı";
  const avatar = initials(name);

  /* Close on user change */
  useEffect(() => {
    setOpen(false);
  }, [user.email]);

  /* Outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ESC */
  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, []);

  return (
    <div ref={ref} className="relative select-none">
      {/* ================= TRIGGER ================= */}
      <button
        type="button"
        onMouseDown={(e) => applyRipple(e, e.currentTarget)}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-3 rounded-xl",
          "border border-border/60 bg-background",
          "px-2.5 py-1.5 shadow-sm transition",
          "hover:bg-muted/40 hover:shadow-md"
        )}
      >
        {/* Avatar */}
        <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
          <span className="text-xs font-semibold">{avatar}</span>
          {user.isPremium && (
            <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-amber-400 border border-background" />
          )}
        </span>

        {/* Name / Role */}
        <span className="hidden sm:flex flex-col items-start leading-tight">
          <span className="max-w-[140px] truncate text-sm font-medium">
            {name}
          </span>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <ShieldCheck size={11} />
            {user.role ?? "Üye"}
          </span>
        </span>

        <ChevronDown
          size={16}
          className={cn(
            "hidden sm:block text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {/* ================= DROPDOWN ================= */}
      {open && (
        <div
          className={cn(
            "absolute right-0 mt-2 w-72 z-[1000] isolate overflow-hidden",
            "rounded-2xl border border-border",
            "bg-background",
            "shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
          )}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-border bg-background">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">
                  {name}
                </div>
                {user.email && (
                  <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {user.email}
                  </div>
                )}
              </div>
              {user.isPremium && <DenetronPremiumBadge />}
            </div>
          </div>

          {/* Actions */}
          <div className="p-2 bg-background">
            <MenuItem
              icon={User}
              label="Profil"
              onClick={() => {
                setOpen(false);
                router.push("/profil");
              }}
            />

           <MenuItem
              icon={Settings}
              label="Ayarlar"
              onClick={() => {
                setOpen(false);
                router.push("/admin/settings");
              }}
            />
            <div className="my-2 h-px bg-border" />

            {/* Logout */}
            <form
              action={() =>
                startTransition(() => {
                  signOutAction();
                })
              }
            >
              <MenuItem
                icon={LogOut}
                label={isPending ? "Çıkış yapılıyor…" : "Çıkış Yap"}
                danger
                disabled={isPending}
                type="submit"
              />
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================
   Menu Item
========================= */
function MenuItem({
  icon: Icon,
  label,
  danger,
  disabled,
  onClick,
  type = "button",
}: {
  icon: any;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
        "hover:bg-muted/40",
        danger
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground",
        disabled && "opacity-60 cursor-not-allowed"
      )}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}
