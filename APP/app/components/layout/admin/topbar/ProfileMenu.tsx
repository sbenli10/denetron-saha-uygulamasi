"use client";

import { LogOut, Settings, User, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOutAction } from "@/app/auth/signOutAction";
import DenetronPremiumBadge from "@/app/components/premium/DenetronPremiumBadge";
import { applyRipple } from "@/app/components/ui/ripple";

interface ProfileUser {
  name?: string;
  email?: string;
  role?: string;
  isPremium?: boolean;
}

function initials(v?: string) {
  const str = (v ?? "U").trim();
  const parts = str.split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return str[0]?.toUpperCase() ?? "U";
}

export default function ProfileMenu({ user }: { user: ProfileUser }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  const name = user.name ?? user.email ?? "Kullanıcı";
  const avatar = initials(name);

  // outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // escape
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, []);

  async function logout() {
    startTransition(async () => {
      await signOutAction();
      router.push("/login");
    });
  }

  return (
    <div className="relative select-none" ref={ref}>

      {/* Trigger */}
      <button
        onMouseDown={(e) => applyRipple(e, e.currentTarget)}
        onClick={() => setOpen((v) => !v)}
        className="
          inline-flex items-center gap-2
          rounded-xl border border-border/70
          px-2 py-1.5
          bg-white/70 backdrop-blur-md
          hover:bg-indigo-50
          transition shadow-sm
        "
      >
        <span
          className="
            inline-flex h-8 w-8 items-center justify-center
            rounded-full bg-indigo-100 text-indigo-700
            border border-border shadow-sm
          "
        >
          <span className="text-xs font-semibold">{avatar}</span>
        </span>

        <span className="hidden sm:flex flex-col items-start leading-tight">
          <span className="truncate max-w-[140px] text-sm font-medium text-foreground">
            {name}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {user.role ?? "Üye"}
          </span>
        </span>

        <ChevronDown size={16} className="hidden sm:block text-muted-foreground" />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="
            absolute right-0 mt-2 w-64
            rounded-2xl border border-border
            bg-white/85 backdrop-blur-xl
            shadow-[0_8px_28px_rgba(99,102,241,0.14)]
            overflow-hidden z-[999]
            animate-in fade-in zoom-in duration-150
          "
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-border bg-white/60">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{name}</div>
                {user.email && (
                  <div className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </div>
                )}

                {user.role && (
                  <span
                    className="
                      mt-1 inline-block rounded-full px-2 py-0.5
                      text-[11px] text-muted-foreground
                      border border-border bg-white/40
                    "
                  >
                    {user.role}
                  </span>
                )}
              </div>

              {user.isPremium && <DenetronPremiumBadge />}
            </div>
          </div>

          {/* Items */}
          <div className="p-2">

            <button
              onMouseDown={(e) => applyRipple(e, e.currentTarget)}
              className="
                w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm
                hover:bg-indigo-50 transition
              "
            >
              <User size={16} className="text-muted-foreground" />
              Profil
            </button>

            <button
              onMouseDown={(e) => applyRipple(e, e.currentTarget)}
              className="
                w-full flex items-center mt-1 gap-2 rounded-xl px-3 py-2 text-sm
                hover:bg-indigo-50 transition
              "
            >
              <Settings size={16} className="text-muted-foreground" />
              Ayarlar
            </button>

            <div className="my-2 h-px bg-border/70" />

            <button
              onMouseDown={(e) => applyRipple(e, e.currentTarget)}
              onClick={logout}
              disabled={isPending}
              className="
                w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm
                text-destructive hover:bg-red-50 hover:text-red-600 transition
                disabled:opacity-60
              "
            >
              <LogOut size={16} />
              {isPending ? "Çıkış yapılıyor…" : "Çıkış Yap"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
