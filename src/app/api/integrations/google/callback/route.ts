import { NextRequest, NextResponse } from "next/server";
import { getGoogleOAuthClient } from "@/lib/integrations/googleOAuth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";
import { google } from "googleapis";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const stateStr = request.nextUrl.searchParams.get("state");
  const errorParam = request.nextUrl.searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(
      new URL(`/integraciones?error=${encodeURIComponent(errorParam)}`, request.url)
    );
  }

  if (!code || !stateStr) {
    return NextResponse.redirect(new URL("/integraciones?error=missing_code", request.url));
  }

  try {
    const { service } = JSON.parse(stateStr);
    const oauth2Client = getGoogleOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    oauth2Client.setCredentials(tokens);

    // Obtener correo de la cuenta de Google
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const accountEmail = userInfo.data.email || "Cuenta de Google";

    // Guardar tokens cifrados
    const encAccessToken = tokens.access_token ? encrypt(tokens.access_token) : null;
    const encRefreshToken = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;
    const expiry = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

    await prisma.integration.upsert({
      where: { provider: service },
      update: {
        status: "CONNECTED",
        accountEmailOrId: accountEmail,
        encryptedAccessToken: encAccessToken,
        encryptedRefreshToken: encRefreshToken,
        tokenExpiry: expiry,
        errorMessage: null,
      },
      create: {
        provider: service,
        status: "CONNECTED",
        accountEmailOrId: accountEmail,
        encryptedAccessToken: encAccessToken,
        encryptedRefreshToken: encRefreshToken,
        tokenExpiry: expiry,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: `Integración conectada: ${service}`,
        details: JSON.stringify({ accountEmail }),
        result: "SUCCESS",
      },
    });

    return NextResponse.redirect(new URL("/integraciones?success=" + service, request.url));
  } catch (error: any) {
    console.error("Error en callback OAuth de Google:", error);
    return NextResponse.redirect(
      new URL(`/integraciones?error=${encodeURIComponent(error.message || "oauth_failed")}`, request.url)
    );
  }
}
