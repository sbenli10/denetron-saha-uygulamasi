"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SettingsLayoutProps {
  children: ReactNode;
}

export default function SettingsLayout({
  children,
}: SettingsLayoutProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* ================= Background ================= */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />

        {/* Ambient blobs */}
        <div className="absolute -top-48 -left-48 h-[600px] w-[600px] rounded-full bg-indigo-300/25 blur-[160px]" />
        <div className="absolute top-1/3 -right-40 h-[520px] w-[520px] rounded-full bg-sky-300/20 blur-[180px]" />
        <div className="absolute bottom-[-220px] left-1/4 h-[480px] w-[480px] rounded-full bg-purple-300/20 blur-[200px]" />
      </div>

      {/* ================= Page Container ================= */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <header className="mb-10 max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Ayarlar
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Organizasyon, güvenlik ve sistem tercihlerini yönetin.
          </p>
        </header>

        {/* ================= Main Shell ================= */}
        <section
          className={cn(
            "grid grid-cols-1 gap-6", // ✅ TEK KOLON
            "rounded-3xl border border-slate-200/70 dark:border-slate-800",
            "bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl",
            "shadow-[0_20px_60px_rgba(0,0,0,0.08)]",
            "p-4 sm:p-6"
          )}
        >
          {/* ================= Main Content ================= */}
          <main
            className="
              rounded-2xl
              border border-slate-200/60 dark:border-slate-800
              bg-white/80 dark:bg-slate-900/80
              backdrop-blur-xl
              p-5 sm:p-6
              min-h-[420px]
            "
          >
            {children}
          </main>
        </section>
      </div>
    </div>
  );
}
