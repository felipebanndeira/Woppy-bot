import { NextRequest, NextResponse } from "next/server";
import { generateGoogleAuthUrl } from "@/lib/integrations/googleOAuth";

export async function GET(request: NextRequest) {
  const service = request.nextUrl.searchParams.get("service") as any;
  if (!service || !["GOOGLE_CALENDAR", "GMAIL", "GOOGLE_SHEETS"].includes(service)) {
    return NextResponse.json({ error: "Servicio Google no válido" }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    // Si aún no se ha configurado la clave en Google Cloud, informar con guía
    return NextResponse.redirect(
      new URL("/integraciones?error=google_client_not_configured&service=" + service, request.url)
    );
  }

  const url = generateGoogleAuthUrl(service);
  return NextResponse.redirect(url);
}
