import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { provider } = await request.json();
    if (!provider) return NextResponse.json({ error: "Proveedor requerido" }, { status: 400 });

    await prisma.integration.updateMany({
      where: { provider },
      data: {
        status: "DISCONNECTED",
        accountEmailOrId: null,
        encryptedAccessToken: null,
        encryptedRefreshToken: null,
        errorMessage: null,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: `Integración desconectada: ${provider}`,
        result: "WARNING",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al desconectar" }, { status: 500 });
  }
}
