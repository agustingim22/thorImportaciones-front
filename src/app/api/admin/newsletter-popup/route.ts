import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/server/auth";

type PopupInput = {
  enabled: boolean;
  couponCode: string | null;
  headline: string;
  subtext: string;
};

export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const settings = await prisma.newsletterPopupSettings.findUnique({ where: { id: 1 } });
  return NextResponse.json(
    settings ?? {
      id: 1,
      enabled: false,
      couponCode: null,
      headline: "Sumate y conseguí un cupón de descuento",
      subtext: "Enterate primero de nuevas camisetas, drops y promos exclusivas.",
    },
  );
}

export async function PUT(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const input = (await req.json()) as PopupInput;

  if (!input.headline?.trim() || !input.subtext?.trim()) {
    return NextResponse.json({ error: "El título y el texto no pueden estar vacíos." }, { status: 400 });
  }

  const code = input.couponCode?.trim().toUpperCase() || null;
  if (input.enabled && !code) {
    return NextResponse.json({ error: "Elegí qué cupón mostrar para activar el pop-up." }, { status: 400 });
  }
  if (code) {
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon) return NextResponse.json({ error: "Ese código de cupón no existe." }, { status: 400 });
  }

  const data = { enabled: input.enabled, couponCode: code, headline: input.headline.trim(), subtext: input.subtext.trim() };
  const settings = await prisma.newsletterPopupSettings.upsert({
    where: { id: 1 },
    create: { id: 1, ...data },
    update: data,
  });
  return NextResponse.json(settings);
}
