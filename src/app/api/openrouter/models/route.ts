import { NextRequest, NextResponse } from "next/server";

// Caché en memoria de modelos durante 1 hora
let cachedModels: any[] | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora

export async function GET(request: NextRequest) {
  try {
    const force = request.nextUrl.searchParams.get("force") === "true";
    const now = Date.now();

    if (!force && cachedModels && now - lastCacheTime < CACHE_DURATION) {
      return NextResponse.json({ models: cachedModels, cached: true });
    }

    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        "User-Agent": "Atiende/1.0",
      },
    });

    if (!res.ok) {
      throw new Error(`Error en OpenRouter API: ${res.status}`);
    }

    const data = await res.json();
    const allModels: any[] = data.data || [];

    // Filtrar estrictamente solo los modelos que soportan llamadas a herramientas ("tools")
    const filtered = allModels
      .filter((m) => {
        const supported = m.supported_parameters || [];
        return supported.includes("tools");
      })
      .map((m) => {
        const promptPricePerToken = parseFloat(m.pricing?.prompt || "0");
        const completionPricePerToken = parseFloat(m.pricing?.completion || "0");

        // Convertir a dólares por millón de tokens
        const promptPerMillion = Math.round(promptPricePerToken * 1_000_000 * 100) / 100;
        const completionPerMillion = Math.round(completionPricePerToken * 1_000_000 * 100) / 100;

        // Extraer proveedor a partir del prefijo del ID (ej: anthropic/claude -> Anthropic)
        const parts = m.id.split("/");
        const provider = parts.length > 1 ? parts[0] : "openrouter";

        return {
          id: m.id,
          name: m.name || m.id,
          provider: provider.charAt(0).toUpperCase() + provider.slice(1),
          promptPrice: promptPerMillion,
          completionPrice: completionPerMillion,
          contextLength: m.context_length || 0,
          isFree: promptPerMillion === 0 && completionPerMillion === 0,
        };
      });

    cachedModels = filtered;
    lastCacheTime = now;

    return NextResponse.json({ models: filtered, cached: false });
  } catch (error: any) {
    console.error("Error al obtener modelos de OpenRouter:", error);
    // En caso de fallo devolvemos modelos esenciales
    const fallbackModels = [
      {
        id: "anthropic/claude-haiku-5.5",
        name: "Claude Haiku 3.5",
        provider: "Anthropic",
        promptPrice: 0.8,
        completionPrice: 4.0,
        contextLength: 200000,
        isFree: false,
      },
      {
        id: "anthropic/claude-3.5-sonnet",
        name: "Claude 3.5 Sonnet",
        provider: "Anthropic",
        promptPrice: 3.0,
        completionPrice: 15.0,
        contextLength: 200000,
        isFree: false,
      },
      {
        id: "openai/gpt-4o-mini",
        name: "GPT-4o Mini",
        provider: "OpenAI",
        promptPrice: 0.15,
        completionPrice: 0.6,
        contextLength: 128000,
        isFree: false,
      },
      {
        id: "google/gemini-2.0-flash-001",
        name: "Gemini 2.0 Flash",
        provider: "Google",
        promptPrice: 0.1,
        completionPrice: 0.4,
        contextLength: 1000000,
        isFree: false,
      },
    ];
    return NextResponse.json({ models: fallbackModels, cached: false, fallback: true });
  }
}
