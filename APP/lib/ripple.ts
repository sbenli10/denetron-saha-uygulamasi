export function attachSoftRipple(el: HTMLElement) {
  el.classList.add("soft-ripple");

  el.addEventListener("pointerdown", (e) => {
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement("span");
    ripple.className = "soft-ripple-circle";
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    el.appendChild(ripple);

    ripple.addEventListener("animationend", () => {
      ripple.remove();
    });
  });
}
