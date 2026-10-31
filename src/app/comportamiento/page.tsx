import { DashboardShell } from "@/components/layout/DashboardShell";
import { prisma } from "@/lib/prisma";
import { BehaviorForm } from "./BehaviorForm";

export default async function BehaviorPage() {
  const [business, assistant] = await Promise.all([
    prisma.businessProfile.findFirst(),
    prisma.assistantSettings.findFirst(),
  ]);

  return (
    <DashboardShell>
      <div className="max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Comportamiento del asistente
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Personaliza el nombre, tono, mensajes y reglas de derivación a una persona.
          </p>
        </div>

        <BehaviorForm
          business={business}
          initialSettings={assistant}
        />
      </div>
    </DashboardShell>
  );
}
