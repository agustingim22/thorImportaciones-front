import { NextResponse } from "next/server";
import { consumePasswordReset } from "@/lib/server/session";

type Body = { token?: string; password?: string };

export async function POST(req: Request) {
  const body = (await req.json()) as Body;

  if (!body.token) return NextResponse.json({ error: "Falta el token." }, { status: 400 });
  if (!body.password || body.password.length < 8) {
    return NextResponse.json(
      { errors: { password: ["La contraseña debe tener al menos 8 caracteres."] } },
      { status: 400 },
    );
  }

  const ok = await consumePasswordReset(body.token, body.password);
  if (!ok) {
    return NextResponse.json(
      { error: "El link venció o ya fue usado. Pedí uno nuevo." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
