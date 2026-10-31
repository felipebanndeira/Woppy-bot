import { DashboardShell } from "@/components/layout/DashboardShell";
import { prisma } from "@/lib/prisma";
import { KnowledgeManager } from "./KnowledgeManager";

export default async function KnowledgePage() {
  const [business, services, faqs] = await Promise.all([
    prisma.businessProfile.findFirst(),
    prisma.service.findMany({ orderBy: { orderIndex: "asc" } }),
    prisma.faq.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <DashboardShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Base de conocimiento
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Datos del negocio, catálogo de servicios, precios, preguntas frecuentes y scraper con IA.
          </p>
        </div>

        <KnowledgeManager
          business={business}
          services={services}
          faqs={faqs}
        />
      </div>
    </DashboardShell>
  );
}
