import { DashboardShell } from "@/components/layout/DashboardShell";
import { prisma } from "@/lib/prisma";
import { IntegrationsCatalog } from "./IntegrationsCatalog";

export default async function IntegracionesPage() {
  const integrations = await prisma.integration.findMany();
  const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID);

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Catálogo de Integraciones
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Conecta Google Calendar, Gmail, Sheets, Slack, Stripe y Webhooks para expandir las herramientas del asistente.
          </p>
        </div>

        <IntegrationsCatalog
          integrations={integrations}
          googleConfigured={googleConfigured}
        />
      </div>
    </DashboardShell>
  );
}
