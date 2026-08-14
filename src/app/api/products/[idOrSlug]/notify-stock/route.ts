import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProductByIdOrSlug } from "@/lib/products";
import { rateLimit } from "@/lib/server/ratelimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request, { params }: { params: Promise<{ idOrSlug: string }> }) {
  const limited = await rateLimit("stock-notify", req, 10, 10 * 60);
  if (limited) return limited;

  const { idOrSlug } = await params;
  const product = await getProductByIdOrSlug(idOrSlug);
  if (!product) return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });

  const { email } = (await req.json()) as { email?: string };
  const clean = email?.trim().toLowerCase() ?? "";
  if (!EMAIL_RE.test(clean))
    return NextResponse.json({ error: "Ingresá un email válido." }, { status: 400 });

  await prisma.stockNotification.upsert({
    where: { productId_email: { productId: product.id, email: clean } },
    create: { productId: product.id, email: clean },
    update: { notified: false },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
