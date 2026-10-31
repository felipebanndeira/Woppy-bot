import { DashboardShell } from "@/components/layout/DashboardShell";
import { prisma } from "@/lib/prisma";
import { SettingsManager } from "./SettingsManager";

export default async function SettingsPage() {
  const [business, assistant, branding, users] = await Promise.all([
    prisma.businessProfile.findFirst(),
    prisma.assistantSettings.findFirst(),
    prisma.agencyBranding.findFirst(),
    prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true } }),
  ]);

  return (
    <DashboardShell>
      <div className="max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Ajustes del sistema
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configuración de modelo de IA (OpenRouter), marca blanca de la agencia y usuarios.
          </p>
        </div>

        <SettingsManager
          business={business}
          assistant={assistant}
          branding={branding}
          users={users}
          hasApiKey={Boolean(process.env.OPENROUTER_API_KEY)}
        />
      </div>
    </DashboardShell>
  );
}
