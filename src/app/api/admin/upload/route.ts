import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/server/auth";
import { isCloudinaryConfigured, uploadImage } from "@/lib/server/cloudinary";

export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!isCloudinaryConfigured())
    return NextResponse.json({ error: "El servicio de imágenes no está configurado." }, { status: 503 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0)
    return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 });
  if (!file.type.startsWith("image/"))
    return NextResponse.json({ error: "El archivo debe ser una imagen." }, { status: 400 });
  if (file.size > 8 * 1024 * 1024)
    return NextResponse.json({ error: "La imagen no puede superar los 8 MB." }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const url = await uploadImage(bytes);
  return NextResponse.json({ url });
}
