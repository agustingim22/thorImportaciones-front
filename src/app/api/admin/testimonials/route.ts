import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/server/auth";

type TestimonialInput = {
  name: string;
  comment: string;
  rating: number;
  published: boolean;
};

function validate(input: TestimonialInput): Record<string, string[]> | null {
  const errors: Record<string, string[]> = {};
  if (!input.name?.trim()) errors.name = ["El nombre es obligatorio."];
  if (!input.comment?.trim()) errors.comment = ["El comentario es obligatorio."];
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    errors.rating = ["El puntaje debe ser un número entero de 1 a 5."];
  }
  return Object.keys(errors).length > 0 ? errors : null;
}

export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const testimonials = await prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(testimonials);
}

export async function POST(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const input = (await req.json()) as TestimonialInput;
  const errors = validate(input);
  if (errors) return NextResponse.json({ errors }, { status: 400 });

  const testimonial = await prisma.testimonial.create({
    data: {
      name: input.name.trim(),
      comment: input.comment.trim(),
      rating: input.rating,
      published: input.published,
    },
  });
  return NextResponse.json(testimonial, { status: 201 });
}
