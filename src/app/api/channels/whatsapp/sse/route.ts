import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendStatus = async () => {
        try {
          const wa = await prisma.channelSettings.findUnique({
            where: { channel: "WHATSAPP" },
          });

          const data = JSON.stringify({
            status: wa?.connectionStatus || "DISCONNECTED",
            qrCode: wa?.qrCode || null,
            connectedNumber: wa?.connectedNumber || null,
            timestamp: Date.now(),
          });

          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch (e) {
          // Ignorar
        }
      };

      await sendStatus();
      const interval = setInterval(sendStatus, 3000);

      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
