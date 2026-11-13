import { NextResponse } from "next/server";
import { ADMIN_COOKIE, ADMIN_COOKIE_PATH } from "@/lib/server/auth";

/** Salir del panel: borra la cookie de sesión. */
export async function POST() {
  const res = new NextResponse(null, { status: 204 });
  res.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: ADMIN_COOKIE_PATH,
    maxAge: 0,
  });
  return res;
}
