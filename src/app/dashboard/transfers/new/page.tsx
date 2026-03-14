"use client";

import DocumentForm from "@/components/DocumentForm";

export default function NewTransferPage() {
  return (
    <DocumentForm
      title="New internal transfer"
      documentType="INTERNAL_TRANSFER"
      backHref="/dashboard/transfers"
      requireFromWarehouse
      requireToWarehouse
    />
  );
}
