import { prisma } from "./prisma";
import type { DocumentType } from "@prisma/client";

export async function applyDocumentStock(
  documentId: string,
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { lines: { include: { product: true } } },
  });
  if (!doc) return { ok: false, error: "Document not found" };
  if (doc.status === "DONE") return { ok: false, error: "Already validated" };
  if (doc.status === "CANCELED") return { ok: false, error: "Document is canceled" };

  const toWh = doc.toWarehouseId;
  const fromWh = doc.fromWarehouseId;

  if (doc.type === "RECEIPT") {
    if (!toWh) return { ok: false, error: "Receipt must have destination warehouse" };
    for (const line of doc.lines) {
      const qty = line.receivedQty ?? line.quantity;
      if (qty <= 0) continue;
      await prisma.stockLevel.upsert({
        where: { productId_warehouseId: { productId: line.productId, warehouseId: toWh } },
        create: { productId: line.productId, warehouseId: toWh, quantity: qty },
        update: { quantity: { increment: qty } },
      });
      await prisma.stockMove.create({
        data: {
          productId: line.productId,
          toWarehouseId: toWh,
          quantity: qty,
          quantityDelta: qty,
          documentId,
          createdById: userId,
        },
      });
    }
  } else if (doc.type === "DELIVERY") {
    if (!fromWh) return { ok: false, error: "Delivery must have source warehouse" };
    for (const line of doc.lines) {
      const qty = line.quantity;
      if (qty <= 0) continue;
      const sl = await prisma.stockLevel.findUnique({
        where: { productId_warehouseId: { productId: line.productId, warehouseId: fromWh } },
      });
      const current = sl?.quantity ?? 0;
      if (current < qty) return { ok: false, error: `Insufficient stock for ${line.product.name}` };
      await prisma.stockLevel.upsert({
        where: { productId_warehouseId: { productId: line.productId, warehouseId: fromWh } },
        create: { productId: line.productId, warehouseId: fromWh, quantity: -qty },
        update: { quantity: { decrement: qty } },
      });
      await prisma.stockMove.create({
        data: {
          productId: line.productId,
          fromWarehouseId: fromWh,
          quantity: qty,
          quantityDelta: -qty,
          documentId,
          createdById: userId,
        },
      });
    }
  } else if (doc.type === "INTERNAL_TRANSFER") {
    if (!fromWh || !toWh) return { ok: false, error: "Transfer must have source and destination" };
    for (const line of doc.lines) {
      const qty = line.quantity;
      if (qty <= 0) continue;
      const sl = await prisma.stockLevel.findUnique({
        where: { productId_warehouseId: { productId: line.productId, warehouseId: fromWh } },
      });
      const current = sl?.quantity ?? 0;
      if (current < qty) return { ok: false, error: `Insufficient stock for ${line.product.name}` };
      await prisma.stockLevel.update({
        where: { productId_warehouseId: { productId: line.productId, warehouseId: fromWh } },
        data: { quantity: { decrement: qty } },
      });
      await prisma.stockLevel.upsert({
        where: { productId_warehouseId: { productId: line.productId, warehouseId: toWh } },
        create: { productId: line.productId, warehouseId: toWh, quantity: qty },
        update: { quantity: { increment: qty } },
      });
      await prisma.stockMove.create({
        data: {
          productId: line.productId,
          fromWarehouseId: fromWh,
          toWarehouseId: toWh,
          quantity: qty,
          quantityDelta: 0,
          documentId,
          createdById: userId,
        },
      });
    }
  } else if (doc.type === "ADJUSTMENT") {
    for (const line of doc.lines) {
      const qty = line.quantity; // actual count; we need to adjust to this. So delta = qty - current.
      const wh = toWh ?? fromWh;
      if (!wh) return { ok: false, error: "Adjustment must have a warehouse" };
      const sl = await prisma.stockLevel.findUnique({
        where: { productId_warehouseId: { productId: line.productId, warehouseId: wh } },
      });
      const current = sl?.quantity ?? 0;
      const delta = qty - current;
      if (delta === 0) continue;
      await prisma.stockLevel.upsert({
        where: { productId_warehouseId: { productId: line.productId, warehouseId: wh } },
        create: { productId: line.productId, warehouseId: wh, quantity: qty },
        update: { quantity: qty },
      });
      await prisma.stockMove.create({
        data: {
          productId: line.productId,
          toWarehouseId: wh,
          fromWarehouseId: delta < 0 ? wh : null,
          quantity: Math.abs(delta),
          quantityDelta: delta,
          documentId,
          reason: doc.reference ?? "Adjustment",
          createdById: userId,
        },
      });
    }
  }

  await prisma.document.update({
    where: { id: documentId },
    data: { status: "DONE" },
  });
  return { ok: true };
}
