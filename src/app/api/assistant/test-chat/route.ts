import { NextRequest, NextResponse } from "next/server";
import { runAssistantChat } from "@/lib/assistant/chatEngine";

export async function POST(request: NextRequest) {
  try {
    const { messages, safeMode } = await request.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Mensajes requeridos" }, { status: 400 });
    }

    const result = await runAssistantChat({
      messages,
      safeModeOverride: Boolean(safeMode),
    });

    return NextResponse.json({
      success: true,
      message: {
        role: "assistant",
        content: result.content,
      },
      toolExecutions: result.toolExecutions,
      usedModel: result.usedModel,
      isFallback: result.isFallback,
    });
  } catch (error: any) {
    console.error("Error en /api/assistant/test-chat:", error);
    return NextResponse.json(
      { error: error.message || "Error procesando mensaje en simulador" },
      { status: 500 }
    );
  }
}
