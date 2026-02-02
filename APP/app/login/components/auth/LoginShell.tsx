"use client";

import { ReactNode } from "react";

export default function LoginShell({ children }: { children: ReactNode }) {
  return (
    <main
      className="
        relative min-h-screen w-full
        flex items-center justify-center
        bg-[#0b0b0d] text-white
        overflow-hidden
        selection:bg-blue-500/30
      "
    >
      {children}
    </main>
  );
}
