import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const assistant = await prisma.assistantSettings.findFirst();

    if (!assistant) {
      return NextResponse.json({ error: "Asistente no encontrado" }, { status: 404 });
    }

    const updated = await prisma.assistantSettings.update({
      where: { id: assistant.id },
      data: {
        name: data.name,
        tone: data.tone,
        welcomeMessage: data.welcomeMessage,
        instructions: data.instructions,
        forbiddenRules: JSON.stringify(data.forbiddenRules || []),
        outOfHoursAction: data.outOfHoursAction,
        handoffComplaint: Boolean(data.handoffComplaint),
        handoffUrgency: Boolean(data.handoffUrgency),
        handoffHumanAsk: Boolean(data.handoffHumanAsk),
        handoffUnknown: Boolean(data.handoffUnknown),
        handoffCustomRule: data.handoffCustomRule || null,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: "Comportamiento actualizado",
        result: "SUCCESS",
        details: JSON.stringify({ name: updated.name, tone: updated.tone }),
      },
    });

    return NextResponse.json({ success: true, assistant: updated });
  } catch (error) {
    console.error("Error al actualizar comportamiento:", error);
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  }
}
