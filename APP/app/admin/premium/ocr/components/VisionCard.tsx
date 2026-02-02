//APP\app\admin\premium\ocr\components\VisionCard.tsx
"use client";

import { motion } from "framer-motion";

export default function VisionCard({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="
        bg-white/5 
        border border-white/10 
        rounded-3xl 
        p-8 
        backdrop-blur-2xl 
        shadow-[0_0_60px_rgba(150,150,255,0.15)] 
      "
    >
      {title && (
        <h2 className="text-2xl font-semibold mb-4 text-white">{title}</h2>
      )}
      {children}
    </motion.div>
  );
}
