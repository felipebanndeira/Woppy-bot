import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const business = await prisma.businessProfile.findFirst();

    if (!business) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });

    // Actualizar perfil si vino en la extracción
    if (data.business) {
      await prisma.businessProfile.update({
        where: { id: business.id },
        data: {
          name: data.business.name || business.name,
          activity: data.business.activity || business.activity,
          address: data.business.address || business.address,
          phone: data.business.phone || business.phone,
          website: data.business.website || business.website,
          generalInfo: data.business.generalInfo || business.generalInfo,
        },
      });
    }

    // Insertar servicios extraídos
    if (Array.isArray(data.services)) {
      for (const s of data.services) {
        if (!s.name) continue;
        const exists = await prisma.service.findFirst({
          where: { businessId: business.id, name: s.name },
        });
        if (!exists) {
          await prisma.service.create({
            data: {
              businessId: business.id,
              name: s.name,
              description: s.description || "",
              durationMin: Number(s.durationMin) || 30,
              price: Number(s.price) || 0,
              priceType: s.priceType === "desde" ? "desde" : "exacto",
              requiresAssessment: Boolean(s.requiresAssessment),
            },
          });
        }
      }
    }

    // Insertar FAQs extraídas
    if (Array.isArray(data.faqs)) {
      for (const f of data.faqs) {
        if (!f.question || !f.answer) continue;
        const exists = await prisma.faq.findFirst({
          where: { businessId: business.id, question: f.question },
        });
        if (!exists) {
          await prisma.faq.create({
            data: {
              businessId: business.id,
              question: f.question,
              answer: f.answer,
              category: f.category || "General",
            },
          });
        }
      }
    }

    await prisma.activityLog.create({
      data: {
        action: "Importación web aplicada",
        result: "SUCCESS",
        details: JSON.stringify({
          servicesCount: data.services?.length || 0,
          faqsCount: data.faqs?.length || 0,
        }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al aplicar importación:", error);
    return NextResponse.json({ error: "Error al aplicar datos" }, { status: 500 });
  }
}
