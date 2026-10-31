import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runAssistantChat } from "@/lib/assistant/chatEngine";

export async function POST(request: NextRequest) {
  try {
    const { message, contactId, conversationId } = await request.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
    }

    // 1. Obtener o crear contacto web
    let contact = contactId ? await prisma.contact.findUnique({ where: { id: contactId } }) : null;
    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          name: "Visitante Web",
          channel: "WEB",
        },
      });
    }

    // 2. Obtener o crear conversación
    let conv = conversationId ? await prisma.conversation.findUnique({ where: { id: conversationId } }) : null;
    if (!conv) {
      conv = await prisma.conversation.create({
        data: {
          contactId: contact.id,
          channel: "WEB",
          status: "ACTIVE",
        },
      });
    }

    // 3. Guardar mensaje del cliente
    await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderType: "CLIENT",
        content: message.trim(),
      },
    });

    // 4. Obtener historial para la IA
    const history = await prisma.message.findMany({
      where: { conversationId: conv.id },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    const formattedHistory = history.map((h) => ({
      role: h.senderType === "CLIENT" ? ("user" as const) : ("assistant" as const),
      content: h.content,
    }));

    // 5. Ejecutar motor de IA
    const response = await runAssistantChat({
      messages: formattedHistory,
      contactId: contact.id,
      conversationId: conv.id,
    });

    // 6. Guardar respuesta del asistente
    const assistantMsg = await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderType: "ASSISTANT",
        content: response.content,
        toolCalls: JSON.stringify(response.toolExecutions),
      },
    });

    await prisma.conversation.update({
      where: { id: conv.id },
      data: { lastMessageAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      reply: response.content,
      contactId: contact.id,
      conversationId: conv.id,
    });
  } catch (error: any) {
    console.error("Error en chat web:", error);
    return NextResponse.json({ error: error.message || "Error procesando chat" }, { status: 500 });
  }
}
