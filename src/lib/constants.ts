export const DOCUMENT_TYPES = [
  "RECEIPT",
  "DELIVERY",
  "INTERNAL_TRANSFER",
  "ADJUSTMENT",
] as const;

export const DOCUMENT_STATUSES = [
  "DRAFT",
  "WAITING",
  "READY",
  "DONE",
  "CANCELED",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];
