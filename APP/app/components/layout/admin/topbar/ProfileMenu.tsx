//APP\app\components\layout\admin\topbar\ProfileMenu.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronDown,
  LogOut,
  Settings,
  ShieldCheck,
  User,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { applyRipple } from "@/app/components/ui/ripple";
import { signOutAction } from "@/app/auth/signOutAction";
import DenetronPremiumBadge from "@/app/components/premium/DenetronPremiumBadge";
import { SheetOverlay } from "@/components/ui/sheet";

// shadcn/ui
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/* =========================
   Types
========================= */
interface ProfileUser {
  name?: string;
  email?: string;
  role?: string;
  isPremium?: boolean;
  image?: string | null; // 👈 gerçek profil fotoğrafı
}

/* =========================
   Hooks
========================= */
function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, [query]);

  return matches;
}

/* =========================
   Utils
========================= */
function getInitials(v?: string) {
  const str = (v ?? "U").trim();
  const parts = str.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return str[0]?.toUpperCase() ?? "U";
}

/* =========================
   Shared UI
========================= */
function PremiumDot({ enabled }: { enabled?: boolean }) {
  if (!enabled) return null;

  return (
    <motion.span
      aria-hidden="true"
      className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-amber-400 ring-2 ring-background"
      animate={{ scale: [1, 1.18, 1] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function TriggerButton({
  user,
  openChevron = false,
}: {
  user: ProfileUser;
  openChevron?: boolean;
}) {
  const displayName = user.name ?? user.email ?? "Kullanıcı";
  const initials = getInitials(displayName);

  return (
    <button
      type="button"
      onMouseDown={(e) => applyRipple(e, e.currentTarget)}
      className={cn(
        "relative inline-flex items-center gap-3 rounded-xl px-3 py-2",
        "border border-border bg-background shadow-sm transition-all",
        "hover:bg-muted/40 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
    >
      <div className="relative">
        <Avatar className="h-9 w-9 border border-primary/20 bg-primary/10">
          <AvatarImage
            src={user.image ?? undefined}
            alt={displayName}
            referrerPolicy="no-referrer"
          />
          <AvatarFallback className="text-xs font-semibold text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>

        <PremiumDot enabled={user.isPremium} />
      </div>

      <div className="hidden sm:flex flex-col items-start leading-tight min-w-0">
        <span className="truncate max-w-[140px] text-sm font-medium">
          {displayName}
        </span>

        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <ShieldCheck size={11} />
          {user.role ?? "Üye"}
        </span>
      </div>

      <ChevronDown
        size={16}
        className={cn(
          "hidden sm:block text-muted-foreground transition-transform",
          openChevron && "rotate-180"
        )}
      />
    </button>
  );
}

function IdentityHeader({ user }: { user: ProfileUser }) {
  const displayName = user.name ?? user.email ?? "Kullanıcı";
  const initials = getInitials(displayName);

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className="relative mt-0.5">
          <Avatar className="h-10 w-10 border border-border bg-muted/40">
            <AvatarImage
              src={user.image ?? undefined}
              alt={displayName}
              referrerPolicy="no-referrer"
            />
            <AvatarFallback className="text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          {user.isPremium && (
            <motion.span
              aria-hidden="true"
              className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-amber-400 ring-2 ring-background"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </div>

        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{displayName}</div>
          {user.email && (
            <div className="truncate text-xs text-muted-foreground max-w-[210px]">
              {user.email}
            </div>
          )}

          <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-border bg-muted/30 px-2 py-0.5 text-[11px] text-muted-foreground">
            <ShieldCheck size={11} />
            <span>{user.role ?? "Üye"}</span>
          </div>
        </div>
      </div>

      {user.isPremium && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <DenetronPremiumBadge />
        </motion.div>
      )}
    </div>
  );
}

function ActionRow({
  icon: Icon,
  label,
  onSelect,
  variant = "default",
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  onSelect?: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        variant === "danger"
          ? "text-red-600 hover:bg-red-50"        // 👈 ÇIKIŞ BUTONU
          : "text-neutral-900 hover:bg-neutral-100", // 👈 NORMAL BUTONLAR
        disabled && "opacity-60 cursor-not-allowed"
      )}
    >
      <Icon size={16} />
      <span>{label}</span>
    </button>
  );
}


/* =========================
   Main Component
========================= */
export default function ProfileMenu({ user }: { user: ProfileUser }) {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 640px)"); // sm breakpoint
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  // Desktop: DropdownMenu
  if (isDesktop) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="select-none">
            <TriggerButton user={user} />
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent
            align="end"
            sideOffset={10}
            className={cn(
              "w-80 rounded-2xl p-0 overflow-hidden",
              "border border-black/10",
              "bg-white text-neutral-900", // 👈 BEYAZ ARKA PLAN
              "shadow-[0_30px_80px_rgba(0,0,0,0.18)]"
            )}
          >


          <DropdownMenuLabel className="px-4 py-3">
            <IdentityHeader user={user} />
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <div className="p-2">
            <DropdownMenuItem
              className="p-0 focus:bg-transparent"
              onSelect={(e) => {
                e.preventDefault();
                router.push("/profil");
              }}
            >
              <ActionRow icon={User} label="👤 Profil" />
            </DropdownMenuItem>

            <DropdownMenuItem
              className="p-0 focus:bg-transparent"
              onSelect={(e) => {
                e.preventDefault();
                router.push("/admin/settings");
              }}
            >
            <ActionRow icon={Settings} label="⚙️ Ayarlar" />
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-2" />

            <DropdownMenuItem
              className="p-0 focus:bg-transparent"
              disabled={isPending}
              onSelect={(e) => {
                e.preventDefault();
                startTransition(() => {
                  signOutAction();
                });
              }}
            >
              <ActionRow
                icon={LogOut}
                label={isPending ? "🚪 Çıkış yapılıyor…" : "🚪 Çıkış Yap"}
                variant="danger"
                disabled={isPending}
              />
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

 // Mobile: Bottom sheet
  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <div className="select-none">
          <TriggerButton user={user} />
        </div>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className={cn(
          // 🧱 Layout
          "fixed inset-x-0 bottom-0 z-50",
          "flex flex-col",

          // 🎨 Görsel
          "rounded-t-2xl border border-border/60",
          "bg-neutral-950 text-neutral-100",
          "shadow-[0_-24px_80px_rgba(0,0,0,0.8)]",

          // 📱 iOS / Mobile FIX (EN KRİTİK KISIM)
          "h-[100dvh] max-h-[100dvh] sm:h-auto",
          "overflow-y-auto overscroll-contain",

          // 🧼 Padding reset (content içeride verilecek)
          "p-0"
        )}
      >
        {/* HEADER */}
        <SheetHeader className="px-4 pt-4 pb-3 shrink-0">
          <SheetTitle className="text-left text-base">
            <IdentityHeader user={user} />
          </SheetTitle>
        </SheetHeader>

        {/* CONTENT */}
        <div className="flex-1 px-2 pb-4">
          <ActionRow
            icon={User}
            label="Profil"
            onSelect={() => {
              setSheetOpen(false);
              router.push("/profil");
            }}
          />

          <ActionRow
            icon={Settings}
            label="Ayarlar"
            onSelect={() => {
              setSheetOpen(false);
              router.push("/admin/settings");
            }}
          />

          <div className="my-2 h-px bg-border" />

          <ActionRow
            icon={LogOut}
            label={isPending ? "Çıkış yapılıyor…" : "Çıkış Yap"}
            variant="danger"
            disabled={isPending}
            onSelect={() => {
              startTransition(() => {
                signOutAction();
              });
            }}
          />

          {/* iOS safe bottom space */}
          <div className="h-6" />
        </div>
      </SheetContent>
    </Sheet>
  );

}
