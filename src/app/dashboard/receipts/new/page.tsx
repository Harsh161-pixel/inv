"use client";

import DocumentForm from "@/components/DocumentForm";

export default function NewReceiptPage() {
  return (
    <DocumentForm
      title="New receipt (incoming goods)"
      documentType="RECEIPT"
      backHref="/dashboard/receipts"
      requireToWarehouse
    />
  );
}
