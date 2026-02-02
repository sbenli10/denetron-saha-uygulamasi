// APP/app/admin/premium/ocr/create/transitionVariants.ts
import { Variants } from "framer-motion";

export const pageMotion: Variants = {
  initial: {
    opacity: 0,
    y: 24,
    scale: 0.985,
    filter: "blur(14px)",
  },

  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1], // Apple-like easing
    },
  },

  exit: {
    opacity: 0,
    y: -20,
    scale: 0.985,
    filter: "blur(10px)",
    transition: {
      duration: 0.35,
      ease: "easeInOut",
    },
  },
};
