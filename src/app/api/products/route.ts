import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { z } from "zod";

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? null;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const sku = searchParams.get("sku");
  const q = searchParams.get("q");

  const products = await prisma.product.findMany({
    where: {
      ...(categoryId ? { categoryId } : {}),
      ...(sku ? { sku: { contains: sku } } : {}),
      ...(q ? { OR: [{ name: { contains: q } }, { sku: { contains: q } }] } : {}),
    },
    include: { category: true, stockLevels: { include: { warehouse: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(products);
}

const createSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  categoryId: z.string(),
  unitOfMeasure: z.string().min(1),
  reorderThreshold: z.number().int().positive().optional().nullable(),
  initialStock: z.array(z.object({ warehouseId: z.string(), quantity: z.number() })).optional(),
});

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? null;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (existing) return NextResponse.json({ error: "SKU already exists" }, { status: 400 });

    const product = await prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        categoryId: data.categoryId,
        unitOfMeasure: data.unitOfMeasure,
        reorderThreshold: data.reorderThreshold ?? null,
      },
      include: { category: true, stockLevels: true },
    });

    if (data.initialStock?.length) {
      for (const { warehouseId, quantity } of data.initialStock) {
        if (quantity <= 0) continue;
        await prisma.stockLevel.upsert({
          where: {
            productId_warehouseId: { productId: product.id, warehouseId },
          },
          create: { productId: product.id, warehouseId, quantity },
          update: { quantity: { increment: quantity } },
        });
      }
      const updated = await prisma.product.findUnique({
        where: { id: product.id },
        include: { category: true, stockLevels: { include: { warehouse: true } } },
      });
      return NextResponse.json(updated);
    }
    return NextResponse.json(product);
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.flatten() }, { status: 400 });
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
