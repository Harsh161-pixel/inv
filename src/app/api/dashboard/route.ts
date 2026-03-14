import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? null;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const docType = searchParams.get("documentType");
  const status = searchParams.get("status");
  const warehouseId = searchParams.get("warehouseId");
  const categoryId = searchParams.get("categoryId");

  const documentWhere: Record<string, unknown> = {};
  if (docType) documentWhere.type = docType;
  if (status) documentWhere.status = status;
  if (warehouseId) documentWhere.OR = [{ fromWarehouseId: warehouseId }, { toWarehouseId: warehouseId }];
  if (categoryId) {
    documentWhere.lines = { some: { product: { categoryId } } };
  }

  const [
    totalProducts,
    pendingReceipts,
    pendingDeliveries,
    scheduledTransfers,
    documents,
    stockLevelsWithProduct,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.document.count({ where: { type: "RECEIPT", status: { in: ["DRAFT", "WAITING", "READY"] } } }),
    prisma.document.count({ where: { type: "DELIVERY", status: { in: ["DRAFT", "WAITING", "READY"] } } }),
    prisma.document.count({ where: { type: "INTERNAL_TRANSFER", status: { in: ["DRAFT", "WAITING", "READY"] } } }),
    prisma.document.findMany({
      where: documentWhere,
      include: {
        lines: { include: { product: { include: { category: true } } } },
        fromWarehouse: true,
        toWarehouse: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.stockLevel.findMany({ include: { product: true } }),
  ]);

  let lowStockCount = 0;
  for (const sl of stockLevelsWithProduct) {
    if (sl.product.reorderThreshold != null && sl.quantity > 0 && sl.quantity < sl.product.reorderThreshold)
      lowStockCount++;
  }
  const outOfStockCount = await prisma.stockLevel.count({ where: { quantity: 0 } });

  return NextResponse.json({
    kpis: {
      totalProducts,
      lowStockCount,
      outOfStockCount,
      pendingReceipts,
      pendingDeliveries,
      scheduledTransfers,
    },
    documents,
  });
}
