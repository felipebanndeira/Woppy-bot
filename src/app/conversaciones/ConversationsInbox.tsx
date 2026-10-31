"use client";

import { useState } from "react";
import {
  MessageSquare,
  Search,
  Filter,
  UserCheck,
  Bot,
  User,
  Shield,
  Send,
  Wrench,
  Clock,
  ChevronDown,
  RotateCcw,
} from "lucide-react";

interface ConversationsInboxProps {
  conversations: any[];
}

export function ConversationsInbox({ conversations: initialConversations }: ConversationsInboxProps) {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedId, setSelectedId] = useState<string>(initialConversations[0]?.id || "");
  const [filterType, setFilterType] = useState<"all" | "needs_attention" | "whatsapp" | "web">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);
  const [expandedToolsId, setExpandedToolsId] = useState<string | null>(null);

  const selectedConv = conversations.find((c) => c.id === selectedId) || conversations[0];

  const filteredList = conversations.filter((c) => {
    const contactName = c.contact?.name || "Sin nombre";
    const phone = c.contact?.phone || "";
    const lastMsg = c.messages[c.messages.length - 1]?.content || "";

    const matchesSearch =
      contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.includes(searchQuery) ||
      lastMsg.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === "needs_attention") {
      return c.status === "HANDOFF_REQUIRED" || c.status === "HUMAN_CONTROL";
    }
    if (filterType === "whatsapp") return c.channel === "WHATSAPP";
    if (filterType === "web") return c.channel === "WEB";

    return true;
  });

  const handleTakeControl = async (id: string) => {
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/conversations/${id}/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "take_control" }),
      });
      if (res.ok) {
        setConversations(
          conversations.map((c) => (c.id === id ? { ...c, status: "HUMAN_CONTROL" } : c))
        );
      }
    } catch {
      alert("Error al tomar control");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleReturnToAssistant = async (id: string) => {
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/conversations/${id}/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "return_to_assistant" }),
      });
      if (res.ok) {
        setConversations(
          conversations.map((c) => (c.id === id ? { ...c, status: "ACTIVE" } : c))
        );
      }
    } catch {
      alert("Error al devolver");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSendHumanReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConv) return;

    try {
      const res = await fetch(`/api/conversations/${selectedConv.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setConversations(
          conversations.map((c) =>
            c.id === selectedConv.id ? { ...c, messages: [...c.messages, data.message] } : c
          )
        );
        setReplyText("");
      }
    } catch {
      alert("Error al enviar mensaje");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[720px]">
      {/* Columna Izquierda: Lista de Conversaciones (5 cols) */}
      <div className="md:col-span-5 border-r border-slate-200 flex flex-col h-full bg-slate-50/50">
        {/* Cabecera con buscador y filtros */}
        <div className="p-4 border-b border-slate-200 space-y-3 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, teléfono o texto..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1 text-[11px]">
            {[
              { id: "all", label: "Todas" },
              { id: "needs_attention", label: "Necesitan atención" },
              { id: "whatsapp", label: "WhatsApp" },
              { id: "web", label: "Web" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterType(f.id as any)}
                className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  filterType === f.id
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de chats */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredList.map((c) => {
            const isSelected = c.id === selectedId;
            const lastMsg = c.messages[c.messages.length - 1];
            const needsHuman = c.status === "HANDOFF_REQUIRED" || c.status === "HUMAN_CONTROL";

            return (
              <div
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`p-4 cursor-pointer transition-colors ${
                  isSelected ? "bg-white shadow-sm" : "hover:bg-slate-100/60"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">
                      {c.contact?.name || c.contact?.phone || "Cliente"}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-slate-200 text-slate-700">
                      {c.channel}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400">
                    {new Intl.DateTimeFormat("es-ES", {
                      timeZone: "Europe/Madrid",
                      timeStyle: "short",
                    }).format(new Date(c.lastMessageAt))}
                  </span>
                </div>

                <p className="text-xs text-slate-500 truncate">{lastMsg?.content || "Sin mensajes"}</p>

                {needsHuman && (
                  <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                    {c.status === "HUMAN_CONTROL" ? "Control Humano Activo" : "Requiere Persona"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Columna Derecha: Conversación Abierta (7 cols) */}
      <div className="md:col-span-7 flex flex-col h-full bg-white">
        {selectedConv ? (
          <>
            {/* Cabecera del chat abierto */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {selectedConv.contact?.name || "Cliente"}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedConv.contact?.phone || selectedConv.contact?.email || "Sin teléfono"} · Canal {selectedConv.channel}
                </p>
              </div>

              {/* Botón Tomar el Control / Devolver */}
              <div>
                {selectedConv.status === "HUMAN_CONTROL" ? (
                  <button
                    type="button"
                    onClick={() => handleReturnToAssistant(selectedConv.id)}
                    disabled={loadingAction}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Devolver al asistente</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleTakeControl(selectedConv.id)}
                    disabled={loadingAction}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Tomar el control</span>
                  </button>
                )}
              </div>
            </div>

            {/* Mensajes de la conversación */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/30">
              {selectedConv.messages.map((m: any) => {
                const isClient = m.senderType === "CLIENT";
                const isAssistant = m.senderType === "ASSISTANT";
                const isHuman = m.senderType === "HUMAN_AGENT";

                let toolCallsParsed: any[] = [];
                try {
                  if (m.toolCalls) toolCallsParsed = JSON.parse(m.toolCalls);
                } catch {}

                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-2.5 ${
                      isClient ? "justify-start" : "justify-end"
                    }`}
                  >
                    {isClient && (
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div
                      className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs shadow-sm leading-relaxed ${
                        isClient
                          ? "bg-white text-slate-800 border border-slate-200 rounded-tl-sm"
                          : isAssistant
                          ? "bg-teal-50 text-teal-950 border border-teal-200/80 rounded-tr-sm"
                          : "bg-indigo-600 text-white rounded-tr-sm font-medium"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] mb-1 opacity-70">
                        <span>
                          {isClient ? "Cliente" : isAssistant ? "Lumen (IA)" : "Persona del Equipo"}
                        </span>
                        <span>
                          {new Intl.DateTimeFormat("es-ES", {
                            timeZone: "Europe/Madrid",
                            timeStyle: "short",
                          }).format(new Date(m.createdAt))}
                        </span>
                      </div>

                      <p className="whitespace-pre-wrap">{m.content}</p>

                      {/* Icono desplegable de tools usadas si las hubo */}
                      {isAssistant && toolCallsParsed.length > 0 && (
                        <div className="mt-2 pt-1.5 border-t border-teal-200/60">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedToolsId(expandedToolsId === m.id ? null : m.id)
                            }
                            className="flex items-center gap-1 text-[10px] font-bold text-teal-800 hover:underline"
                          >
                            <Wrench className="w-3 h-3 text-teal-700" />
                            <span>Herramientas utilizadas ({toolCallsParsed.length})</span>
                            <ChevronDown className="w-3 h-3" />
                          </button>

                          {expandedToolsId === m.id && (
                            <div className="mt-1.5 p-2 bg-slate-900 text-teal-300 rounded-lg text-[10px] font-mono whitespace-pre-wrap">
                              {JSON.stringify(toolCallsParsed, null, 2)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {!isClient && (
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white ${
                          isAssistant ? "bg-teal-600" : "bg-indigo-600"
                        }`}
                      >
                        {isAssistant ? <Bot className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Input de respuesta humana */}
            <form onSubmit={handleSendHumanReply} className="p-3.5 border-t border-slate-200 bg-white flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={
                  selectedConv.status === "HUMAN_CONTROL"
                    ? "Escribe tu respuesta como persona del equipo..."
                    : "Toma el control para responder manualmente como humano..."
                }
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                <span>Enviar</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs">
            Selecciona una conversación de la lista
          </div>
        )}
      </div>
    </div>
  );
}
