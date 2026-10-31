import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action } = await request.json();

    if (action === "take_control") {
      await prisma.conversation.update({
        where: { id },
        data: { status: "HUMAN_CONTROL" },
      });
      await prisma.activityLog.create({
        data: {
          action: "Control tomado por persona humana",
          details: JSON.stringify({ conversationId: id }),
          result: "SUCCESS",
        },
      });
      return NextResponse.json({ success: true, status: "HUMAN_CONTROL" });
    }

    if (action === "return_to_assistant") {
      await prisma.conversation.update({
        where: { id },
        data: { status: "ACTIVE" },
      });
      await prisma.activityLog.create({
        data: {
          action: "Conversación devuelta al asistente",
          details: JSON.stringify({ conversationId: id }),
          result: "SUCCESS",
        },
      });
      return NextResponse.json({ success: true, status: "ACTIVE" });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar conversación" }, { status: 500 });
  }
}
