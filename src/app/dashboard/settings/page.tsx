"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

type Warehouse = { id: string; name: string; code: string; address: string | null; isDefault: boolean };
type Category = { id: string; name: string; description: string | null };

export default function SettingsPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetch("/api/warehouses").then((r) => r.json()), fetch("/api/categories").then((r) => r.json())])
      .then(([w, c]) => {
        setWarehouses(w);
        setCategories(c);
      })
      .finally(() => setLoading(false));
  }, []);

  const [newWarehouse, setNewWarehouse] = useState({ name: "", code: "", address: "" });
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function addWarehouse(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/warehouses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newWarehouse.name,
          code: newWarehouse.code,
          address: newWarehouse.address || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      setWarehouses((prev) => [...prev, data]);
      setNewWarehouse({ name: "", code: "", address: "" });
    } finally {
      setSaving(false);
    }
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategory.name,
          description: newCategory.description || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      setCategories((prev) => [...prev, data]);
      setNewCategory({ name: "", description: "" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-foreground">Warehouse setup &amp; categories</h1>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-medium text-foreground mb-4">Warehouses</h2>
        <ul className="mb-4 space-y-2">
          {warehouses.map((w) => (
            <li key={w.id} className="flex items-center justify-between py-1">
              <span>{w.name} ({w.code}) {w.isDefault && <span className="text-muted-foreground text-sm">default</span>}</span>
            </li>
          ))}
          {warehouses.length === 0 && <li className="text-muted-foreground">No warehouses yet.</li>}
        </ul>
        <form onSubmit={addWarehouse} className="flex flex-wrap gap-3">
          <input
            placeholder="Name"
            value={newWarehouse.name}
            onChange={(e) => setNewWarehouse((p) => ({ ...p, name: e.target.value }))}
            className="rounded-lg border border-border bg-background px-3 py-2"
            required
          />
          <input
            placeholder="Code"
            value={newWarehouse.code}
            onChange={(e) => setNewWarehouse((p) => ({ ...p, code: e.target.value }))}
            className="rounded-lg border border-border bg-background px-3 py-2"
            required
          />
          <input
            placeholder="Address (optional)"
            value={newWarehouse.address}
            onChange={(e) => setNewWarehouse((p) => ({ ...p, address: e.target.value }))}
            className="rounded-lg border border-border bg-background px-3 py-2"
          />
          <button type="submit" disabled={saving} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-medium disabled:opacity-50">
            Add warehouse
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-medium text-foreground mb-4">Product categories</h2>
        <ul className="mb-4 space-y-2">
          {categories.map((c) => (
            <li key={c.id}>{c.name} {c.description && <span className="text-muted-foreground text-sm">– {c.description}</span>}</li>
          ))}
          {categories.length === 0 && <li className="text-muted-foreground">No categories yet.</li>}
        </ul>
        <form onSubmit={addCategory} className="flex flex-wrap gap-3">
          <input
            placeholder="Category name"
            value={newCategory.name}
            onChange={(e) => setNewCategory((p) => ({ ...p, name: e.target.value }))}
            className="rounded-lg border border-border bg-background px-3 py-2"
            required
          />
          <input
            placeholder="Description (optional)"
            value={newCategory.description}
            onChange={(e) => setNewCategory((p) => ({ ...p, description: e.target.value }))}
            className="rounded-lg border border-border bg-background px-3 py-2"
          />
          <button type="submit" disabled={saving} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-medium disabled:opacity-50">
            Add category
          </button>
        </form>
      </section>

      {error && <p className="text-destructive">{error}</p>}
    </div>
  );
}
