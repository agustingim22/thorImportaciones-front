import { NextResponse } from "next/server";
import { getSessionUser, toPublicUser } from "@/lib/server/session";

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user: user ? toPublicUser(user) : null });
}
