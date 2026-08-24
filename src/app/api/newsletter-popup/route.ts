import { NextResponse } from "next/server";
import { getNewsletterPopupPublic } from "@/lib/newsletterPopup";

export async function GET() {
  return NextResponse.json(await getNewsletterPopupPublic());
}
