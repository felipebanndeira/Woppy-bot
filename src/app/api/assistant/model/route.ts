import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  try {
    const { modelId, inputCost, outputCost } = await request.json();
    const assistant = await prisma.assistantSettings.findFirst();

    if (!assistant) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const updated = await prisma.assistantSettings.update({
      where: { id: assistant.id },
      data: {
        selectedModel: modelId,
        inputTokensCost: Number(inputCost) || 0.8,
        outputTokensCost: Number(outputCost) || 4.0,
      },
    });

    return NextResponse.json({ success: true, assistant: updated });
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar modelo" }, { status: 500 });
  }
}
