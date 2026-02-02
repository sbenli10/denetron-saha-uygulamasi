// APP/app/admin/premium/ocr/create/layout.tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { pageMotion } from "./transitionVariants";

export default function CreateOCRLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={pageMotion}
        initial="initial"
        animate="animate"
        exit="exit"
        className="
          mx-auto max-w-6xl
          rounded-3xl
          bg-white/5
          backdrop-blur-xl
          border border-white/10
          shadow-[0_20px_60px_rgba(0,0,0,0.25)]
          p-10
        "
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
