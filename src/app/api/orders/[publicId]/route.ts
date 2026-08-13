import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const order = await prisma.order.findUnique({
    where: { publicId },
    include: { items: true },
  });
  if (!order) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json({
    orderId: order.publicId,
    status: order.status,
    total: order.total,
    trackingNumber: order.trackingNumber,
    createdAt: order.createdAt,
    items: order.items.map((i) => ({
      productName: i.productName,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      size: i.size,
    })),
  });
}
