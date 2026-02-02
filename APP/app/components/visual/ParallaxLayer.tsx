"use client";

import { useEffect, useRef } from "react";

export default function ParallaxLayer() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const move = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 12;
      const y = (e.clientY / window.innerHeight - 0.5) * 12;

      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <div
      ref={ref}
      className="
        fixed inset-0
        z-0
        pointer-events-none
        mix-blend-screen
        opacity-[0.12]
        bg-gradient-to-br
        from-[#ffba3a]/10
        via-[#f59e0b]/10
        to-[#ffde70]/20
        blur-3xl
      "
    />
  );
}
