import { useEffect, useState } from "react";

export function useAccentColor() {
  const [color, setColor] = useState("#0a84ff"); // macOS default blue

  useEffect(() => {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setColor("#0a84ff");
    }
  }, []);

  return color;
}
