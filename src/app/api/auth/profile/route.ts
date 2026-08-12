import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, toPublicUser } from "@/lib/server/session";

type Body = {
  name?: string;
  phone?: string | null;
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
  province?: string | null;
  floor?: string | null;
  apartment?: string | null;
};

export async function PUT(req: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = (await req.json()) as Body;
  if (!body.name?.trim()) {
    return NextResponse.json({ errors: { name: ["Ingresá tu nombre."] } }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: sessionUser.id },
    data: {
      name: body.name.trim(),
      phone: body.phone?.trim() || null,
      street: body.street?.trim() || null,
      postalCode: body.postalCode?.trim() || null,
      city: body.city?.trim() || null,
      province: body.province?.trim() || null,
      floor: body.floor?.trim() || null,
      apartment: body.apartment?.trim() || null,
    },
  });

  return NextResponse.json({ user: toPublicUser(updated) });
}
