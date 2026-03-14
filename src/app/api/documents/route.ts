import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { z } from "zod";

const lineSchema = z.object({
  productId: z.string(),
  quantity: z.number().positive(),
  receivedQty: z.number().optional(),
});

const createSchema = z.object({
  type: z.enum(["RECEIPT", "DELIVERY", "INTERNAL_TRANSFER", "ADJUSTMENT"]),
  reference: z.string().optional(),
  fromWarehouseId: z.string().optional().nullable(),
  toWarehouseId: z.string().optional().nullable(),
  lines: z.array(lineSchema).min(1),
}).refine(
  (data) => {
    if (data.type === "RECEIPT") return !!data.toWarehouseId;
    if (data.type === "DELIVERY") return !!data.fromWarehouseId;
    if (data.type === "INTERNAL_TRANSFER") return !!data.fromWarehouseId && !!data.toWarehouseId;
    if (data.type === "ADJUSTMENT") return !!data.toWarehouseId || !!data.fromWarehouseId;
    return true;
  },
  { message: "Warehouse(s) required for this document type" }
);

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? null;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const documents = await prisma.document.findMany({
    where: {
      ...(type ? { type: type as "RECEIPT" | "DELIVERY" | "INTERNAL_TRANSFER" | "ADJUSTMENT" } : {}),
      ...(status ? { status: status as "DRAFT" | "WAITING" | "READY" | "DONE" | "CANCELED" } : {}),
    },
    include: {
      lines: { include: { product: { include: { category: true } } } },
      fromWarehouse: true,
      toWarehouse: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(documents);
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? null;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    const doc = await prisma.document.create({
      data: {
        type: data.type,
        status: "DRAFT",
        reference: data.reference ?? null,
        fromWarehouseId: data.fromWarehouseId ?? null,
        toWarehouseId: data.toWarehouseId ?? null,
        createdById: payload.sub,
        lines: {
          create: data.lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            receivedQty: l.receivedQty ?? null,
          })),
        },
      },
      include: {
        lines: { include: { product: { include: { category: true } } } },
        fromWarehouse: true,
        toWarehouse: true,
      },
    });
    return NextResponse.json(doc);
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.flatten() }, { status: 400 });
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
