import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const business = await prisma.businessProfile.findFirst();

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const updated = await prisma.businessProfile.update({
      where: { id: business.id },
      data: {
        name: data.name,
        activity: data.activity,
        address: data.address,
        phone: data.phone,
        website: data.website,
        generalInfo: data.generalInfo,
      },
    });

    return NextResponse.json({ success: true, business: updated });
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar negocio" }, { status: 500 });
  }
}
