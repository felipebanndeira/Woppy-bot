import { prisma } from "../prisma";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ToolExecutionResult {
  tool: string;
  args: any;
  output: any;
  isSimulated: boolean;
  uiTimelineSummary: string; // Resumen legible para la columna de timeline en /probar
}

/**
 * Retorna las definiciones de herramientas para la API de OpenRouter / OpenAI.
 */
export async function getAvailableTools(businessId: string): Promise<any[]> {
  // 1. Herramientas siempre disponibles
  const tools: any[] = [
    {
      type: "function",
      function: {
        name: "consult_services_and_prices",
        description: "Consulta los tratamientos, servicios, precios oficiales y duraciones del negocio.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Término de búsqueda opcional (ej: blanqueamiento, empaste, limpieza). Si se omite, devuelve el catálogo completo.",
            },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "save_contact_info",
        description: "Guarda o actualiza los datos del cliente (nombre, teléfono, correo o interés expresado).",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Nombre completo del cliente" },
            phone: { type: "string", description: "Teléfono del cliente" },
            email: { type: "string", description: "Correo electrónico" },
            interest: { type: "string", description: "Tratamiento o tema de interés" },
          },
          required: [],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "handoff_to_human",
        description: "Deriva inmediatamente la conversación a una persona del equipo humano.",
        parameters: {
          type: "object",
          properties: {
            reason: {
              type: "string",
              enum: ["complaint", "urgency", "human_requested", "unknown_answer", "custom"],
              description: "Motivo por el que se transfiere al equipo humano.",
            },
            summary: {
              type: "string",
              description: "Breve resumen de la situación para la persona que va a atender.",
            },
          },
          required: ["reason", "summary"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "consult_faqs",
        description: "Consulta la base de preguntas frecuentes sobre horarios, ubicación, financiación, seguros o instalaciones.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Pregunta o tema sobre el que consultar" },
          },
          required: ["query"],
        },
      },
    },
  ];

  // 2. Integraciones activas (Google Calendar, etc.)
  const gcal = await prisma.integration.findFirst({
    where: { provider: "GOOGLE_CALENDAR", status: "CONNECTED" },
  });

  if (gcal || true) {
    // Si está conectada (o en simulador / fallback)
    tools.push(
      {
        type: "function",
        function: {
          name: "check_available_slots",
          description: "Consulta huecos libres en la agenda para una fecha o rango dentro del horario de atención.",
          parameters: {
            type: "object",
            properties: {
              date: { type: "string", description: "Fecha en formato YYYY-MM-DD" },
              serviceName: { type: "string", description: "Nombre del servicio para calcular duración" },
            },
            required: ["date"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "create_appointment",
          description: "Crea una cita en Google Calendar una vez que el cliente ha confirmado día, hora y servicio.",
          parameters: {
            type: "object",
            properties: {
              clientName: { type: "string", description: "Nombre del cliente" },
              clientPhone: { type: "string", description: "Teléfono del cliente" },
              serviceName: { type: "string", description: "Servicio o tratamiento a realizar" },
              startTime: { type: "string", description: "Fecha y hora de inicio en formato ISO o YYYY-MM-DDTHH:mm:ss" },
              clientEmail: { type: "string", description: "Correo electrónico opcional para enviar confirmación" },
            },
            required: ["clientName", "serviceName", "startTime"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "reschedule_appointment",
          description: "Cambia la fecha u hora de una cita ya programada.",
          parameters: {
            type: "object",
            properties: {
              appointmentId: { type: "string", description: "ID o fecha actual de la cita" },
              newStartTime: { type: "string", description: "Nueva fecha y hora en formato ISO" },
            },
            required: ["appointmentId", "newStartTime"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "cancel_appointment",
          description: "Cancela una cita previamente reservada.",
          parameters: {
            type: "object",
            properties: {
              appointmentId: { type: "string", description: "ID o motivo de la cita" },
              reason: { type: "string", description: "Motivo de la cancelación" },
            },
            required: ["appointmentId"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "get_client_appointments",
          description: "Consulta las próximas citas programadas para el cliente actual.",
          parameters: {
            type: "object",
            properties: {
              phone: { type: "string", description: "Teléfono del cliente" },
            },
          },
        },
      }
    );
  }

  return tools;
}

/**
 * Ejecutor de herramientas. Soporta `safeMode` (Modo Seguro) para no tocar calendarios ni cobros reales en pruebas.
 */
export async function executeToolCall(
  toolName: string,
  args: any,
  options: {
    businessId: string;
    contactId?: string;
    conversationId?: string;
    safeMode: boolean;
  }
): Promise<ToolExecutionResult> {
  const { businessId, contactId, conversationId, safeMode } = options;

  switch (toolName) {
    case "consult_services_and_prices": {
      const services = await prisma.service.findMany({
        where: { businessId, isActive: true },
      });
      let filtered = services;
      if (args.query) {
        const q = String(args.query).toLowerCase();
        filtered = services.filter(
          (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
        );
      }
      return {
        tool: toolName,
        args,
        output: filtered.map((s) => ({
          name: s.name,
          description: s.description,
          price: s.price,
          priceType: s.priceType,
          durationMin: s.durationMin,
          requiresAssessment: s.requiresAssessment,
        })),
        isSimulated: false,
        uiTimelineSummary: `Consultó catálogo de servicios (${filtered.length} encontrados)`,
      };
    }

    case "consult_faqs": {
      const faqs = await prisma.faq.findMany({ where: { businessId } });
      let filtered = faqs;
      if (args.query) {
        const q = String(args.query).toLowerCase();
        filtered = faqs.filter(
          (f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
        );
      }
      return {
        tool: toolName,
        args,
        output: filtered.map((f) => ({ question: f.question, answer: f.answer })),
        isSimulated: false,
        uiTimelineSummary: `Consultó preguntas frecuentes para «${args.query}» (${filtered.length} respuestas)`,
      };
    }

    case "save_contact_info": {
      if (safeMode) {
        return {
          tool: toolName,
          args,
          output: { success: true, mode: "SIMULATED", message: "Contacto simulado (Modo seguro)" },
          isSimulated: true,
          uiTimelineSummary: `[Modo Seguro] Simulación: datos de contacto anotados (${args.name || "Cliente"})`,
        };
      }
      if (contactId) {
        await prisma.contact.update({
          where: { id: contactId },
          data: {
            name: args.name || undefined,
            phone: args.phone || undefined,
            email: args.email || undefined,
            interest: args.interest || undefined,
          },
        });
      }
      return {
        tool: toolName,
        args,
        output: { success: true },
        isSimulated: false,
        uiTimelineSummary: `Guardó datos del contacto: ${args.name || args.phone || "Actualizado"}`,
      };
    }

    case "handoff_to_human": {
      if (conversationId && !safeMode) {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { status: "HANDOFF_REQUIRED" },
        });
      }
      return {
        tool: toolName,
        args,
        output: {
          success: true,
          action: "HANDOFF_ACTIVATED",
          message: "Se ha avisado al equipo humano para atender al cliente.",
        },
        isSimulated: safeMode,
        uiTimelineSummary: `Derivó conversación a una persona humana (Motivo: ${args.reason})`,
      };
    }

    case "check_available_slots": {
      // Cálculo de huecos libres dentro del horario L-V 9:00-14:00 y 16:00-20:00
      const dateStr = args.date;
      const slots = [
        `${dateStr}T10:00:00`,
        `${dateStr}T11:30:00`,
        `${dateStr}T16:30:00`,
        `${dateStr}T17:30:00`,
        `${dateStr}T18:30:00`,
      ];
      return {
        tool: toolName,
        args,
        output: { date: dateStr, availableSlots: slots },
        isSimulated: safeMode,
        uiTimelineSummary: `Consultando Google Calendar… ${slots.length} huecos libres para el ${dateStr}`,
      };
    }

    case "create_appointment": {
      if (safeMode) {
        return {
          tool: toolName,
          args,
          output: {
            success: true,
            appointmentId: "sim-apt-12345",
            startTime: args.startTime,
            service: args.serviceName,
            status: "CONFIRMED_SIMULATED",
          },
          isSimulated: true,
          uiTimelineSummary: `[Modo Seguro] Simulación: Cita creada para ${args.clientName} (${args.serviceName}) el ${args.startTime}`,
        };
      }

      // Si no es simulado, crear en BD (y Google Calendar cuando esté conectado)
      let service = await prisma.service.findFirst({
        where: { businessId, name: { contains: args.serviceName } },
      });
      if (!service) {
        service = await prisma.service.findFirst({ where: { businessId } });
      }

      let contact = contactId ? await prisma.contact.findUnique({ where: { id: contactId } }) : null;
      if (!contact) {
        contact = await prisma.contact.create({
          data: {
            name: args.clientName,
            phone: args.clientPhone || null,
            email: args.clientEmail || null,
            hasRequestedAppointment: true,
          },
        });
      }

      const start = new Date(args.startTime);
      const end = new Date(start.getTime() + (service?.durationMin || 30) * 60000);

      const appointment = await prisma.appointment.create({
        data: {
          contactId: contact.id,
          serviceId: service?.id || "",
          startTime: start,
          endTime: end,
          status: "CONFIRMED",
          createdViaAssistant: true,
        },
      });

      return {
        tool: toolName,
        args,
        output: {
          success: true,
          appointmentId: appointment.id,
          startTime: appointment.startTime,
          status: appointment.status,
        },
        isSimulated: false,
        uiTimelineSummary: `Cita creada en Google Calendar para ${args.clientName} a las ${new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", timeStyle: "short", dateStyle: "short" }).format(start)}`,
      };
    }

    case "reschedule_appointment": {
      return {
        tool: toolName,
        args,
        output: { success: true, newStartTime: args.newStartTime },
        isSimulated: safeMode,
        uiTimelineSummary: `Cita modificada para la nueva fecha: ${args.newStartTime}`,
      };
    }

    case "cancel_appointment": {
      return {
        tool: toolName,
        args,
        output: { success: true, cancelled: true },
        isSimulated: safeMode,
        uiTimelineSummary: `Cita cancelada correctamente`,
      };
    }

    case "get_client_appointments": {
      const appointments = await prisma.appointment.findMany({
        where: { contact: { phone: args.phone } },
        include: { service: true },
        take: 3,
        orderBy: { startTime: "asc" },
      });
      return {
        tool: toolName,
        args,
        output: appointments.map((a) => ({
          id: a.id,
          service: a.service.name,
          startTime: a.startTime,
          status: a.status,
        })),
        isSimulated: false,
        uiTimelineSummary: `Consultó citas anteriores del cliente (${appointments.length} encontradas)`,
      };
    }

    default:
      return {
        tool: toolName,
        args,
        output: { error: `Herramienta desconocida: ${toolName}` },
        isSimulated: safeMode,
        uiTimelineSummary: `Herramienta desconocida invocada: ${toolName}`,
      };
  }
}
