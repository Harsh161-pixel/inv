import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { z } from "zod";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? null;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const warehouses = await prisma.warehouse.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(warehouses);
}

const bodySchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  address: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? null;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = bodySchema.parse(body);
    const existing = await prisma.warehouse.findUnique({ where: { code: data.code } });
    if (existing) return NextResponse.json({ error: "Warehouse code already exists" }, { status: 400 });
    if (data.isDefault) {
      await prisma.warehouse.updateMany({ data: { isDefault: false } });
    }
    const warehouse = await prisma.warehouse.create({
      data: { name: data.name, code: data.code, address: data.address ?? null, isDefault: data.isDefault ?? false },
    });
    return NextResponse.json(warehouse);
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.flatten() }, { status: 400 });
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
