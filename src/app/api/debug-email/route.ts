import { NextResponse } from "next/server";
import { Resend } from "resend";
import { isAdmin } from "@/lib/server/auth";

// Endpoint TEMPORAL de diagnóstico — borrar después de resolver el envío de emails.
export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  const diagnostics: Record<string, unknown> = {
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey ? apiKey.slice(0, 6) : null,
    apiKeyLength: apiKey?.length ?? 0,
    emailFrom: from ?? null,
    nodeEnv: process.env.NODE_ENV,
  };

  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      const result = await resend.emails.send({
        from: from || "onboarding@resend.dev",
        to: "aguleoema@gmail.com",
        subject: "Diagnóstico desde producción",
        html: "<p>Si ves esto, el envío desde el servidor de producción funciona.</p>",
      });
      diagnostics.sendResult = result;
    } catch (err) {
      diagnostics.sendError = err instanceof Error ? err.message : String(err);
    }
  }

  return NextResponse.json(diagnostics);
}
