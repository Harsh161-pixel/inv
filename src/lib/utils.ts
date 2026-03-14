import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  RECEIPT: "Receipt",
  DELIVERY: "Delivery",
  INTERNAL_TRANSFER: "Internal Transfer",
  ADJUSTMENT: "Adjustment",
};

export const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  WAITING: "Waiting",
  READY: "Ready",
  DONE: "Done",
  CANCELED: "Canceled",
};
