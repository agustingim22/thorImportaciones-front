import { NextResponse } from "next/server";
import { isCloudinaryConfigured, uploadCustomReference } from "@/lib/server/cloudinary";
import { rateLimit } from "@/lib/server/ratelimit";

/** Sube una foto de referencia para un ítem de pedido personalizado (antes de crear el pedido). */
export async function POST(req: Request) {
  const limited = await rateLimit("custom-order-image", req, 20, 10 * 60);
  if (limited) return limited;

  if (!isCloudinaryConfigured())
    return NextResponse.json({ error: "El servicio de imágenes no está configurado." }, { status: 503 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0)
    return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 });
  if (!file.type.startsWith("image/"))
    return NextResponse.json({ error: "Subí una imagen." }, { status: 400 });
  if (file.size > 8 * 1024 * 1024)
    return NextResponse.json({ error: "El archivo no puede superar los 8 MB." }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const url = await uploadCustomReference(bytes);
  return NextResponse.json({ url });
}
