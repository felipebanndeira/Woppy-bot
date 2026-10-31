import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { content } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
    }

    const conv = await prisma.conversation.findUnique({
      where: { id },
      include: { contact: true },
    });

    if (!conv) return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 });

    const message = await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderType: "HUMAN_AGENT",
        content: content.trim(),
      },
    });

    await prisma.conversation.update({
      where: { id: conv.id },
      data: { lastMessageAt: new Date() },
    });

    // Enviar a WhatsApp si el canal es WhatsApp
    if (conv.channel === "WHATSAPP" && conv.contact?.phone) {
      await prisma.workerCommand.create({
        data: {
          command: "SEND_MESSAGE",
          payload: JSON.stringify({ phone: conv.contact.phone, text: content.trim() }),
        },
      });
    }

    return NextResponse.json({ success: true, message });
  } catch (error) {
    return NextResponse.json({ error: "Error enviando mensaje" }, { status: 500 });
  }
}
