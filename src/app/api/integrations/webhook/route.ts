import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

export async function POST(request: NextRequest) {
  try {
    const { targetUrl, secret, events, test } = await request.json();

    if (!targetUrl || !targetUrl.startsWith("http")) {
      return NextResponse.json({ error: "URL de destino no válida" }, { status: 400 });
    }

    if (test) {
      // Enviar evento de prueba firmado con HMAC-SHA256
      const payload = {
        event: "test_event",
        timestamp: new Date().toISOString(),
        data: { message: "Prueba de webhook desde Atiende para n8n/Make/Zapier" },
      };
      const bodyStr = JSON.stringify(payload);
      const signature = crypto
        .createHmac("sha256", secret || "default_secret")
        .update(bodyStr)
        .digest("hex");

      const testRes = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Atiende-Signature": signature,
        },
        body: bodyStr,
      });

      return NextResponse.json({
        success: true,
        httpStatus: testRes.status,
        message: `Evento de prueba enviado (HTTP ${testRes.status})`,
      });
    }

    await prisma.integration.upsert({
      where: { provider: "WEBHOOK" },
      update: {
        status: "CONNECTED",
        accountEmailOrId: targetUrl,
        encryptedAccessToken: encrypt(secret || ""),
        config: JSON.stringify({ events: events || ["conversation.new", "appointment.created"] }),
      },
      create: {
        provider: "WEBHOOK",
        status: "CONNECTED",
        accountEmailOrId: targetUrl,
        encryptedAccessToken: encrypt(secret || ""),
        config: JSON.stringify({ events: events || ["conversation.new", "appointment.created"] }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al configurar webhook" }, { status: 500 });
  }
}
