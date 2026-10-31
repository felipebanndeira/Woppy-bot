import { NextRequest, NextResponse } from "next/server";
import { IncomingWebhook } from "@slack/webhook";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

export async function POST(request: NextRequest) {
  try {
    const { webhookUrl, test } = await request.json();

    if (!webhookUrl || !webhookUrl.startsWith("https://hooks.slack.com/")) {
      return NextResponse.json(
        { error: "URL de Slack Webhook no válida. Debe comenzar por https://hooks.slack.com/" },
        { status: 400 }
      );
    }

    if (test) {
      // Enviar mensaje de prueba real a Slack
      const webhook = new IncomingWebhook(webhookUrl);
      await webhook.send({
        text: "👋 ¡Hola desde *Atiende*! Tu integración con Slack está funcionando correctamente para el equipo.",
      });

      return NextResponse.json({ success: true, message: "Mensaje de prueba enviado a Slack" });
    }

    // Guardar integración
    const encryptedUrl = encrypt(webhookUrl);
    await prisma.integration.upsert({
      where: { provider: "SLACK" },
      update: {
        status: "CONNECTED",
        accountEmailOrId: "Canal de Slack",
        encryptedAccessToken: encryptedUrl,
        errorMessage: null,
      },
      create: {
        provider: "SLACK",
        status: "CONNECTED",
        accountEmailOrId: "Canal de Slack",
        encryptedAccessToken: encryptedUrl,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: "Slack conectado",
        result: "SUCCESS",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al conectar Slack" }, { status: 500 });
  }
}
