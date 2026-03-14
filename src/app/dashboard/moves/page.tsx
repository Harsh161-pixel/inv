"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";

type Move = {
  id: string;
  quantityDelta: number;
  quantity: number;
  reason: string | null;
  createdAt: string;
  product: { name: string; sku: string };
  fromWarehouse: { name: string } | null;
  toWarehouse: { name: string } | null;
  document: { type: string; id: string } | null;
  createdBy: { email: string; name: string | null } | null;
};

export default function MoveHistoryPage() {
  const [moves, setMoves] = useState<Move[]>([]);
  const [loading, setLoading] = useState(true);
  const [productId, setProductId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then((data) => setProducts(data));
    fetch("/api/warehouses").then((r) => r.json()).then(setWarehouses);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (productId) params.set("productId", productId);
    if (warehouseId) params.set("warehouseId", warehouseId);
    fetch(`/api/moves?${params}`)
      .then((r) => r.json())
      .then(setMoves)
      .finally(() => setLoading(false));
  }, [productId, warehouseId]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Stock ledger / Move history</h1>

      <div className="flex flex-wrap gap-3">
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">All products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">All warehouses</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Product</th>
                <th className="text-left p-3">From → To</th>
                <th className="text-right p-3">Delta</th>
                <th className="text-left p-3">Reason</th>
                <th className="text-left p-3">By</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-4 text-muted-foreground">Loading…</td></tr>
              ) : moves.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-muted-foreground">No moves</td></tr>
              ) : (
                moves.map((m) => (
                  <tr key={m.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-3">{formatDate(m.createdAt)}</td>
                    <td className="p-3">{m.product.name} ({m.product.sku})</td>
                    <td className="p-3">{m.fromWarehouse?.name ?? "—"} → {m.toWarehouse?.name ?? "—"}</td>
                    <td className={`p-3 text-right font-medium ${m.quantityDelta >= 0 ? "text-green-600" : "text-destructive"}`}>
                      {m.quantityDelta >= 0 ? "+" : ""}{m.quantityDelta}
                    </td>
                    <td className="p-3">{m.reason ?? "—"}</td>
                    <td className="p-3">{m.createdBy?.name || m.createdBy?.email || "—"}</td>
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
