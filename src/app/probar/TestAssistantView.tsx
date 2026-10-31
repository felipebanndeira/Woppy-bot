"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Shield,
  RotateCcw,
  Send,
  Bot,
  User,
  Wrench,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  ChevronRight,
  Info,
} from "lucide-react";

interface TimelineStep {
  id: string;
  tool: string;
  summary: string;
  args: any;
  output: any;
  isSimulated: boolean;
  time: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  toolsUsed?: string[];
}

export function TestAssistantView() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "¡Hola! 👋 Soy Lumen, el asistente virtual de Clínica Dental Lumen. ¿En qué puedo ayudarte hoy? Si lo deseas, puedo informarte sobre nuestros tratamientos o agendarte una cita con nuestros doctores.",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [safeMode, setSafeMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [timeline, setTimeline] = useState<TimelineStep[]>([]);
  const [selectedStep, setSelectedStep] = useState<TimelineStep | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || loading) return;

    const userMsg: Message = { role: "user", content: inputText.trim() };
    const newHistory = [...messages, userMsg];

    setMessages(newHistory);
    setInputText("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant/test-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newHistory,
          safeMode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Agregar respuesta del asistente
      setMessages([
        ...newHistory,
        {
          role: "assistant",
          content: data.message.content,
          toolsUsed: data.toolExecutions?.map((t: any) => t.tool) || [],
        },
      ]);

      // Agregar pasos a la línea de tiempo
      if (Array.isArray(data.toolExecutions) && data.toolExecutions.length > 0) {
        const newSteps: TimelineStep[] = data.toolExecutions.map((t: any, idx: number) => ({
          id: `${Date.now()}-${idx}`,
          tool: t.tool,
          summary: t.uiTimelineSummary,
          args: t.args,
          output: t.output,
          isSimulated: t.isSimulated,
          time: new Intl.DateTimeFormat("es-ES", {
            timeZone: "Europe/Madrid",
            timeStyle: "medium",
          }).format(new Date()),
        }));
        setTimeline((prev) => [...prev, ...newSteps]);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "¡Hola! 👋 Soy Lumen, el asistente virtual de Clínica Dental Lumen. ¿En qué puedo ayudarte hoy?",
      },
    ]);
    setTimeline([]);
    setSelectedStep(null);
  };

  return (
    <div className="space-y-4">
      {/* Barra Superior con Switch Modo Seguro y Reiniciar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Simulador interactivo del asistente
            </h2>
            <p className="text-xs text-slate-500">
              Prueba la conversación y visualiza en tiempo real cada herramienta y consulta ejecutada.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Switch Modo Seguro */}
          <label className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer text-xs font-semibold text-slate-700">
            <Shield className={`w-4 h-4 ${safeMode ? "text-emerald-600" : "text-slate-400"}`} />
            <span>Modo seguro</span>
            <input
              type="checkbox"
              checked={safeMode}
              onChange={(e) => setSafeMode(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500 ml-1"
            />
          </label>

          <button
            type="button"
            onClick={handleResetChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Nueva conversación</span>
          </button>
        </div>
      </div>

      {/* Grid Principal: 2 Columnas (Chat Izquierda + Timeline Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[680px]">
        {/* Columna Izquierda: Chat interactivo (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {/* Cabecera del chat */}
          <div className="p-3.5 px-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-slate-800">
                Lumen (En línea · Clínica Dental Lumen)
              </span>
            </div>
            {safeMode && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                Modo Seguro Activo
              </span>
            )}
          </div>

          {/* Área de mensajes con scroll */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {messages.map((m, idx) => {
              const isAssistant = m.role === "assistant";
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 ${
                    isAssistant ? "justify-start" : "justify-end"
                  }`}
                >
                  {isAssistant && (
                    <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                      isAssistant
                        ? "bg-slate-100 text-slate-900 border border-slate-200/80 rounded-tl-sm"
                        : "bg-teal-600 text-white rounded-tr-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>

                    {m.toolsUsed && m.toolsUsed.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-[10px] text-teal-800 font-semibold">
                        <Wrench className="w-3 h-3 text-teal-600" />
                        <span>Tools utilizadas: {m.toolsUsed.join(", ")}</span>
                      </div>
                    )}
                  </div>

                  {!isAssistant && (
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200/80 rounded-tl-sm flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] font-medium text-slate-600">
                    Lumen está escribiendo y consultando herramientas…
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input inferior */}
          <form onSubmit={handleSendMessage} className="p-3.5 border-t border-slate-100 bg-white flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escribe como un cliente (ej: «¿Cuánto cuesta un blanqueamiento?» o «Quiero cita el martes»)..."
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>Enviar</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Columna Derecha: Línea de Tiempo de Herramientas para Vídeo (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {/* Cabecera del timeline */}
          <div className="p-3.5 px-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Línea de tiempo de herramientas ({timeline.length})
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">En vivo</span>
          </div>

          {/* Lista de pasos con estética cinematográfica para demos */}
          <div className="flex-1 p-5 overflow-y-auto space-y-3.5">
            {timeline.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs">
                <Wrench className="w-8 h-8 text-slate-300 mb-2 stroke-[1.5]" />
                <p className="font-semibold text-slate-600">Sin herramientas ejecutadas aún</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                  Envía un mensaje pidiendo una cita o consultando precios para ver aquí cada llamada a Google Calendar o la base de datos paso a paso.
                </p>
              </div>
            ) : (
              timeline.map((step) => {
                const isSelected = selectedStep?.id === step.id;
                return (
                  <div
                    key={step.id}
                    onClick={() => setSelectedStep(step)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-teal-50 border-teal-500 shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-mono font-bold text-teal-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {step.tool}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">{step.time}</span>
                    </div>

                    <p className="text-xs font-medium text-slate-800 leading-snug">
                      {step.summary}
                    </p>

                    {step.isSimulated && (
                      <span className="inline-block mt-1.5 text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold uppercase">
                        Simulado (Modo seguro)
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Modal / Panel inferior con detalles JSON de la tool seleccionada */}
          {selectedStep && (
            <div className="p-4 bg-slate-900 text-slate-200 text-[11px] font-mono border-t border-slate-800 max-h-48 overflow-y-auto">
              <div className="flex items-center justify-between pb-1 mb-2 border-b border-slate-700">
                <span className="font-bold text-teal-400">Detalles: {selectedStep.tool}</span>
                <button
                  type="button"
                  onClick={() => setSelectedStep(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <p className="text-slate-400 text-[10px] mb-1">Argumentos enviados:</p>
              <pre className="text-emerald-400 whitespace-pre-wrap">
                {JSON.stringify(selectedStep.args, null, 2)}
              </pre>
              <p className="text-slate-400 text-[10px] mt-2 mb-1">Respuesta recibida:</p>
              <pre className="text-sky-300 whitespace-pre-wrap">
                {JSON.stringify(selectedStep.output, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
