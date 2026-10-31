import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || !url.startsWith("http")) {
      return NextResponse.json(
        { error: "Proporciona una URL válida que empiece por http:// o https://" },
        { status: 400 }
      );
    }

    const targetUrl = new URL(url);
    const domain = targetUrl.origin;

    // 1. Descargar página principal
    console.log(`🌐 Descargando web principal: ${url}`);
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) {
      throw new Error(`No se pudo acceder a la web (HTTP ${res.status})`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Extraer enlaces internos interesantes (servicios, tarifas, precios, contacto, tratamientos)
    const subLinks = new Set<string>();
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;

      try {
        const fullUrl = new URL(href, domain);
        if (fullUrl.origin === domain && subLinks.size < 4) {
          const path = fullUrl.pathname.toLowerCase();
          if (
            path.includes("servicio") ||
            path.includes("tratamiento") ||
            path.includes("precio") ||
            path.includes("tarifa") ||
            path.includes("contacto") ||
            path.includes("horario") ||
            path.includes("faq")
          ) {
            subLinks.add(fullUrl.toString());
          }
        }
      } catch {}
    });

    let combinedText = `--- PÁGINA PRINCIPAL (${url}) ---\n` + $("body").text().replace(/\s+/g, " ").slice(0, 5000);

    // Descargar hasta 4 subpáginas
    for (const subUrl of Array.from(subLinks)) {
      try {
        console.log(`📥 Descargando subpágina: ${subUrl}`);
        const subRes = await fetch(subUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (subRes.ok) {
          const subHtml = await subRes.text();
          const sub$ = cheerio.load(subHtml);
          combinedText += `\n\n--- SUBPÁGINA (${subUrl}) ---\n` + sub$("body").text().replace(/\s+/g, " ").slice(0, 4000);
        }
      } catch (err) {
        console.warn(`Error al descargar ${subUrl}`, err);
      }
    }

    // 2. Extracción estructurada con el modelo de OpenRouter
    const apiKey = process.env.OPENROUTER_API_KEY;
    const assistant = await prisma.assistantSettings.findFirst();
    const model = assistant?.selectedModel || "anthropic/claude-haiku-5.5";

    let extractedData = null;

    if (apiKey) {
      const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey,
        defaultHeaders: {
          "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
          "X-Title": "Atiende",
        },
      });

      const prompt = `Analiza el siguiente contenido extraído de la web de un negocio y extrae la información en un formato JSON estricto con el siguiente esquema:

{
  "business": {
    "name": "Nombre de la empresa",
    "activity": "A qué se dedica",
    "address": "Dirección física completa si aparece",
    "phone": "Teléfono si aparece",
    "website": "${url}",
    "generalInfo": "Resumen conciso del negocio"
  },
  "services": [
    {
      "name": "Nombre del servicio",
      "description": "Breve descripción",
      "durationMin": 30,
      "price": 0,
      "priceType": "exacto o desde",
      "requiresAssessment": false
    }
  ],
  "faqs": [
    {
      "question": "Pregunta frecuente extraída o deducida",
      "answer": "Respuesta clara",
      "category": "Categoría (General, Precios, etc.)"
    }
  ]
}

IMPORTANTE: Responde ÚNICAMENTE con el bloque JSON válido, sin texto adicional ni markdown.

CONTENIDO DE LA WEB:
${combinedText.slice(0, 12000)}`;

      const completion = await openai.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      });

      const raw = completion.choices[0]?.message?.content || "{}";
      const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
      extractedData = JSON.parse(cleaned);
    } else {
      // Fallback si todavía no se ha configurado la API Key de OpenRouter
      extractedData = {
        business: {
          name: $("title").text().trim() || "Negocio Extraído",
          activity: "Servicios profesionales",
          address: "Dirección extraída",
          phone: "+34 900 000 000",
          website: url,
          generalInfo: "Información extraída de la web del negocio.",
        },
        services: [
          {
            name: "Consulta inicial",
            description: "Primera toma de contacto y evaluación",
            durationMin: 30,
            price: 0,
            priceType: "exacto",
            requiresAssessment: false,
          },
        ],
        faqs: [
          {
            question: "¿Cómo puedo solicitar cita?",
            answer: "Puedes reservar a través de nuestro asistente virtual o llamando por teléfono.",
            category: "General",
          },
        ],
      };
    }

    return NextResponse.json({ success: true, data: extractedData });
  } catch (error: any) {
    console.error("Error al importar web:", error);
    return NextResponse.json(
      { error: error.message || "Error al procesar la página web" },
      { status: 500 }
    );
  }
}
