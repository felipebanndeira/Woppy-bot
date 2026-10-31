import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const business = await prisma.businessProfile.findFirst();

    if (!business) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });

    const faq = await prisma.faq.create({
      data: {
        businessId: business.id,
        question: data.question,
        answer: data.answer,
        category: data.category || "General",
      },
    });

    return NextResponse.json({ success: true, faq });
  } catch (error) {
    return NextResponse.json({ error: "Error al crear FAQ" }, { status: 500 });
  }
}
