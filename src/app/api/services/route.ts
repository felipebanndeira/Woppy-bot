import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const business = await prisma.businessProfile.findFirst();

    if (!business) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });

    const service = await prisma.service.create({
      data: {
        businessId: business.id,
        name: data.name,
        description: data.description || "",
        durationMin: Number(data.durationMin) || 30,
        price: Number(data.price) || 0,
        priceType: data.priceType || "exacto",
        requiresAssessment: Boolean(data.requiresAssessment),
      },
    });

    return NextResponse.json({ success: true, service });
  } catch (error) {
    return NextResponse.json({ error: "Error al crear servicio" }, { status: 500 });
  }
}
