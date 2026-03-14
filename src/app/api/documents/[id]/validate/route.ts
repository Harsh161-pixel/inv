import { NextResponse } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { applyDocumentStock } from "@/lib/stock";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? null;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await applyDocumentStock(id, payload.sub);
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Validation failed" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
