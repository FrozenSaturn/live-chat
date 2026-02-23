import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimestamp(timestamp: number) {
  const date = new Date(timestamp);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const isSameYear = date.getFullYear() === now.getFullYear();
  if (isSameYear) {
    return `${date.toLocaleDateString([], { month: "short", day: "numeric" })}, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }

  return date.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
}
