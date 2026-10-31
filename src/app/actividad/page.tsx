import { DashboardShell } from "@/components/layout/DashboardShell";
import { prisma } from "@/lib/prisma";
import { Activity, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

export default async function ActividadPage() {
  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Registro de actividad
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Histórico detallado de acciones del asistente, herramientas ejecutadas e integraciones.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Total eventos registrados ({logs.length})
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="p-4 flex items-start justify-between gap-4">
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
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{log.action}</p>
                      {log.channel && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {log.channel}
                        </span>
                      )}
                    </div>
                    {log.details && (
                      <p className="text-xs text-slate-500 font-mono mt-1 whitespace-pre-wrap">
                        {log.details}
                      </p>
                    )}
                    {log.errorMessage && (
                      <p className="text-xs text-rose-600 mt-1">{log.errorMessage}</p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0 text-xs text-slate-400">
                  {new Intl.DateTimeFormat("es-ES", {
                    timeZone: "Europe/Madrid",
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(log.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
