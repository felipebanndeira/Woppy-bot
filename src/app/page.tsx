import { DashboardShell } from "@/components/layout/DashboardShell";
import { AssistantToggle } from "@/components/AssistantToggle";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  MessageSquare,
  CalendarCheck,
  UserCheck,
  Clock,
  Radio,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default async function DashboardPage() {
  const [business, assistant, channels, integrations, conversations, appointments, recentLogs] =
    await Promise.all([
      prisma.businessProfile.findFirst(),
      prisma.assistantSettings.findFirst(),
      prisma.channelSettings.findMany(),
      prisma.integration.findMany(),
      prisma.conversation.findMany({
        include: { contact: true, messages: { take: 1, orderBy: { createdAt: "desc" } } },
      }),
      prisma.appointment.findMany({
        where: { createdViaAssistant: true },
        include: { contact: true, service: true },
      }),
      prisma.activityLog.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const waChannel = channels.find((c) => c.channel === "WHATSAPP");
  const webChannel = channels.find((c) => c.channel === "WEB");

  const pendingHumanHandoff = conversations.filter(
    (c) => c.status === "HANDOFF_REQUIRED" || c.status === "HUMAN_CONTROL"
  ).length;

  return (
    <DashboardShell>
      <div className="space-y-8">
        {/* Encabezado y Switch de Encendido */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Resumen general
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Estado en tiempo real de {business?.name || "tu negocio"} y actividad del asistente.
            </p>
          </div>

          <AssistantToggle initialStatus={Boolean(assistant?.isEnabled)} />
        </div>

        {/* Tarjetas de Métricas Clave */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Conversaciones hoy
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {conversations.length}
              </p>
              <span className="text-[11px] text-emerald-600 font-medium">
                Atendidas en tiempo real
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Citas concertadas
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {appointments.length}
              </p>
              <span className="text-[11px] text-slate-500">
                Sincronizadas con Google Calendar
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Esperan a una persona
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {pendingHumanHandoff}
              </p>
              <span className="text-[11px] text-amber-600 font-medium">
                {pendingHumanHandoff > 0 ? "Requiere atención del equipo" : "Al día"}
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Tiempo de respuesta
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">8 seg</p>
              <span className="text-[11px] text-slate-500">
                Ventana de acumulación natural
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Estado de Canales e Integraciones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Canales */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h2 className="font-semibold text-slate-900 text-base">Canales de atención</h2>
              <Link
                href="/canales"
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                <span>Configurar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                    WA
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">WhatsApp</p>
                    <p className="text-xs text-slate-500">
                      {waChannel?.connectionStatus === "CONNECTED"
                        ? `Conectado: ${waChannel.connectedNumber || "Activo"}`
                        : "Esperando vinculación por QR"}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    waChannel?.connectionStatus === "CONNECTED"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {waChannel?.connectionStatus === "CONNECTED" ? "Conectado" : "Desconectado"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm">
                    WEB
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Chat para tu web</p>
                    <p className="text-xs text-slate-500">Widget flotante disponible y activo</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-100 text-emerald-800">
                  Activo
                </span>
              </div>
            </div>
          </div>

          {/* Integraciones Conectadas */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h2 className="font-semibold text-slate-900 text-base">Integraciones conectadas</h2>
              <Link
                href="/integraciones"
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                <span>Ver catálogo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {integrations.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">
                  <p>Ninguna integración conectada todavía.</p>
                  <Link
                    href="/integraciones"
                    className="mt-2 inline-block text-xs font-semibold text-teal-600 hover:underline"
                  >
                    Conectar Google Calendar, Gmail, Sheets, Slack o Stripe →
                  </Link>
                </div>
              ) : (
                integrations.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm"
                  >
                    <span className="font-medium text-slate-800">{item.provider}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        item.status === "CONNECTED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Últimas acciones del asistente */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <h2 className="font-semibold text-slate-900 text-base">
              Últimas acciones del asistente
            </h2>
            <Link
              href="/actividad"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <span>Ver registro completo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {log.result === "SUCCESS" && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                    {log.result === "ERROR" && <XCircle className="w-4 h-4 text-rose-500" />}
                    {log.result === "WARNING" && (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{log.action}</p>
                    {log.details && (
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        {log.details.length > 90 ? log.details.slice(0, 90) + "…" : log.details}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] text-slate-400">
                    {new Intl.DateTimeFormat("es-AR", {
                      timeZone: "America/Argentina/Buenos_Aires",
                      timeStyle: "short",
                    }).format(log.createdAt)}
                  </span>
                  <span className="block text-[10px] font-medium text-slate-500 uppercase">
                    {log.channel || "Sistema"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
