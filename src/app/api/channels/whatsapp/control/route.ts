import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === "disconnect") {
      await prisma.workerCommand.create({
        data: { command: "DISCONNECT" },
      });
      return NextResponse.json({ success: true, message: "Orden de desconexión enviada al worker" });
    }

    if (action === "reconnect") {
      await prisma.workerCommand.create({
        data: { command: "RECONNECT" },
      });
      return NextResponse.json({ success: true, message: "Orden de reconexión enviada al worker" });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
