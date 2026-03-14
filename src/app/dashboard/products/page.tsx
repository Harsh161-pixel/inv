"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";

type Product = {
  id: string;
  name: string;
  sku: string;
  unitOfMeasure: string;
  reorderThreshold: number | null;
  category: { name: string };
  stockLevels: { warehouse: { name: string }; quantity: number }[];
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (categoryId) params.set("categoryId", categoryId);
    fetch(`/api/products?${params}`)
      .then((r) => r.json())
      .then(setProducts)
      .finally(() => setLoading(false));
  }, [q, categoryId]);

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Products</h1>
        <Link
          href="/dashboard/products/new"
          className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 font-medium"
        >
          <Plus className="h-4 w-4" />
          New product
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search by name or SKU…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 rounded-lg border border-border bg-background px-3 py-2 text-sm w-64"
          />
        </div>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">SKU</th>
                <th className="text-left p-3">Category</th>
                <th className="text-left p-3">UoM</th>
                <th className="text-left p-3">Stock by location</th>
                <th className="text-left p-3">Reorder at</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-4 text-muted-foreground">Loading…</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="p-4 text-muted-foreground">No products</td></tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3">{p.sku}</td>
                    <td className="p-3">{p.category.name}</td>
                    <td className="p-3">{p.unitOfMeasure}</td>
                    <td className="p-3">
                      {p.stockLevels.length === 0
                        ? "—"
                        : p.stockLevels.map((s) => `${s.warehouse.name}: ${s.quantity}`).join(", ")}
                    </td>
                    <td className="p-3">{p.reorderThreshold ?? "—"}</td>
                    <td className="p-3">
                      <Link href={`/dashboard/products/${p.id}`} className="text-primary hover:underline">
                        Edit
                      </Link>
                    </td>
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
