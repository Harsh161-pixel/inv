"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ProfilePage() {
  const [user, setUser] = useState<{ id: string; email: string; name: string | null } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setUser(data.user));
  }, []);

  if (!user) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">← Dashboard</Link>
      <h1 className="text-2xl font-semibold text-foreground">My profile</h1>
      <div className="rounded-xl border border-border bg-card p-6 max-w-md space-y-3">
        <div>
          <span className="text-sm text-muted-foreground">Email</span>
          <p className="font-medium">{user.email}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Name</span>
          <p className="font-medium">{user.name || "—"}</p>
        </div>
      </div>
    </div>
  );
}
