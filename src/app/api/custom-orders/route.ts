import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidPhone, PHONE_HINT } from "@/lib/validation";

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
  street?: string;
  postalCode?: string;
  city?: string;
  province?: string;
  floor?: string;
  apartment?: string;
  deliveryNotes?: string;
  notes?: string;
  items?: CustomItemInput[];
};

export async function POST(req: Request) {
  const body = (await req.json()) as Body;

  const errors: Record<string, string[]> = {};
  if (!body.customerName?.trim()) errors.customerName = ["Ingresá tu nombre."];
  if (!body.customerPhone?.trim()) errors.customerPhone = ["Ingresá tu teléfono / WhatsApp."];
  else if (!isValidPhone(body.customerPhone)) errors.customerPhone = [PHONE_HINT];
  if (!body.street?.trim()) errors.street = ["Ingresá la calle y el número."];
  if (!body.postalCode?.trim()) errors.postalCode = ["Ingresá el código postal."];
  if (!body.city?.trim()) errors.city = ["Ingresá la ciudad."];
  if (!body.province?.trim()) errors.province = ["Ingresá la provincia."];
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
      street: body.street!.trim(),
      postalCode: body.postalCode!.trim(),
      city: body.city!.trim(),
      province: body.province!.trim(),
      floor: body.floor?.trim() || null,
      apartment: body.apartment?.trim() || null,
      deliveryNotes: body.deliveryNotes?.trim() || null,
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
