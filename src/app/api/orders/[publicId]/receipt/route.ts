import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isCloudinaryConfigured, uploadReceipt } from "@/lib/server/cloudinary";
import { rateLimit } from "@/lib/server/ratelimit";

export async function POST(req: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const limited = await rateLimit("receipt-upload", req, 10, 10 * 60);
  if (limited) return limited;

  const { publicId } = await params;
  const order = await prisma.order.findUnique({ where: { publicId } });
  if (!order) return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });

  if (!isCloudinaryConfigured())
    return NextResponse.json({ error: "El servicio de imágenes no está configurado." }, { status: 503 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0)
    return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 });
  const okType = file.type.startsWith("image/") || file.type === "application/pdf";
  if (!okType) return NextResponse.json({ error: "Subí una imagen o un PDF." }, { status: 400 });
  if (file.size > 8 * 1024 * 1024)
    return NextResponse.json({ error: "El archivo no puede superar los 8 MB." }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const url = await uploadReceipt(bytes);

  await prisma.order.update({ where: { publicId }, data: { receiptUrl: url } });
  return NextResponse.json({ url });
}
