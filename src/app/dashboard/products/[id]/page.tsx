"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  unitOfMeasure: string;
  reorderThreshold: number | null;
  category: { name: string };
  stockLevels: { warehouse: { name: string }; warehouseId: string; quantity: number }[];
};

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [unitOfMeasure, setUnitOfMeasure] = useState("");
  const [reorderThreshold, setReorderThreshold] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/products/${id}`).then((r) => r.json()).then((data) => {
      setProduct(data);
      setName(data.name);
      setSku(data.sku);
      setCategoryId(data.categoryId);
      setUnitOfMeasure(data.unitOfMeasure);
      setReorderThreshold(data.reorderThreshold != null ? String(data.reorderThreshold) : "");
    });
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, [id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          sku,
          categoryId,
          unitOfMeasure,
          reorderThreshold: reorderThreshold ? parseInt(reorderThreshold, 10) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Update failed");
        return;
      }
      setProduct(data);
    } finally {
      setLoading(false);
    }
  }

  if (!product) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      <Link href="/dashboard/products" className="text-sm text-muted-foreground hover:underline">← Products</Link>
      <h1 className="text-2xl font-semibold text-foreground">Edit product</h1>

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
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Reorder threshold</label>
          <input
            type="number"
            min="0"
            value={reorderThreshold}
            onChange={(e) => setReorderThreshold(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
          />
        </div>
        <div>
          <span className="text-sm font-medium">Stock by location (read-only)</span>
          <ul className="mt-1 text-sm text-muted-foreground">
            {product.stockLevels.map((s) => (
              <li key={s.warehouseId}>{s.warehouse.name}: {s.quantity} {product.unitOfMeasure}</li>
            ))}
            {product.stockLevels.length === 0 && <li>No stock recorded</li>}
          </ul>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-medium disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}
