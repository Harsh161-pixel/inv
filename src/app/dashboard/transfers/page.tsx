"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { DOCUMENT_STATUS_LABELS, formatDate } from "@/lib/utils";

type Doc = {
  id: string;
  status: string;
  reference: string | null;
  createdAt: string;
  fromWarehouse: { name: string } | null;
  toWarehouse: { name: string } | null;
  lines: unknown[];
};

export default function TransfersPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/documents?type=INTERNAL_TRANSFER")
      .then((r) => r.json())
      .then(setDocs)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Internal transfers</h1>
        <Link
          href="/dashboard/transfers/new"
          className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 font-medium"
        >
          <Plus className="h-4 w-4" />
          New transfer
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left p-3">Reference</th>
              <th className="text-left p-3">From → To</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Lines</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-4 text-muted-foreground">Loading…</td></tr>
            ) : docs.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-muted-foreground">No transfers</td></tr>
            ) : (
              docs.map((doc) => (
                <tr key={doc.id} className="border-b border-border hover:bg-muted/30">
                  <td className="p-3">{doc.reference ?? "—"}</td>
                  <td className="p-3">{doc.fromWarehouse?.name ?? "—"} → {doc.toWarehouse?.name ?? "—"}</td>
                  <td className="p-3">{DOCUMENT_STATUS_LABELS[doc.status]}</td>
                  <td className="p-3">{formatDate(doc.createdAt)}</td>
                  <td className="p-3">{doc.lines?.length ?? 0}</td>
                  <td className="p-3">
                    <Link href={`/dashboard/documents/${doc.id}`} className="text-primary hover:underline">View</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
