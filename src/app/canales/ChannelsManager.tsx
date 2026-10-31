"use client";

import { useState, useEffect } from "react";
import {
  Radio,
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Code2,
  RefreshCw,
  LogOut,
} from "lucide-react";

interface ChannelsManagerProps {
  initialWa: any;
  initialWeb: any;
  appUrl: string;
}

export function ChannelsManager({ initialWa, initialWeb, appUrl }: ChannelsManagerProps) {
  const [waState, setWaState] = useState(initialWa);
  const [copiedScript, setCopiedScript] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  // Escucha SSE en tiempo real para el código QR y estado de WhatsApp
  useEffect(() => {
    const eventSource = new EventSource("/api/channels/whatsapp/sse");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setWaState((prev: any) => ({
          ...prev,
          connectionStatus: data.status,
          qrCode: data.qrCode,
          connectedNumber: data.connectedNumber,
        }));
      } catch (e) {
        console.error("Error SSE:", e);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleDisconnectWa = async () => {
    if (!confirm("¿Deseas desconectar la sesión de WhatsApp?")) return;
    setLoadingAction(true);
    try {
      await fetch("/api/channels/whatsapp/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
    } catch {
      alert("Error al desconectar");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleReconnectWa = async () => {
    setLoadingAction(true);
    try {
      await fetch("/api/channels/whatsapp/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reconnect" }),
      });
    } catch {
      alert("Error al solicitar reconexión");
    } finally {
      setLoadingAction(false);
    }
  };

  const embedScriptCode = `<script src="${appUrl}/widget.js" defer></script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const isConnected = waState?.connectionStatus === "CONNECTED";
  const isWaitingQR = waState?.connectionStatus === "WAITING_QR";

  return (
    <div className="space-y-8">
      {/* 1. Canal WhatsApp con Baileys */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base shadow-sm">
              WA
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Canal WhatsApp Oficial</h2>
              <p className="text-xs text-slate-500">
                Conexión Baileys con persistencia en disco y respuesta unificada en 8 segundos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                isConnected
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : isWaitingQR
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              {isConnected
                ? "Conectado"
                : isWaitingQR
                ? "Esperando escaneo QR"
                : "Desconectado"}
            </span>

            {isConnected ? (
              <button
                type="button"
                onClick={handleDisconnectWa}
                disabled={loadingAction}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Desconectar</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReconnectWa}
                disabled={loadingAction}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Generar código QR</span>
              </button>
            )}
          </div>
        </div>

        {/* Estado y visualización QR */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
              <p className="font-semibold text-slate-900">Instrucciones de conexión:</p>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
                <li>Abre WhatsApp en el teléfono del negocio.</li>
                <li>Toca en <strong>Menú (tres puntos) o Ajustes &gt; Dispositivos vinculados</strong>.</li>
                <li>Toca en <strong>Vincular un dispositivo</strong> y apunta con la cámara al código QR.</li>
              </ol>
            </div>

            {isConnected && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp conectado y activo</span>
                </p>
                <p>Número vinculado: <strong>+{waState.connectedNumber || "Detectado"}</strong></p>
                <p className="text-[11px] text-emerald-700">
                  Las conversaciones recibidas se gestionarán en la bandeja y el asistente responderá automáticamente si está encendido.
                </p>
              </div>
            )}
          </div>

          {/* Código QR renderizado en vivo */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-2xl min-h-[260px]">
            {isConnected ? (
              <div className="text-center text-slate-600 space-y-2">
                <Smartphone className="w-12 h-12 text-emerald-600 mx-auto" />
                <p className="font-bold text-sm text-slate-900">Dispositivo ya vinculado</p>
                <p className="text-xs text-slate-500">
                  La sesión sobrevive a los reinicios del servidor.
                </p>
              </div>
            ) : waState?.qrCode ? (
              <div className="text-center space-y-2">
                <img
                  src={waState.qrCode}
                  alt="Código QR de WhatsApp"
                  className="w-56 h-56 rounded-xl border border-slate-300 shadow-sm mx-auto bg-white p-2"
                />
                <p className="text-[11px] text-slate-500 animate-pulse font-medium">
                  Actualizándose en tiempo real por Server-Sent Events (SSE)
                </p>
              </div>
            ) : (
              <div className="text-center text-slate-400 space-y-2">
                <QrCode className="w-12 h-12 text-slate-300 mx-auto stroke-[1.5]" />
                <p className="font-semibold text-xs text-slate-600">
                  Presiona «Generar código QR» para escanear
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Canal Chat Web */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-base shadow-sm">
              WEB
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Chat para tu Web</h2>
              <p className="text-xs text-slate-500">
                Burbuja de atención flotante instalable en cualquier web con una sola línea de código.
              </p>
            </div>
          </div>

          <a
            href="/demo"
            target="_blank"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
          >
            <span>Ver web de ejemplo (/demo)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Fragmento de código */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase text-slate-600 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-teal-600" />
              <span>Fragmento de código para insertar en tu web</span>
            </label>
            <button
              type="button"
              onClick={copyToClipboard}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedScript ? "¡Copiado!" : "Copiar código"}</span>
            </button>
          </div>

          <pre className="p-4 bg-slate-900 text-teal-300 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800">
            {embedScriptCode}
          </pre>

          <p className="text-[11px] text-slate-500">
            Pega este script justo antes del cierre de la etiqueta <code>&lt;/body&gt;</code> en WordPress, Shopify, Webflow o cualquier HTML.
          </p>
        </div>
      </div>
    </div>
  );
}
