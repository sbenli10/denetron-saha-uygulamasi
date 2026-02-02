"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full">

      {/* ===== Background ===== */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-100" />

        <div className="absolute w-[700px] h-[700px] -top-48 -left-48 bg-indigo-300/30 blur-[180px] rounded-full" />
        <div className="absolute w-[600px] h-[600px] top-1/3 -right-40 bg-sky-300/25 blur-[200px] rounded-full" />
        <div className="absolute w-[500px] h-[500px] bottom-[-200px] left-1/4 bg-purple-300/20 blur-[220px] rounded-full" />
      </div>

      {/* ===== Content Wrapper ===== */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Ayarlar
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Organizasyon, güvenlik ve sistem tercihlerini yönetin.
          </p>
        </div>

        {/* ===== Main Card ===== */}
        <div
          className={cn(`
            grid grid-cols-1 lg:grid-cols-[260px_1fr]
            gap-6
            rounded-3xl
            border border-slate-200/70
            bg-white/70
            backdrop-blur-2xl
            shadow-[0_20px_60px_rgba(0,0,0,0.08)]
            p-4 sm:p-6
          `)}
        >
          {/* Sol boş panel – sadece macOS sidebar hissi */}
          <aside
            className="
              hidden lg:block
              rounded-2xl
              border border-slate-200/60
              bg-white/60
              backdrop-blur-xl
            "
          />

          {/* Sağ içerik */}
          <main
            className="
              rounded-2xl
              border border-slate-200/60
              bg-white/80
              backdrop-blur-xl
              p-5 sm:p-6
              min-h-[420px]
            "
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
