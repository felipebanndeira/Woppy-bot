import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const assistant = await prisma.assistantSettings.findFirst();
    if (!assistant) {
      return NextResponse.json({ error: "No se encontró el asistente" }, { status: 404 });
    }

    const updated = await prisma.assistantSettings.update({
      where: { id: assistant.id },
      data: { isEnabled: !assistant.isEnabled },
    });

    await prisma.activityLog.create({
      data: {
        action: updated.isEnabled ? "Asistente activado" : "Asistente pausado",
        result: "SUCCESS",
        details: JSON.stringify({ isEnabled: updated.isEnabled }),
      },
    });

    return NextResponse.json({ success: true, isEnabled: updated.isEnabled });
  } catch (error) {
    console.error("Error al alternar estado del asistente:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
