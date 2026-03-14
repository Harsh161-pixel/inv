"use client";

import DocumentForm from "@/components/DocumentForm";

export default function NewAdjustmentPage() {
  return (
    <DocumentForm
      title="New stock adjustment"
      documentType="ADJUSTMENT"
      backHref="/dashboard/adjustments"
      requireToWarehouse
      adjustmentMode
    />
  );
}
