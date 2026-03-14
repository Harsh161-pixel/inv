"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_LABELS, formatDate } from "@/lib/utils";

type Doc = {
  id: string;
  type: string;
  status: string;
  reference: string | null;
  createdAt: string;
  fromWarehouse: { id: string; name: string } | null;
  toWarehouse: { id: string; name: string } | null;
  lines: {
    id: string;
    productId: string;
    product: { name: string; sku: string; unitOfMeasure: string };
    quantity: number;
    receivedQty: number | null;
  }[];
};

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [doc, setDoc] = useState<Doc | null>(null);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/documents/${id}`)
      .then((r) => r.json())
      .then(setDoc)
      .catch(() => setDoc(null));
  }, [id]);

  async function validate() {
    setError("");
    setValidating(true);
    try {
      const res = await fetch(`/api/documents/${id}/validate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Validation failed");
        return;
      }
      router.refresh();
      setDoc((d) => (d ? { ...d, status: "DONE" } : null));
    } finally {
      setValidating(false);
    }
  }

  if (!doc) return <p className="text-muted-foreground">Loading…</p>;

  const canValidate = ["DRAFT", "WAITING", "READY"].includes(doc.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">← Dashboard</Link>
          <h1 className="text-2xl font-semibold text-foreground mt-1">
            {DOCUMENT_TYPE_LABELS[doc.type]} – {doc.reference || doc.id.slice(0, 8)}
          </h1>
        </div>
        {canValidate && (
          <button
            type="button"
            onClick={validate}
            disabled={validating}
            className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-medium disabled:opacity-50"
          >
            {validating ? "Validating…" : "Validate"}
          </button>
        )}
      </div>

      {error && <p className="text-destructive">{error}</p>}

      <div className="rounded-xl border border-border bg-card p-4 grid grid-cols-2 gap-4">
        <div>
          <span className="text-sm text-muted-foreground">Status</span>
          <p className="font-medium">{DOCUMENT_STATUS_LABELS[doc.status]}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Date</span>
          <p className="font-medium">{formatDate(doc.createdAt)}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">From</span>
          <p className="font-medium">{doc.fromWarehouse?.name ?? "—"}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">To</span>
          <p className="font-medium">{doc.toWarehouse?.name ?? "—"}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <h2 className="font-medium p-4 border-b border-border">Lines</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left p-3">Product</th>
              <th className="text-left p-3">SKU</th>
              <th className="text-right p-3">Quantity</th>
              {doc.type === "RECEIPT" && <th className="text-right p-3">Received</th>}
              <th className="text-left p-3">UoM</th>
            </tr>
          </thead>
          <tbody>
            {doc.lines.map((line) => (
              <tr key={line.id} className="border-b border-border">
                <td className="p-3">{line.product.name}</td>
                <td className="p-3">{line.product.sku}</td>
                <td className="p-3 text-right">{line.quantity}</td>
                {doc.type === "RECEIPT" && (
                  <td className="p-3 text-right">{line.receivedQty ?? line.quantity}</td>
                )}
                <td className="p-3">{line.product.unitOfMeasure}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
