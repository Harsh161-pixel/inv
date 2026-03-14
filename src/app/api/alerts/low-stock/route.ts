import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? null;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const levels = await prisma.stockLevel.findMany({
    where: { quantity: { gt: 0 } },
    include: { product: { include: { category: true } }, warehouse: true },
  });

  const lowStock = levels.filter(
    (sl) =>
      sl.product.reorderThreshold != null &&
      sl.quantity < sl.product.reorderThreshold
  );

  const outOfStock = await prisma.stockLevel.findMany({
    where: { quantity: 0 },
    include: { product: { include: { category: true } }, warehouse: true },
  });

  return NextResponse.json({
    lowStock: lowStock.map((sl) => ({
      productId: sl.productId,
      productName: sl.product.name,
      sku: sl.product.sku,
      warehouseName: sl.warehouse.name,
      quantity: sl.quantity,
      reorderThreshold: sl.product.reorderThreshold,
      unitOfMeasure: sl.product.unitOfMeasure,
    })),
    outOfStock: outOfStock.map((sl) => ({
      productId: sl.productId,
      productName: sl.product.name,
      sku: sl.product.sku,
      warehouseName: sl.warehouse.name,
      unitOfMeasure: sl.product.unitOfMeasure,
    })),
  });
}
