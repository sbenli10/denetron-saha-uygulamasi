import { ReactNode } from "react";

export default function LoginCard({ children }: { children: ReactNode }) {
  return (
    <section
      className="
        relative z-10
        w-full max-w-md
        rounded-2xl
        bg-white/70 dark:bg-white/5
        backdrop-blur-xl
        border border-black/10 dark:border-white/10
        shadow-[0_40px_120px_rgba(0,0,0,0.35)]
        p-8
      "
    >
      {children}
    </section>
  );
}
