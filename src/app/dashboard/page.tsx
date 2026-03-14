"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, AlertTriangle, Truck, Send, ArrowLeftRight, FileText } from "lucide-react";
import { DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_LABELS, formatDate } from "@/lib/utils";

type Kpis = {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingReceipts: number;
  pendingDeliveries: number;
  scheduledTransfers: number;
};

type Doc = {
  id: string;
  type: string;
  status: string;
  reference: string | null;
  createdAt: string;
  fromWarehouse: { name: string } | null;
  toWarehouse: { name: string } | null;
  lines: { product: { name: string }; quantity: number }[];
};

export default function DashboardPage() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    documentType: "",
    status: "",
    warehouseId: "",
    categoryId: "",
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.documentType) params.set("documentType", filters.documentType);
    if (filters.status) params.set("status", filters.status);
    if (filters.warehouseId) params.set("warehouseId", filters.warehouseId);
    if (filters.categoryId) params.set("categoryId", filters.categoryId);
    fetch(`/api/dashboard?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setKpis(data.kpis);
        setDocuments(data.documents ?? []);
      })
      .finally(() => setLoading(false));
  }, [filters]);

  if (loading) return <p className="text-muted-foreground">Loading dashboard…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard title="Total Products" value={kpis?.totalProducts ?? 0} icon={Package} />
        <KpiCard title="Low Stock" value={kpis?.lowStockCount ?? 0} icon={AlertTriangle} variant="warning" />
        <KpiCard title="Out of Stock" value={kpis?.outOfStockCount ?? 0} icon={AlertTriangle} variant="danger" />
        <KpiCard title="Pending Receipts" value={kpis?.pendingReceipts ?? 0} icon={Truck} />
        <KpiCard title="Pending Deliveries" value={kpis?.pendingDeliveries ?? 0} icon={Send} />
        <KpiCard title="Scheduled Transfers" value={kpis?.scheduledTransfers ?? 0} icon={ArrowLeftRight} />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-medium text-foreground mb-3">Filters</h2>
        <div className="flex flex-wrap gap-3">
          <select
            value={filters.documentType}
            onChange={(e) => setFilters((f) => ({ ...f, documentType: e.target.value }))}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">All document types</option>
            {Object.entries(DOCUMENT_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            {Object.entries(DOCUMENT_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <FilterWarehouse value={filters.warehouseId} onChange={(warehouseId) => setFilters((f) => ({ ...f, warehouseId }))} />
          <FilterCategory value={filters.categoryId} onChange={(categoryId) => setFilters((f) => ({ ...f, categoryId }))} />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <h2 className="font-medium text-foreground p-4 border-b border-border">Recent documents</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Reference</th>
                <th className="text-left p-3">From / To</th>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Lines</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-muted-foreground">No documents</td></tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-3">
                      <Link href={`/dashboard/documents/${doc.id}`} className="text-primary hover:underline">
                        {DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type}
                      </Link>
                    </td>
                    <td className="p-3">{DOCUMENT_STATUS_LABELS[doc.status] ?? doc.status}</td>
                    <td className="p-3">{doc.reference ?? "—"}</td>
                    <td className="p-3">
                      {doc.fromWarehouse?.name ?? "—"} → {doc.toWarehouse?.name ?? "—"}
                    </td>
                    <td className="p-3">{formatDate(doc.createdAt)}</td>
                    <td className="p-3">{doc.lines?.length ?? 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  variant = "default",
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  variant?: "default" | "warning" | "danger";
}) {
  const color = variant === "danger" ? "text-destructive" : variant === "warning" ? "text-amber-600" : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{title}</span>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <p className={`mt-1 text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function FilterWarehouse({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [list, setList] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    fetch("/api/warehouses").then((r) => r.json()).then(setList);
  }, []);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
    >
      <option value="">All warehouses</option>
      {list.map((w) => (
        <option key={w.id} value={w.id}>{w.name}</option>
      ))}
    </select>
  );
}

function FilterCategory({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [list, setList] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((data) => setList(data));
  }, []);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
    >
      <option value="">All categories</option>
      {list.map((c) => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  );
}
