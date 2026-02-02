import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind + clsx class merge utility
 */
export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}
