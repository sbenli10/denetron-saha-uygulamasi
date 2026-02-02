"use client";

import { motion } from "framer-motion";

export default function AILoader() {
  return (
    <motion.div
      className="flex items-center justify-center space-x-3"
      initial="start"
      animate="end"
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-400 to-blue-400"
          variants={{
            start: { opacity: 0.3, scale: 0.9 },
            end: {
              opacity: 1,
              scale: 1.3,
              transition: {
                duration: 0.6,
                repeat: Infinity,
                repeatType: "reverse",
                delay: i * 0.2,
              },
            },
          }}
        />
      ))}
    </motion.div>
  );
}
