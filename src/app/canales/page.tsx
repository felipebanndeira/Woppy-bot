import { DashboardShell } from "@/components/layout/DashboardShell";
import { prisma } from "@/lib/prisma";
import { ChannelsManager } from "./ChannelsManager";

export default async function CanalesPage() {
  const [waChannel, webChannel] = await Promise.all([
    prisma.channelSettings.findUnique({ where: { channel: "WHATSAPP" } }),
    prisma.channelSettings.findUnique({ where: { channel: "WEB" } }),
  ]);

  const appUrl = process.env.APP_URL || "http://localhost:3000";

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Canales de atención
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestiona la vinculación de WhatsApp mediante QR y el widget de chat flotante para sitios web.
          </p>
        </div>

        <ChannelsManager
          initialWa={waChannel}
          initialWeb={webChannel}
          appUrl={appUrl}
        />
      </div>
    </DashboardShell>
  );
}
