import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  try {
    const { agencyName } = await request.json();
    let branding = await prisma.agencyBranding.findFirst();

    if (branding) {
      branding = await prisma.agencyBranding.update({
        where: { id: branding.id },
        data: { agencyName },
      });
    } else {
      branding = await prisma.agencyBranding.create({
        data: { agencyName },
      });
    }

    return NextResponse.json({ success: true, branding });
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar marca" }, { status: 500 });
  }
}
