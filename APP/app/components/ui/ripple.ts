"use client";

export function applyRipple(
  e: React.MouseEvent | React.MouseEvent<Element, MouseEvent>,
  target: HTMLElement
) {
  const rect = target.getBoundingClientRect();
  const ripple = document.createElement("span");

  const size = Math.max(rect.width, rect.height) * 1.4;
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;

  ripple.style.position = "absolute";
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;

  ripple.style.background = "rgba(255,255,255,0.35)";
  ripple.style.borderRadius = "50%";
  ripple.style.pointerEvents = "none";
  ripple.style.transform = "scale(0.2)";
  ripple.style.opacity = "0.9";

  ripple.style.backdropFilter = "blur(6px) saturate(160%)";
  ripple.style.boxShadow = "0 0 22px rgba(255,255,255,0.6)";

  ripple.style.transition =
    "transform 420ms cubic-bezier(0.25,0.1,0.25,1), opacity 520ms ease-out";

  target.appendChild(ripple);

  requestAnimationFrame(() => {
    ripple.style.transform = "scale(1)";
    ripple.style.opacity = "0";
  });

  setTimeout(() => ripple.remove(), 600);
}
