import OpenAI from "openai";
import { prisma } from "../prisma";
import { getAvailableTools, executeToolCall, ToolExecutionResult } from "./tools";

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: any[];
}

export interface AssistantResponse {
  content: string;
  toolExecutions: ToolExecutionResult[];
  usedModel: string;
  isFallback: boolean;
}

/**
 * Motor central de IA de Atiende.
 * Envía la conversación a OpenRouter con soporte completo de tools, reintentos y fallback defensivo.
 */
export async function runAssistantChat(options: {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  contactId?: string;
  conversationId?: string;
  safeModeOverride?: boolean;
}): Promise<AssistantResponse> {
  const { messages: incomingHistory, contactId, conversationId, safeModeOverride } = options;

  const [business, assistant] = await Promise.all([
    prisma.businessProfile.findFirst(),
    prisma.assistantSettings.findFirst(),
  ]);

  if (!business || !assistant) {
    throw new Error("No se encontró la configuración del negocio ni del asistente");
  }

  const safeMode = safeModeOverride ?? assistant.safeMode;
  const preferredModel = assistant.selectedModel || "anthropic/claude-haiku-5.5";
  const defaultModel = "anthropic/claude-haiku-5.5";
  const apiKey = process.env.OPENROUTER_API_KEY;

  // 1. Ensamblar Prompt del Sistema
  const nowBsAs = new Intl.DateTimeFormat("es-AR", {
    timeZone: business.timeZone || "America/Argentina/Buenos_Aires",
    dateStyle: "full",
    timeStyle: "medium",
  }).format(new Date());

  let forbiddenList: string[] = [];
  try {
    forbiddenList = JSON.parse(assistant.forbiddenRules || "[]");
  } catch {}

  const systemPrompt = `ERES LA ASISTENTE VIRTUAL OFICIAL DE «${business.name.toUpperCase()}».
Actividad: ${business.activity}
Ubicación: ${business.address}
WhatsApp oficial: ${business.phone}
Sitio web oficial: ${business.website}
Días y horarios de atención: Lunes a Sábados de 07:00 a 22:30 hs (con turnos previamente coordinados). Domingos cerrado.
Fecha y hora actual (Argentina): ${nowBsAs}

IDENTIDAD Y TONO:
- Tu nombre: ${assistant.name}
- Tono: ${assistant.tone}
- En el primer mensaje siempre te presentas con calidez como asistente virtual de ${business.name}.
- Habla en español argentino cercano, empático, femenino y natural (usando emojis sutiles como ✨, 💅, 🌸).
- Tu objetivo es informar exclusivamente sobre los servicios de UÑAS (Semipermanente, Kapping Gel, Soft Gel, Retirados, Pies). IMPORTANTE: Por el momento NO se realizan servicios de pestañas ni lifting; si preguntan por pestañas, aclara amablemente que por ahora no se están realizando, responder dudas, explicar cómo abonar la seña (Alias: celene..65 - Titular: Caceres Celene Yoselin) y ayudar a coordinar turnos.

REGLAS OBLIGATORIAS:
- No inventes precios ni promociones que no estén en tu base de datos o herramientas.
- Si una clienta quiere enviar una foto o diseño de referencia de nail art, infórmale que puede enviarla con total confianza para que Celene la revise.
- Si te piden hablar con Celene directamente o tienen alguna queja o situación particular, activa la derivación a humano (handoff_to_human).
- ANTES de agendar o confirmar un turno, confirma siempre el nombre de la clienta, el servicio específico y la fecha y hora elegida.
- Límites prohibidos:
${forbiddenList.map((r, i) => `  * ${r}`).join("\n")}

MODO SEGURO ACTIVO: ${safeMode ? "SÍ (todas las acciones que crean citas o modifican registros se simularán)" : "NO"}`;

  // 2. Si no hay API key configurada, responder con motor inteligente local para pruebas
  if (!apiKey) {
    return runSimulatedLocalChat(incomingHistory, systemPrompt, {
      businessId: business.id,
      contactId,
      conversationId,
      safeMode,
    });
  }

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    defaultHeaders: {
      "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
      "X-Title": "Atiende",
    },
  });

  const tools = await getAvailableTools(business.id);

  // Limitar contexto a los últimos 20 mensajes
  const historySlice = incomingHistory.slice(-20);
  const conversationMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...historySlice,
  ];

  let toolExecutions: ToolExecutionResult[] = [];
  let currentModel = preferredModel;
  let isFallback = false;
  let attempts = 0;

  while (attempts < 2) {
    try {
      attempts++;
      let toolIterationCount = 0;
      const MAX_TOOL_ITERATIONS = 5;

      while (toolIterationCount < MAX_TOOL_ITERATIONS) {
        toolIterationCount++;

        const response = await openai.chat.completions.create({
          model: currentModel,
          messages: conversationMessages as any,
          tools: tools.length > 0 ? tools : undefined,
          tool_choice: "auto",
          temperature: 0.3,
        });

        const choice = response.choices[0];
        const message = choice?.message;

        if (!message) break;

        // Si el modelo solicitó llamar a herramientas (tool_calls)
        if (message.tool_calls && message.tool_calls.length > 0) {
          conversationMessages.push(message as any);

          for (const tc of message.tool_calls as any[]) {
            const funcName = tc.function?.name;
            let args: any = {};
            try {
              args = JSON.parse(tc.function?.arguments || "{}");
            } catch {
              args = {};
            }

            // Ejecución de la herramienta
            const execResult = await executeToolCall(funcName, args, {
              businessId: business.id,
              contactId,
              conversationId,
              safeMode,
            });

            toolExecutions.push(execResult);

            // Registro en tabla de Actividad
            await prisma.activityLog.create({
              data: {
                action: `Herramienta ejecutada: ${funcName}`,
                details: JSON.stringify({ args, summary: execResult.uiTimelineSummary }),
                result: "SUCCESS",
              },
            });

            // Devolver resultado de la herramienta al contexto del LLM
            conversationMessages.push({
              role: "tool",
              tool_call_id: tc.id,
              content: JSON.stringify(execResult.output),
            });
          }
        } else {
          // El modelo terminó y devolvió la respuesta de texto final al cliente
          const finalContent = message.content || "Entendido. ¿En qué más puedo ayudarte hoy?";
          return {
            content: finalContent,
            toolExecutions,
            usedModel: currentModel,
            isFallback,
          };
        }
      }

      break;
    } catch (error: any) {
      console.warn(`Error llamando a modelo ${currentModel}:`, error?.message);

      // Si falla el modelo elegido y es diferente al modelo por defecto, reintentar una vez con anthropic/claude-haiku-5.5
      if (currentModel !== defaultModel && attempts === 1) {
        currentModel = defaultModel;
        isFallback = true;

        await prisma.activityLog.create({
          data: {
            action: "Fallo de modelo - Reintento con modelo por defecto",
            details: JSON.stringify({
              failedModel: preferredModel,
              fallbackModel: defaultModel,
              error: error?.message,
            }),
            result: "WARNING",
          },
        });
      } else {
        // Fallback al simulador local
        return runSimulatedLocalChat(incomingHistory, systemPrompt, {
          businessId: business.id,
          contactId,
          conversationId,
          safeMode,
        });
      }
    }
  }

  return {
    content: "He procesado tu consulta. ¿Deseas agendar o consultar algo más sobre nuestros tratamientos?",
    toolExecutions,
    usedModel: currentModel,
    isFallback,
  };
}

/**
 * Simulador local inteligente con function-calling nativo para cuando no se haya suministrado la API Key todavía.
 */
async function runSimulatedLocalChat(
  history: Array<{ role: string; content: string }>,
  systemPrompt: string,
  options: {
    businessId: string;
    contactId?: string;
    conversationId?: string;
    safeMode: boolean;
  }
): Promise<AssistantResponse> {
  const lastMsg = history[history.length - 1]?.content?.toLowerCase() || "";
  const toolExecutions: ToolExecutionResult[] = [];

  let reply = "";

  if (lastMsg.includes("turno") || lastMsg.includes("cita") || lastMsg.includes("reservar") || lastMsg.includes("horario") || lastMsg.includes("disponibilidad")) {
    const checkSlots = await executeToolCall(
      "check_available_slots",
      { date: "2026-11-03", serviceName: "Semi o Kapping" },
      options
    );
    toolExecutions.push(checkSlots);

    reply = `¡Hola hermosa! ✨ Sí, tenemos turnos disponibles de lunes a sábado. Para reservar tu turno te pedimos una seña previa al alias: celene..65 (Titular: Caceres Celene Yoselin). ¿Qué día y horario te quedaría más cómodo acercarte?`;
  } else if (lastMsg.includes("precio") || lastMsg.includes("cuanto") || lastMsg.includes("sale") || lastMsg.includes("kapping") || lastMsg.includes("semi") || lastMsg.includes("soft") || lastMsg.includes("pestaña") || lastMsg.includes("foxy") || lastMsg.includes("lifting") || lastMsg.includes("servicio")) {
    const sResult = await executeToolCall(
      "consult_services_and_prices",
      { query: "" },
      options
    );
    toolExecutions.push(sResult);

    reply = `¡Hola! 💅✨ Con mucho gusto te cuento nuestros precios en Wopyy:

🌸 UÑAS:
• Semipermanentes: $13.000 (con diseño $15.000)
• Kapping Liso: $15.000 (con diseño $17.000)
• Soft Gel: $20.000 (con diseño $23.000)
• Semi en Pies: $13.000 / Kapping en Pies: $15.000

✨ PESTAÑAS:
• Clásicas: $25.000
• Volumen Medio: $30.000
• Efecto Lifting: $35.000
• Efecto Foxy: $40.000

¿Te gustaría coordinar un turno para alguna de estas opciones?`;
  } else if (lastMsg.includes("queja") || lastMsg.includes("celene") || lastMsg.includes("humano") || lastMsg.includes("persona") || lastMsg.includes("hablar")) {
    const handoff = await executeToolCall(
      "handoff_to_human",
      { reason: "human_requested", summary: "Clienta solicita comunicarse con Celene" },
      options
    );
    toolExecutions.push(handoff);

    reply = `¡Claro que sí! Ya le aviso a Celene para que se ponga en contacto con vos directamente por este medio. También podés escribirnos al WhatsApp oficial (+54 9 3755 65-8105). ✨`;
  } else {
    reply = `¡Hola! 💅✨ Bienvenida a Wopyy Nails & Lashes. Soy tu asistente virtual. ¿En qué te puedo ayudar hoy? Te puedo contar sobre nuestros servicios de uñas (Semi, Kapping, Soft Gel), precios o ayudarte a coordinar tu turno, precios o ayudarte a coordinar tu turno.`;
  }

  return {
    content: reply,
    toolExecutions,
    usedModel: "anthropic/claude-haiku-5.5 (Simulador Local)",
    isFallback: false,
  };
}
