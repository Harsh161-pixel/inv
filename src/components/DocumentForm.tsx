"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Product = { id: string; name: string; sku: string; unitOfMeasure: string };
type Warehouse = { id: string; name: string };

type Line = { productId: string; product?: Product; quantity: string };

type Props = {
  title: string;
  documentType: "RECEIPT" | "DELIVERY" | "INTERNAL_TRANSFER" | "ADJUSTMENT";
  backHref: string;
  requireFromWarehouse?: boolean;
  requireToWarehouse?: boolean;
  adjustmentMode?: boolean;
};

export default function DocumentForm({
  title,
  documentType,
  backHref,
  requireFromWarehouse,
  requireToWarehouse,
  adjustmentMode,
}: Props) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [reference, setReference] = useState("");
  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [lines, setLines] = useState<Line[]>([{ productId: "", quantity: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts);
    fetch("/api/warehouses").then((r) => r.json()).then(setWarehouses);
  }, []);

  function addLine() {
    setLines((prev) => [...prev, { productId: "", quantity: "" }]);
  }

  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateLine(i: number, field: "productId" | "quantity", value: string) {
    setLines((prev) =>
      prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l))
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const validLines = lines.filter((l) => l.productId && l.quantity && parseFloat(l.quantity) > 0);
    if (validLines.length === 0) {
      setError("Add at least one line with product and quantity.");
      return;
    }
    if (requireFromWarehouse && !fromWarehouseId) {
      setError("Select source warehouse.");
      return;
    }
    if (requireToWarehouse && !toWarehouseId) {
      setError("Select destination warehouse.");
      return;
    }
    if (adjustmentMode && !toWarehouseId && !fromWarehouseId) {
      setError("Select warehouse for adjustment.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: documentType,
          reference: reference || undefined,
          fromWarehouseId: fromWarehouseId || undefined,
          toWarehouseId: toWarehouseId || undefined,
          lines: validLines.map((l) => ({
            productId: l.productId,
            quantity: adjustmentMode ? parseFloat(l.quantity) : parseFloat(l.quantity),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || data.error || "Failed to create");
        return;
      }
      router.push(`/dashboard/documents/${data.id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link href={backHref} className="text-sm text-muted-foreground hover:underline">← Back</Link>
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>

      <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-card p-6">
        <div>
          <label className="block text-sm font-medium mb-1">
            {adjustmentMode ? "Reason (e.g. physical count, damage)" : "Reference (optional)"}
          </label>
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requireFromWarehouse && (
            <div>
              <label className="block text-sm font-medium mb-1">From warehouse</label>
              <select
                value={fromWarehouseId}
                onChange={(e) => setFromWarehouseId(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                required={!!requireFromWarehouse}
              >
                <option value="">Select</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          )}
          {requireToWarehouse && (
            <div>
              <label className="block text-sm font-medium mb-1">To warehouse</label>
              <select
                value={toWarehouseId}
                onChange={(e) => setToWarehouseId(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                required={!!requireToWarehouse}
              >
                <option value="">Select</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          )}
          {adjustmentMode && (
            <div>
              <label className="block text-sm font-medium mb-1">Warehouse (location to adjust)</label>
              <select
                value={toWarehouseId}
                onChange={(e) => setToWarehouseId(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                required
              >
                <option value="">Select</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">
              {adjustmentMode ? "Product and actual counted quantity" : "Lines"}
            </label>
            {!adjustmentMode && (
              <button type="button" onClick={addLine} className="text-sm text-primary hover:underline">
                + Add line
              </button>
            )}
          </div>
          <div className="space-y-2">
            {lines.map((line, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <select
                  value={line.productId}
                  onChange={(e) => updateLine(i, "productId", e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2 min-w-[200px]"
                  required
                >
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder={adjustmentMode ? "Actual quantity" : "Qty"}
                  value={line.quantity}
                  onChange={(e) => updateLine(i, "quantity", e.target.value)}
                  className="w-28 rounded-lg border border-border bg-background px-3 py-2"
                  required
                />
                {lines.length > 1 && !adjustmentMode && (
                  <button type="button" onClick={() => removeLine(i)} className="text-destructive text-sm">
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          {adjustmentMode && (
            <button type="button" onClick={addLine} className="mt-2 text-sm text-primary hover:underline">
              + Add another product
            </button>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-medium disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create"}
        </button>
      </form>
    </div>
  );
}
