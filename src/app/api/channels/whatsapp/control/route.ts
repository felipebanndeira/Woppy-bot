import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === "disconnect") {
      await prisma.channelSettings.upsert({
        where: { channel: "WHATSAPP" },
        update: { connectionStatus: "DISCONNECTED", connectedNumber: null, qrCode: null },
        create: { channel: "WHATSAPP", connectionStatus: "DISCONNECTED" },
      });
      await prisma.workerCommand.create({
        data: { command: "DISCONNECT" },
      });
      return NextResponse.json({ success: true, message: "Sesión desconectada" });
    }

    if (action === "reconnect") {
      // Inmediatamente limpiar el QR viejo de la base de datos
      await prisma.channelSettings.upsert({
        where: { channel: "WHATSAPP" },
        update: { connectionStatus: "WAITING_QR", qrCode: null },
        create: { channel: "WHATSAPP", connectionStatus: "WAITING_QR" },
      });

      // Crear la orden para que el worker de Baileys regenere el QR al instante
      await prisma.workerCommand.create({
        data: { command: "RECONNECT" },
      });

      return NextResponse.json({ success: true, message: "Generando nuevo código QR..." });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error: any) {
    console.error("Error en control de WhatsApp:", error);
    return NextResponse.json({ error: error?.message || "Error interno" }, { status: 500 });
  }
}
