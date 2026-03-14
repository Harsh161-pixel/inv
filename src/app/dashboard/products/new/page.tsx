"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [unitOfMeasure, setUnitOfMeasure] = useState("pcs");
  const [reorderThreshold, setReorderThreshold] = useState("");
  const [initialStock, setInitialStock] = useState<{ warehouseId: string; quantity: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
    fetch("/api/warehouses").then((r) => r.json()).then(setWarehouses);
  }, []);

  useEffect(() => {
    if (warehouses.length && initialStock.length === 0) {
      setInitialStock(warehouses.map((w) => ({ warehouseId: w.id, quantity: "0" })));
    }
  }, [warehouses]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          sku,
          categoryId,
          unitOfMeasure,
          reorderThreshold: reorderThreshold ? parseInt(reorderThreshold, 10) : null,
          initialStock: initialStock
            .filter((s) => parseFloat(s.quantity) > 0)
            .map((s) => ({ warehouseId: s.warehouseId, quantity: parseFloat(s.quantity) })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create");
        return;
      }
      router.push("/dashboard/products");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/products" className="text-sm text-muted-foreground hover:underline">← Products</Link>
      <h1 className="text-2xl font-semibold text-foreground">New product</h1>

      <form onSubmit={submit} className="max-w-xl space-y-4 rounded-xl border border-border bg-card p-6">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">SKU / Code</label>
          <input
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
            required
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Unit of measure</label>
          <input
            value={unitOfMeasure}
            onChange={(e) => setUnitOfMeasure(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
            placeholder="kg, pcs, liters…"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Reorder threshold (alert when stock below)</label>
          <input
            type="number"
            min="0"
            value={reorderThreshold}
            onChange={(e) => setReorderThreshold(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Initial stock per warehouse (optional)</label>
          <div className="space-y-2">
            {initialStock.map((s) => (
              <div key={s.warehouseId} className="flex items-center gap-2">
                <span className="w-40 text-sm text-muted-foreground">
                  {warehouses.find((w) => w.id === s.warehouseId)?.name ?? s.warehouseId}
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={s.quantity}
                  onChange={(e) =>
                    setInitialStock((prev) =>
                      prev.map((x) =>
                        x.warehouseId === s.warehouseId ? { ...x, quantity: e.target.value } : x
                      )
                    )
                  }
                  className="w-24 rounded-lg border border-border bg-background px-3 py-2"
                />
              </div>
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-medium disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create product"}
        </button>
      </form>
    </div>
  );
}
