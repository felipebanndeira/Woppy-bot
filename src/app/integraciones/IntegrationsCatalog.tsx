"use client";

import { useState } from "react";
import {
  Calendar,
  Mail,
  FileSpreadsheet,
  MessageSquare,
  CreditCard,
  Webhook,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Sliders,
  Send,
  Loader2,
} from "lucide-react";

interface IntegrationsCatalogProps {
  integrations: any[];
  googleConfigured: boolean;
}

export function IntegrationsCatalog({
  integrations: initialIntegrations,
  googleConfigured,
}: IntegrationsCatalogProps) {
  const [integrations, setIntegrations] = useState(initialIntegrations);
  const [selectedForConfig, setSelectedForConfig] = useState<string | null>(null);

  // Estados modales de configuración
  const [slackUrl, setSlackUrl] = useState("");
  const [stripeKey, setStripeKey] = useState("");
  const [stripeDeposit, setStripeDeposit] = useState(20);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);
  const [showGoogleGuide, setShowGoogleGuide] = useState(false);

  const getStatus = (provider: string) => {
    return integrations.find((i) => i.provider === provider) || { status: "DISCONNECTED" };
  };

  const handleDisconnect = async (provider: string) => {
    if (!confirm(`¿Desconectar ${provider}?`)) return;
    try {
      await fetch("/api/integrations/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      setIntegrations(
        integrations.map((i) => (i.provider === provider ? { ...i, status: "DISCONNECTED" } : i))
      );
    } catch {
      alert("Error al desconectar");
    }
  };

  const handleConnectSlack = async (test = false) => {
    setLoadingAction(true);
    try {
      const res = await fetch("/api/integrations/slack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: slackUrl, test }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(test ? "¡Mensaje de prueba enviado a Slack!" : "Slack conectado con éxito");
      if (!test) window.location.reload();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleConnectStripe = async () => {
    setLoadingAction(true);
    try {
      const res = await fetch("/api/integrations/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: stripeKey, defaultDeposit: stripeDeposit }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert("Stripe conectado correctamente");
      window.location.reload();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleConnectWebhook = async (test = false) => {
    setLoadingAction(true);
    try {
      const res = await fetch("/api/integrations/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUrl: webhookUrl, secret: webhookSecret, test }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(test ? `Evento enviado correctamente: ${data.message}` : "Webhook configurado");
      if (!test) window.location.reload();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Aviso y Guía de Google Cloud OAuth */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
              Google Cloud OAuth Unificado
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Google Calendar, Gmail y Google Sheets comparten un único cliente OAuth con autorización incremental.
            {googleConfigured
              ? " Credenciales configuradas en .env."
              : " Requiere configurar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowGoogleGuide(true)}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors"
        >
          Ver guía paso a paso Google Cloud
        </button>
      </div>

      {/* Grid del Catálogo de Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Google Calendar */}
        {(() => {
          const item = getStatus("GOOGLE_CALENDAR");
          const isConnected = item.status === "CONNECTED";
          return (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isConnected
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {isConnected ? "Conectada" : "Sin conectar"}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base">Google Calendar</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Comprueba huecos libres en el horario de atención, crea, modifica y cancela citas.
                  </p>
                </div>

                {isConnected && item.accountEmailOrId && (
                  <p className="text-[11px] text-slate-600 font-mono bg-slate-50 p-2 rounded-lg border">
                    Cuenta: {item.accountEmailOrId}
                  </p>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between">
                {isConnected ? (
                  <button
                    type="button"
                    onClick={() => handleDisconnect("GOOGLE_CALENDAR")}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Desconectar
                  </button>
                ) : (
                  <a
                    href="/api/integrations/google/connect?service=GOOGLE_CALENDAR"
                    className="w-full text-center py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                  >
                    Conectar con Google
                  </a>
                )}
              </div>
            </div>
          );
        })()}

        {/* 2. Gmail */}
        {(() => {
          const item = getStatus("GMAIL");
          const isConnected = item.status === "CONNECTED";
          return (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
                    <Mail className="w-6 h-6" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isConnected
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {isConnected ? "Conectada" : "Sin conectar"}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base">Gmail</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Envío de confirmación de cita al cliente y resumen diario automático al dueño.
                  </p>
                </div>

                {isConnected && item.accountEmailOrId && (
                  <p className="text-[11px] text-slate-600 font-mono bg-slate-50 p-2 rounded-lg border">
                    Cuenta: {item.accountEmailOrId}
                  </p>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between">
                {isConnected ? (
                  <button
                    type="button"
                    onClick={() => handleDisconnect("GMAIL")}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Desconectar
                  </button>
                ) : (
                  <a
                    href="/api/integrations/google/connect?service=GMAIL"
                    className="w-full text-center py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                  >
                    Conectar con Google
                  </a>
                )}
              </div>
            </div>
          );
        })()}

        {/* 3. Google Sheets */}
        {(() => {
          const item = getStatus("GOOGLE_SHEETS");
          const isConnected = item.status === "CONNECTED";
          return (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isConnected
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {isConnected ? "Conectada" : "Sin conectar"}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base">Google Sheets</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Crea la hoja «Contactos — Lumen» y sincroniza cada contacto y paciente con permiso restringido.
                  </p>
                </div>

                {isConnected && item.accountEmailOrId && (
                  <p className="text-[11px] text-slate-600 font-mono bg-slate-50 p-2 rounded-lg border">
                    Cuenta: {item.accountEmailOrId}
                  </p>
                )}
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between">
                {isConnected ? (
                  <button
                    type="button"
                    onClick={() => handleDisconnect("GOOGLE_SHEETS")}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Desconectar
                  </button>
                ) : (
                  <a
                    href="/api/integrations/google/connect?service=GOOGLE_SHEETS"
                    className="w-full text-center py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                  >
                    Conectar con Google
                  </a>
                )}
              </div>
            </div>
          );
        })()}

        {/* 4. Slack */}
        {(() => {
          const item = getStatus("SLACK");
          const isConnected = item.status === "CONNECTED";
          return (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isConnected
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {isConnected ? "Conectada" : "Sin conectar"}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base">Slack</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Avisa al canal del equipo cuando una conversación pasa a un humano o se agenda una cita.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between">
                {isConnected ? (
                  <button
                    type="button"
                    onClick={() => handleDisconnect("SLACK")}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Desconectar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedForConfig("SLACK")}
                    className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                  >
                    Configurar Webhook
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* 5. Stripe */}
        {(() => {
          const item = getStatus("STRIPE");
          const isConnected = item.status === "CONNECTED";
          return (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isConnected
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {isConnected ? item.accountEmailOrId || "Conectada" : "Sin conectar"}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base">Stripe</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Genera enlaces de pago para cobrar una señal previa antes de confirmar citas.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between">
                {isConnected ? (
                  <button
                    type="button"
                    onClick={() => handleDisconnect("STRIPE")}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Desconectar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedForConfig("STRIPE")}
                    className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                  >
                    Conectar clave API
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* 6. Webhooks */}
        {(() => {
          const item = getStatus("WEBHOOK");
          const isConnected = item.status === "CONNECTED";
          return (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                    <Webhook className="w-6 h-6" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isConnected
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {isConnected ? "Activo" : "Sin conectar"}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base">Webhooks Salientes</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Emite eventos firmados (nueva conversación, cita creada, pase a humano) para n8n, Make o Zapier.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between">
                {isConnected ? (
                  <button
                    type="button"
                    onClick={() => handleDisconnect("WEBHOOK")}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Desconectar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedForConfig("WEBHOOK")}
                    className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                  >
                    Configurar URL destino
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Modal Slack */}
      {selectedForConfig === "SLACK" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Conectar Slack Incoming Webhook</h3>
            <p className="text-xs text-slate-500">
              Pega la URL del Incoming Webhook generado en tu espacio de trabajo de Slack.
            </p>
            <input
              type="url"
              value={slackUrl}
              onChange={(e) => setSlackUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
            />
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => handleConnectSlack(true)}
                disabled={loadingAction || !slackUrl}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Enviar mensaje de prueba
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedForConfig(null)}
                  className="px-3 py-2 text-slate-500 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleConnectSlack(false)}
                  disabled={loadingAction || !slackUrl}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Stripe */}
      {selectedForConfig === "STRIPE" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Conectar Stripe</h3>
            <p className="text-xs text-slate-500">
              Pega tu clave de API restringida (vale la de modo prueba que empieza por <code>rk_test_</code> o <code>sk_test_</code>).
            </p>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Clave de API</label>
              <input
                type="password"
                value={stripeKey}
                onChange={(e) => setStripeKey(e.target.value)}
                placeholder="rk_test_..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Importe de señal por defecto (€)
              </label>
              <input
                type="number"
                value={stripeDeposit}
                onChange={(e) => setStripeDeposit(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedForConfig(null)}
                className="px-3 py-2 text-slate-500 text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConnectStripe}
                disabled={loadingAction || !stripeKey}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl"
              >
                Conectar Stripe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Webhooks */}
      {selectedForConfig === "WEBHOOK" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Configurar Webhook Saliente</h3>
            <p className="text-xs text-slate-500">
              Pega la URL de tu webhook en n8n, Make, Zapier o endpoint propio.
            </p>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">URL de Destino</label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://n8n.tuempresa.com/webhook/..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Clave secreta para firma HMAC-SHA256 (Cabecera X-Atiende-Signature)
              </label>
              <input
                type="text"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder="whsec_secreto_personalizado"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => handleConnectWebhook(true)}
                disabled={loadingAction || !webhookUrl}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Enviar evento de prueba
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedForConfig(null)}
                  className="px-3 py-2 text-slate-500 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleConnectWebhook(false)}
                  disabled={loadingAction || !webhookUrl}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Guía Google Cloud */}
      {showGoogleGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto text-xs leading-relaxed">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="text-sm font-bold text-slate-900">
                Guía paso a paso: Configurar Google OAuth en Google Cloud
              </h3>
              <button
                type="button"
                onClick={() => setShowGoogleGuide(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <ol className="list-decimal list-inside space-y-2.5 text-slate-700">
              <li>
                <strong>Crea un proyecto en Google Cloud Console:</strong> Ve a{" "}
                <a
                  href="https://console.cloud.google.com/"
                  target="_blank"
                  className="text-teal-600 underline"
                >
                  console.cloud.google.com
                </a>{" "}
                y crea o selecciona un proyecto (ej: «Atiende - Clientes»).
              </li>
              <li>
                <strong>Habilita las APIs necesarias:</strong> En la sección <em>APIs & Services &gt; Library</em>,
                habilita: <strong>Google Calendar API</strong>, <strong>Gmail API</strong> y <strong>Google Drive API / Sheets</strong>.
              </li>
              <li>
                <strong>Configura la Pantalla de Consentimiento OAuth:</strong>
                <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-slate-600">
                  <li>Elige tipo de usuario <strong>Externa (External)</strong>.</li>
                  <li>
                    <strong>¡IMPORTANTE! Publica la aplicación («En producción»):</strong> En modo de prueba, Google caduca los tokens de actualización (refresh token) a los 7 días exactos y el asistente se desconectaría solo. Al publicarla en producción los tokens son permanentes.
                  </li>
                  <li>
                    <strong>Aviso de «Aplicación no verificada»:</strong> Al conectar, Google mostrará una pantalla advirtiendo que la app no ha sido verificada por Google. Es totalmente normal para aplicaciones de agencia de uso privado. El cliente simplemente hace clic en <em>«Avanzado» &gt; «Ir a Atiende (no seguro)»</em>. Para eliminar este aviso haría falta un proceso de verificación formal con Google grabando un vídeo de demostración.
                  </li>
                </ul>
              </li>
              <li>
                <strong>Crea las Credenciales OAuth:</strong>
                <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-slate-600">
                  <li>Tipo de aplicación: <strong>Aplicación web (Web application)</strong>.</li>
                  <li>
                    <strong>URIs de redireccionamiento autorizados:</strong> Añade exactamente:
                    <br />
                    <code className="bg-slate-100 px-2 py-0.5 rounded text-teal-800 font-bold">
                      http://localhost:3000/api/integrations/google/callback
                    </code>
                  </li>
                </ul>
              </li>
              <li>
                <strong>Copia las claves a tu archivo .env:</strong>
                <pre className="bg-slate-900 text-teal-300 p-2.5 rounded-lg mt-1 font-mono">
                  GOOGLE_CLIENT_ID=tu_cliente_id.apps.googleusercontent.com
                  GOOGLE_CLIENT_SECRET=tu_secreto_de_cliente
                  GOOGLE_REDIRECT_URI=http://localhost:3000/api/integrations/google/callback
                </pre>
              </li>
            </ol>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowGoogleGuide(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Entendido y cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
