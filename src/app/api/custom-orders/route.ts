import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CustomItemInput = {
  reference?: string;
  fabric?: string;
  size?: string;
  patch?: string;
  number?: string;
  name?: string;
};

type Body = {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  shippingAddress?: string;
  notes?: string;
  items?: CustomItemInput[];
};

export async function POST(req: Request) {
  const body = (await req.json()) as Body;

  const errors: Record<string, string[]> = {};
  if (!body.customerName?.trim()) errors.customerName = ["Ingresá tu nombre."];
  if (!body.customerPhone?.trim()) errors.customerPhone = ["Ingresá tu teléfono / WhatsApp."];
  if (!body.shippingAddress?.trim()) errors.shippingAddress = ["Ingresá la dirección de envío."];
  if (!Array.isArray(body.items) || body.items.length === 0)
    errors.items = ["Agregá al menos una camiseta."];
  else if (body.items.some((i) => !i.reference?.trim()))
    errors.items = ["Cada camiseta necesita un link o una descripción."];
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

  const publicId = crypto.randomBytes(6).toString("hex");

  const order = await prisma.order.create({
    data: {
      publicId,
      kind: "Custom",
      status: "Pending",
      customerName: body.customerName!.trim(),
      customerEmail: body.customerEmail?.trim() ?? "",
      customerPhone: body.customerPhone!.trim(),
      shippingAddress: body.shippingAddress!.trim(),
      notes: body.notes?.trim() || null,
      total: 0, // se coordina por WhatsApp
      customItems: {
        create: body.items!.map((i) => ({
          reference: i.reference!.trim(),
          fabric: (i.fabric ?? "").trim(),
          size: (i.size ?? "").trim(),
          patch: i.patch?.trim() || null,
          number: i.number?.trim() || null,
          name: i.name?.trim() || null,
        })),
      },
    },
  });

  return NextResponse.json({ orderId: order.publicId });
}
