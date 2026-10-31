import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

export async function seedDemoData() {
  console.log("🌱 Iniciando adaptación e inicialización de datos para WOPYY...");

  // 1. Administrador inicial
  const adminEmail = process.env.ADMIN_EMAIL || "admin@wopyy.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "AdminSeguro123!";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: "Celene Yoselin Caceres (Wopyy)",
        role: "ADMIN",
      },
    });
    console.log(`✅ Administrador creado con éxito: ${adminEmail}`);
  } else {
    console.log(`ℹ️ El administrador ya existe: ${adminEmail}`);
  }

  // 2. Branding de la agencia
  const branding = await prisma.agencyBranding.findFirst();
  if (!branding) {
    await prisma.agencyBranding.create({
      data: {
        agencyName: "Wopyy Nails & Lashes",
        agencyLogo: null,
      },
    });
  } else {
    await prisma.agencyBranding.update({
      where: { id: branding.id },
      data: { agencyName: "Wopyy Nails & Lashes" },
    });
  }
  console.log("✅ Branding de Wopyy actualizado");

  // 3. Perfil de Negocio: Wopyy Nails & Lashes
  let business = await prisma.businessProfile.findFirst({
    where: { name: { contains: "Wopyy" } },
  });

  const businessData = {
    name: "Wopyy Nails & Lashes",
    activity: "Estudio de estética profesional especializado en Uñas esculpidas, Kapping, Soft Gel y Extensiones de Pestañas",
    address: "Oberá / Misiones, Argentina",
    phone: "+54 9 3755 65-8105",
    website: "https://wopyy-70cb0.web.app",
    timeZone: "America/Argentina/Buenos_Aires",
    generalInfo:
      "Wopyy Nails & Lashes es un estudio de belleza y estética dedicado al cuidado y embellecimiento de uñas (Semipermanente, Kapping gel, Soft Gel) y pestañas (Clásicas, Volumen, Lifting, Efecto Foxy). Contamos con sistema de fidelidad con tarjeta de puntos y reserva anticipada de turnos. Alias para señas y pagos: celene..65 (Titular: Caceres Celene Yoselin).",
  };

  if (!business) {
    business = await prisma.businessProfile.create({
      data: businessData,
    });
    console.log("✅ Perfil de negocio 'Wopyy Nails & Lashes' creado");
  } else {
    business = await prisma.businessProfile.update({
      where: { id: business.id },
      data: businessData,
    });
    console.log("✅ Perfil de negocio 'Wopyy Nails & Lashes' actualizado");
  }

  // 4. Horarios y Reglas del Asistente
  // Horarios de atención: Lunes a Sábado de 07:00 a 22:30 (slots de turnos habituales)
  const businessHoursJson = JSON.stringify({
    monday: { open: true, ranges: [{ start: "07:00", end: "13:00" }, { start: "15:00", end: "21:30" }] },
    tuesday: { open: true, ranges: [{ start: "07:00", end: "13:00" }, { start: "15:00", end: "21:30" }] },
    wednesday: { open: true, ranges: [{ start: "07:00", end: "13:00" }, { start: "15:00", end: "21:30" }] },
    thursday: { open: true, ranges: [{ start: "07:00", end: "13:00" }, { start: "15:00", end: "21:30" }] },
    friday: { open: true, ranges: [{ start: "07:00", end: "13:00" }, { start: "15:00", end: "21:30" }] },
    saturday: { open: true, ranges: [{ start: "08:00", end: "13:00" }, { start: "15:00", end: "20:00" }] },
    sunday: { open: false, ranges: [] },
  });

  const forbiddenRules = JSON.stringify([
    "Nunca inventes precios que no figuren en la lista oficial de servicios de Wopyy.",
    "Nunca confirmes un turno sin haber solicitado el nombre de la clienta, el servicio deseado y acordado fecha y hora.",
    "Si te envían una foto o imagen de diseño de referencia, indícale amablemente que Celene la verá y que los diseños complejos pueden tener un adicional.",
    "No atiendas consultas ajenas a los servicios de uñas, retirados y pestañas del estudio.",
    "Para señas o pagos por transferencia, el único alias oficial es: celene..65 (Titular: Caceres Celene Yoselin). Nunca des otro dato bancario.",
  ]);

  const existingSettings = await prisma.assistantSettings.findUnique({
    where: { businessId: business.id },
  });

  const assistantData = {
    businessId: business.id,
    name: "Wopyy Bot",
    avatarUrl: null,
    tone: "cercano" as const,
    welcomeMessage:
      "¡Hola! 💅✨ Bienvenida a Wopyy Nails & Lashes. Soy tu asistente virtual. ¿En qué te puedo ayudar hoy? Te puedo contar sobre nuestros servicios de uñas y pestañas, precios o ayudarte a coordinar tu turno.",
    instructions:
      "Eres la asistente virtual oficial de Wopyy Nails & Lashes (estudio de manicuría y pestañas de Celene Yoselin Caceres). Habla en español argentino cálido, empático, femenino y cercano (usando emojis sutiles como ✨, 💅, 🌸). Atiende consultas de clientas por WhatsApp e Instagram, informa precios y opciones de uñas (Semi, Kapping, Soft Gel) y pestañas (Clásicas, Volumen, Lifting, Foxy), ayuda a agendar turnos y explica el funcionamiento de la seña (Alias: celene..65) y la tarjeta de fidelidad.",
    forbiddenRules,
    businessHours: businessHoursJson,
    outOfHoursAction: "appointment" as const,
    handoffComplaint: true,
    handoffUrgency: false,
    handoffHumanAsk: true,
    handoffUnknown: true,
    handoffCustomRule: "Si la clienta pide hablar con Celene directamente o tiene una queja sobre su servicio.",
    isEnabled: true,
    safeMode: false,
    selectedModel: "anthropic/claude-haiku-5.5",
    inputTokensCost: 0.8,
    outputTokensCost: 4.0,
  };

  if (!existingSettings) {
    await prisma.assistantSettings.create({ data: assistantData });
  } else {
    await prisma.assistantSettings.update({
      where: { businessId: business.id },
      data: assistantData,
    });
  }
  console.log("✅ Configuración del asistente de Wopyy creada/actualizada");

  // 5. Todos los Servicios Reales de la Web de Wopyy (Uñas, Retirados, Pestañas)
  await prisma.service.deleteMany({ where: { businessId: business.id } });

  const servicesData = [
    // UÑAS
    {
      name: "Semipermanentes",
      description: "Esmaltado duradero sobre uña natural con acabado brillante y prolijo.",
      durationMin: 60,
      price: 13000,
      priceType: "exacto" as const,
      requiresAssessment: false,
      depositAmount: 3000,
      orderIndex: 1,
    },
    {
      name: "Semi con Diseño",
      description: "Esmaltado semipermanente incluyendo nail art / diseño artístico personalizado.",
      durationMin: 75,
      price: 15000,
      priceType: "desde" as const,
      requiresAssessment: false,
      depositAmount: 3000,
      orderIndex: 2,
    },
    {
      name: "Semi en Pies",
      description: "Belleza y esmaltado semipermanente de larga duración para pies.",
      durationMin: 60,
      price: 13000,
      priceType: "exacto" as const,
      requiresAssessment: false,
      depositAmount: 3000,
      orderIndex: 3,
    },
    {
      name: "Kapping Liso",
      description: "Nivelación y fortalecimiento con capa de gel sobre uña natural para evitar quiebres.",
      durationMin: 75,
      price: 15000,
      priceType: "exacto" as const,
      requiresAssessment: false,
      depositAmount: 3000,
      orderIndex: 4,
    },
    {
      name: "Kapping con Diseño",
      description: "Kapping nivelador fortalecedor con diseño de nail art incluido.",
      durationMin: 90,
      price: 17000,
      priceType: "desde" as const,
      requiresAssessment: false,
      depositAmount: 3000,
      orderIndex: 5,
    },
    {
      name: "Kapping en Pies",
      description: "Fortalecimiento y kapping nivelador en uñas de los pies.",
      durationMin: 60,
      price: 15000,
      priceType: "exacto" as const,
      requiresAssessment: false,
      depositAmount: 3000,
      orderIndex: 6,
    },
    {
      name: "Soft Gel Lisas",
      description: "Extensiones de uñas completas con tips de gel flexible y ligero sin diseño.",
      durationMin: 90,
      price: 20000,
      priceType: "exacto" as const,
      requiresAssessment: false,
      depositAmount: 4000,
      orderIndex: 7,
    },
    {
      name: "Soft Gel con Diseño",
      description: "Extensiones completas sistema Soft Gel con nail art y diseño a elección.",
      durationMin: 105,
      price: 23000,
      priceType: "desde" as const,
      requiresAssessment: false,
      depositAmount: 4000,
      orderIndex: 8,
    },

    // RETIRADOS
    {
      name: "Retirado en Semi",
      description: "Remoción suave y segura de esmaltado semipermanente sin dañar la lámina ungueal.",
      durationMin: 30,
      price: 4000,
      priceType: "exacto" as const,
      requiresAssessment: false,
      depositAmount: 1000,
      orderIndex: 9,
    },
    {
      name: "Retirado Kapping",
      description: "Remoción cuidadosa del gel de kapping preservando la uña natural.",
      durationMin: 40,
      price: 5000,
      priceType: "exacto" as const,
      requiresAssessment: false,
      depositAmount: 1000,
      orderIndex: 10,
    },
    {
      name: "Retirado Soft Gel",
      description: "Remoción profesional completa de extensiones Soft Gel.",
      durationMin: 45,
      price: 8000,
      priceType: "exacto" as const,
      requiresAssessment: false,
      depositAmount: 2000,
      orderIndex: 11,
    },

    // PESTAÑAS
    {
      name: "Pestañas Clásicas",
      description: "Efecto sutil pelo por pelo: para quienes buscan una mirada delicada, prolija y natural.",
      durationMin: 90,
      price: 25000,
      priceType: "exacto" as const,
      requiresAssessment: false,
      depositAmount: 5000,
      orderIndex: 12,
    },
    {
      name: "Pestañas Volumen Medio",
      description: "Resultado natural con mayor densidad y definición en la mirada.",
      durationMin: 105,
      price: 30000,
      priceType: "exacto" as const,
      requiresAssessment: false,
      depositAmount: 5000,
      orderIndex: 13,
    },
    {
      name: "Pestañas Efecto Lifting",
      description: "Mirada elevada y fresca. Ideal para un efecto curvado y abierto sin tanto volumen.",
      durationMin: 90,
      price: 35000,
      priceType: "exacto" as const,
      requiresAssessment: false,
      depositAmount: 5000,
      orderIndex: 14,
    },
    {
      name: "Pestañas Efecto Foxy",
      description: "Mirada felina rasgada hacia el extremo externo. Estiliza y alarga visualmente el ojo.",
      durationMin: 120,
      price: 40000,
      priceType: "exacto" as const,
      requiresAssessment: false,
      depositAmount: 5000,
      orderIndex: 15,
    },
  ];

  for (const s of servicesData) {
    await prisma.service.create({
      data: {
        ...s,
        businessId: business.id,
      },
    });
  }
  console.log(`✅ ${servicesData.length} Servicios de Wopyy Nails & Lashes creados`);

  // 6. Preguntas Frecuentes (FAQs) Reales de Wopyy
  await prisma.faq.deleteMany({ where: { businessId: business.id } });

  const faqsData = [
    {
      question: "¿Dónde queda el estudio de Wopyy?",
      answer: "Estamos en Oberá, Misiones. Al momento de confirmar tu turno con la seña, te enviamos la dirección exacta y la ubicación por WhatsApp.",
      category: "Ubicación",
    },
    {
      question: "¿Se debe dejar seña para reservar el turno?",
      answer: "Sí, para asegurar tu turno solicitamos una seña previa. El alias de transferencia oficial es celene..65 (Titular: Caceres Celene Yoselin). El saldo restante se abona el día del turno en efectivo o transferencia.",
      category: "Turnos y Seña",
    },
    {
      question: "¿Cómo funciona la Tarjeta de Fidelidad de Wopyy?",
      answer: "¡Premiamos tu fidelidad! Con cada servicio que te realizas sumas 1 punto en tu tarjeta virtual. En los turnos 5, 7 y 10 recibes sorpresas y descuentos especiales en tus servicios favoritos.",
      category: "Beneficios",
    },
    {
      question: "¿Puedo enviar una foto o diseño de referencia de lo que quiero hacerme?",
      answer: "¡Sí, claro! Puedes enviarnos la foto o captura del diseño de uñas o pestañas que te gusta para que Celene lo revise antes de tu turno.",
      category: "Diseños",
    },
    {
      question: "¿Cuánto dura un servicio de uñas o pestañas?",
      answer: "El esmaltado semipermanente dura aprox. 60 min; el Kapping entre 75 y 90 min; y las Soft Gel o extensiones de pestañas entre 90 y 120 min.",
      category: "Servicios",
    },
    {
      question: "¿Qué pasa si llego tarde o necesito cancelar?",
      answer: "Te pedimos avisar con al menos 24 hs de anticipación para poder reprogramar tu turno y no perder la seña. Hay una tolerancia máxima de 15 minutos de retraso.",
      category: "Políticas",
    },
  ];

  for (const f of faqsData) {
    await prisma.faq.create({
      data: {
        ...f,
        businessId: business.id,
      },
    });
  }
  console.log(`✅ ${faqsData.length} Preguntas Frecuentes de Wopyy creadas`);

  // 7. Canales Web y WhatsApp
  await prisma.channelSettings.upsert({
    where: { channel: "WEB" },
    update: {
      welcomeText: "¡Hola! 💅 Soy el asistente de Wopyy Nails & Lashes. ¿Te gustaría consultar precios o agendar un turno?",
      primaryColor: "#E11D48",
    },
    create: {
      channel: "WEB",
      isEnabled: true,
      primaryColor: "#E11D48",
      welcomeText: "¡Hola! 💅 Soy el asistente de Wopyy Nails & Lashes. ¿Te gustaría consultar precios o agendar un turno?",
      buttonPosition: "bottom-right",
    },
  });

  await prisma.channelSettings.upsert({
    where: { channel: "WHATSAPP" },
    update: { isEnabled: true },
    create: {
      channel: "WHATSAPP",
      isEnabled: true,
      connectionStatus: "DISCONNECTED",
    },
  });

  console.log("🚀 ¡Adaptación para Wopyy Nails & Lashes completada con éxito!");
}

if (require.main === module) {
  seedDemoData()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
