"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "./cn";
import type { LucideIcon } from "lucide-react";

type Tone = "neutral" | "primary" | "success" | "warning" | "danger";

const toneStyles: Record<Tone, string> = {
  neutral:
    "bg-[color:var(--op-surface-1)] border-[color:var(--op-border)] text-[color:var(--op-text)]",
  primary:
    "bg-[color:color-mix(in_oklab,var(--op-primary)_18%,transparent)] border-[color:color-mix(in_oklab,var(--op-primary)_40%,transparent)] text-[color:var(--op-text)]",
  success:
    "bg-[color:color-mix(in_oklab,var(--op-success)_16%,transparent)] border-[color:color-mix(in_oklab,var(--op-success)_40%,transparent)] text-[color:var(--op-text)]",
  warning:
    "bg-[color:color-mix(in_oklab,var(--op-warning)_16%,transparent)] border-[color:color-mix(in_oklab,var(--op-warning)_40%,transparent)] text-[color:var(--op-text)]",
  danger:
    "bg-[color:color-mix(in_oklab,var(--op-danger)_16%,transparent)] border-[color:color-mix(in_oklab,var(--op-danger)_42%,transparent)] text-[color:var(--op-text)]",
};

export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-[var(--op-radius-2xl)] border shadow-[var(--op-shadow-1)]",
        "bg-[color:var(--op-surface-1)] border-[color:var(--op-border)]",
        props.className
      )}
    />
  );
}

export function CardHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={cn("px-4 pt-4", props.className)} />
  );
}

export function CardContent(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={cn("px-4 pb-4", props.className)} />
  );
}

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  tone?: Tone;
  size?: "lg" | "md" | "sm";
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  type?: "button" | "submit";
  href?: string;
};

export function Button({
  children,
  onClick,
  disabled,
  className,
  tone = "neutral",
  size = "md",
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  type = "button",
  href,
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold select-none " +
    "active:scale-[0.99] transition will-change-transform " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--op-ring)]";

  const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
    lg: "h-[var(--op-touch)] px-5 rounded-[var(--op-radius-2xl)] text-[15px]",
    md: "h-12 px-4 rounded-[var(--op-radius-xl)] text-[14px]",
    sm: "h-10 px-3 rounded-[14px] text-[13px]",
  };

  const variants: Record<Tone, string> = {
    neutral:
      "bg-[color:var(--op-surface-2)] border border-[color:var(--op-border)] text-[color:var(--op-text)] hover:bg-[color:var(--op-surface-3)]",
    primary:
      "bg-[color:var(--op-primary)] text-black hover:bg-[color:color-mix(in_oklab,var(--op-primary)_92%,white)]",
    success:
      "bg-[color:var(--op-success)] text-black hover:bg-[color:color-mix(in_oklab,var(--op-success)_92%,white)]",
    warning:
      "bg-[color:var(--op-warning)] text-black hover:bg-[color:color-mix(in_oklab,var(--op-warning)_92%,white)]",
    danger:
      "bg-[color:var(--op-danger)] text-white hover:bg-[color:color-mix(in_oklab,var(--op-danger)_92%,white)]",
  };

  const inner = (
    <>
      {LeftIcon ? <LeftIcon className="h-5 w-5" /> : null}
      <span className="truncate">{children}</span>
      {RightIcon ? <RightIcon className="h-5 w-5" /> : null}
    </>
  );

  const cls = cn(
    base,
    sizes[size],
    variants[tone],
    disabled ? "opacity-60 pointer-events-none" : "",
    className
  );

  if (href) {
    return (
      <Link href={href} className={cls} onClick={onClick}>
        {inner}
      </Link>
    );
  }

  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled}>
      {inner}
    </button>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        toneStyles[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Divider({ className }: { className?: string }) {
  return (
    <div
      className={cn("h-px w-full bg-[color:var(--op-border)]", className)}
    />
  );
}

export function SectionTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-[color:var(--op-text)] truncate">
          {title}
        </div>
        {subtitle ? (
          <div className="text-[11px] text-[color:var(--op-muted)]">
            {subtitle}
          </div>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: Tone;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--op-radius-2xl)] border p-4",
        "shadow-[var(--op-shadow-1)]",
        toneStyles[tone]
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] tracking-wide text-[color:var(--op-muted)]">
            {label}
          </div>
          <div className="mt-1 text-3xl font-extrabold leading-none text-[color:var(--op-text)]">
            {value}
          </div>
        </div>
        <div className="h-11 w-11 rounded-2xl border border-[color:var(--op-border)] bg-black/20 flex items-center justify-center">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="flex w-full rounded-[16px] border border-[color:var(--op-border)] bg-[color:var(--op-surface-1)] p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "flex-1 h-10 rounded-[14px] text-[12px] font-semibold transition",
              active
                ? "bg-[color:var(--op-surface-3)] text-[color:var(--op-text)]"
                : "text-[color:var(--op-muted)] hover:bg-white/5"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Sheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 flex items-end"
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full rounded-t-[var(--op-radius-3xl)] border-t border-[color:var(--op-border)]",
          "bg-[color:color-mix(in_oklab,var(--op-bg)_85%,black)] backdrop-blur",
          "p-5 pb-7 shadow-[var(--op-shadow-2)]"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
