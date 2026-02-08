"use client";

import { Crown, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

interface DenetronPremiumBadgeProps {
  role?: string; // örn: "ADMIN"
}

export default function DenetronPremiumBadge({
  role = "ADMIN",
}: DenetronPremiumBadgeProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className="relative inline-flex items-center"
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-xl blur-xl opacity-60"
        style={{
          background: "var(--premium-glow)",
        }}
      />

      {/* Badge */}
      <div
        className="
          relative z-10
          inline-flex items-center gap-1.5
          rounded-xl px-3 py-1
          text-[11px] font-semibold uppercase tracking-wide
          shadow-md backdrop-blur-md
          border
          transition-all
        "
        style={{
          background: "var(--premium-bg)",
          color: "var(--premium-text)",
          borderColor: "var(--premium-border)",
        }}
      >
        {/* Role */}
        <span className="inline-flex items-center gap-1">
          <ShieldCheck size={12} />
          {role}
        </span>

        <span className="opacity-60">·</span>

        {/* Premium */}
        <span className="inline-flex items-center gap-1">
          <Crown size={12} />
          Premium
        </span>
      </div>
    </motion.div>
  );
}
