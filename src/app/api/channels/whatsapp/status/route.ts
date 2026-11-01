import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const wa = await prisma.channelSettings.findUnique({
      where: { channel: "WHATSAPP" },
    });

    return NextResponse.json({
      status: wa?.connectionStatus || "DISCONNECTED",
      qrCode: wa?.qrCode || null,
      connectedNumber: wa?.connectedNumber || null,
      updatedAt: wa?.updatedAt || null,
    });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
