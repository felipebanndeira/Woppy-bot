import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === "disconnect") {
      await prisma.workerCommand.create({
        data: { command: "DISCONNECT" },
      });
      return NextResponse.json({ success: true, message: "Orden de desconexión enviada" });
    }

    if (action === "reconnect") {
      await prisma.workerCommand.create({
        data: { command: "RECONNECT" },
      });
      return NextResponse.json({ success: true, message: "Orden de reconexión enviada" });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error: any) {
    console.error("Error en control de WhatsApp:", error);
    return NextResponse.json({ error: error?.message || "Error interno" }, { status: 500 });
  }
}
