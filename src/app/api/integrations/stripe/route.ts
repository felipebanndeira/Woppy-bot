import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

export async function POST(request: NextRequest) {
  try {
    const { apiKey, defaultDeposit } = await request.json();

    if (!apiKey || (!apiKey.startsWith("rk_") && !apiKey.startsWith("sk_"))) {
      return NextResponse.json(
        { error: "Clave de Stripe no válida. Debe comenzar por rk_ o sk_" },
        { status: 400 }
      );
    }

    const isTestMode = apiKey.includes("_test_");

    // Verificar la clave con Stripe
    const stripe = new Stripe(apiKey);
    await stripe.balance.retrieve();

    const encryptedKey = encrypt(apiKey);

    await prisma.integration.upsert({
      where: { provider: "STRIPE" },
      update: {
        status: "CONNECTED",
        accountEmailOrId: isTestMode ? "Modo de Prueba (Test)" : "Modo Producción (Live)",
        encryptedAccessToken: encryptedKey,
        config: JSON.stringify({ defaultDeposit: Number(defaultDeposit) || 20, isTestMode }),
        errorMessage: null,
      },
      create: {
        provider: "STRIPE",
        status: "CONNECTED",
        accountEmailOrId: isTestMode ? "Modo de Prueba (Test)" : "Modo Producción (Live)",
        encryptedAccessToken: encryptedKey,
        config: JSON.stringify({ defaultDeposit: Number(defaultDeposit) || 20, isTestMode }),
      },
    });

    await prisma.activityLog.create({
      data: {
        action: `Stripe conectado (${isTestMode ? "Test Mode" : "Live Mode"})`,
        result: "SUCCESS",
      },
    });

    return NextResponse.json({ success: true, isTestMode });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Clave de Stripe no válida o rechazada por la API: " + error.message },
      { status: 400 }
    );
  }
}
