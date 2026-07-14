import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind class names, resolving conflicts (e.g. "p-2 p-4" -> "p-4").
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default cn;
