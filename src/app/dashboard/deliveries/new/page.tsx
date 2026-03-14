"use client";

import DocumentForm from "@/components/DocumentForm";

export default function NewDeliveryPage() {
  return (
    <DocumentForm
      title="New delivery order (outgoing)"
      documentType="DELIVERY"
      backHref="/dashboard/deliveries"
      requireFromWarehouse
    />
  );
}
