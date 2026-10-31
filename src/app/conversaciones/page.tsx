import { DashboardShell } from "@/components/layout/DashboardShell";
import { prisma } from "@/lib/prisma";
import { ConversationsInbox } from "./ConversationsInbox";

export default async function ConversacionesPage() {
  const conversations = await prisma.conversation.findMany({
    include: {
      contact: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Bandeja de conversaciones
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Supervisa los chats de WhatsApp y Web, inspecciona las herramientas usadas por la IA y toma el control manual cuando sea necesario.
          </p>
        </div>

        <ConversationsInbox conversations={conversations} />
      </div>
    </DashboardShell>
  );
}
