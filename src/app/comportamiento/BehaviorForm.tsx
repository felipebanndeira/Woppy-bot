"use client";

import { useState } from "react";
import { Check, Eye, Plus, Trash2, Bot, AlertCircle } from "lucide-react";

interface BehaviorFormProps {
  business: any;
  initialSettings: any;
}

export function BehaviorForm({ business, initialSettings }: BehaviorFormProps) {
  const [name, setName] = useState(initialSettings?.name || "Lumen");
  const [tone, setTone] = useState(initialSettings?.tone || "cercano");
  const [welcomeMessage, setWelcomeMessage] = useState(initialSettings?.welcomeMessage || "");
  const [instructions, setInstructions] = useState(initialSettings?.instructions || "");
  const [forbiddenRules, setForbiddenRules] = useState<string[]>(() => {
    try {
      return JSON.parse(initialSettings?.forbiddenRules || "[]");
    } catch {
      return [];
    }
  });
  const [newRule, setNewRule] = useState("");

  const [outOfHoursAction, setOutOfHoursAction] = useState(
    initialSettings?.outOfHoursAction || "appointment"
  );

  // Casillas de handoff
  const [handoffComplaint, setHandoffComplaint] = useState(
    initialSettings?.handoffComplaint ?? true
  );
  const [handoffUrgency, setHandoffUrgency] = useState(
    initialSettings?.handoffUrgency ?? true
  );
  const [handoffHumanAsk, setHandoffHumanAsk] = useState(
    initialSettings?.handoffHumanAsk ?? true
  );
  const [handoffUnknown, setHandoffUnknown] = useState(
    initialSettings?.handoffUnknown ?? true
  );
  const [handoffCustomRule, setHandoffCustomRule] = useState(
    initialSettings?.handoffCustomRule || ""
  );

  const [showPromptModal, setShowPromptModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    setForbiddenRules([...forbiddenRules, newRule.trim()]);
    setNewRule("");
  };

  const handleRemoveRule = (index: number) => {
    setForbiddenRules(forbiddenRules.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/assistant/behavior", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          tone,
          welcomeMessage,
          instructions,
          forbiddenRules,
          outOfHoursAction,
          handoffComplaint,
          handoffUrgency,
          handoffHumanAsk,
          handoffUnknown,
          handoffCustomRule,
        }),
      });

      if (!res.ok) throw new Error("Error al guardar la configuración");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  // Construcción del texto del prompt completo para previsualización
  const fullPromptPreview = `ERES EL ASISTENTE OFICIAL DE «${business?.name?.toUpperCase() || "EL NEGOCIO"}».
Actividad: ${business?.activity || "Atención al cliente"}
Dirección: ${business?.address || "No especificada"}
Teléfono: ${business?.phone || "No especificado"}
Sitio web: ${business?.website || "No especificado"}
Zona Horaria: Europe/Madrid

IDENTIDAD Y TONO:
- Nombre del asistente: ${name}
- Tono asignado: ${tone} (Exprésate de forma natural en español de España)
- Mensaje de bienvenida: "${welcomeMessage}"

INSTRUCCIONES PRINCIPALES:
${instructions}

LO QUE NUNCA DEBES HACER:
${forbiddenRules.map((r, i) => `${i + 1}. ${r}`).join("\n")}

REGLAS DE DERIVACIÓN A UNA PERSONA (HANDOFF):
- Queja o insatisfacción del cliente: ${handoffComplaint ? "SÍ (derivar inmediatamente)" : "NO"}
- Urgencia o emergencia: ${handoffUrgency ? "SÍ (derivar de inmediato y facilitar el teléfono del negocio)" : "NO"}
- El cliente pide hablar con una persona humana: ${handoffHumanAsk ? "SÍ (derivar con amabilidad)" : "NO"}
- No sabes la respuesta con seguridad: ${handoffUnknown ? "SÍ (admitirlo con sinceridad y ofrecer pasar con una persona)" : "NO"}
${handoffCustomRule ? `- Regla personalizada: ${handoffCustomRule}` : ""}

FUERA DEL HORARIO DE ATENCIÓN:
- Modo: ${
    outOfHoursAction === "appointment"
      ? "Seguir atendiendo con normalidad y permitir reservar citas para el horario de apertura."
      : "Indicar amablemente que el negocio está cerrado y solo tomar el recado para responder al abrir."
  }`;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Configuración del asistente guardada correctamente.</span>
        </div>
      )}

      {/* Nombre y Tono */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
          Identidad y Tono
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Nombre del asistente
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="Ej: Lumen"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Tono de comunicación
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["cercano", "profesional", "directo"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border capitalize transition-all ${
                    tone === t
                      ? "bg-teal-50 border-teal-500 text-teal-800 shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Mensaje de bienvenida
          </label>
          <textarea
            rows={3}
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Instrucciones y cosas prohibidas */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
          Instrucciones y Límites
        </h2>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Instrucciones en texto libre
          </label>
          <textarea
            rows={4}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Cosas que NUNCA debe hacer
          </label>
          <div className="space-y-2 mb-3">
            {forbiddenRules.map((rule, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
              >
                <span>• {rule}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveRule(idx)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              placeholder="Ej: Nunca dar consejos sobre medicación..."
              className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddRule();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddRule}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Horario y Fuera de Horario */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
          Comportamiento Fuera de Horario
        </h2>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
            ¿Qué contesta fuera de horario?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer ${
                outOfHoursAction === "appointment"
                  ? "bg-teal-50 border-teal-500 text-teal-900"
                  : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              <input
                type="radio"
                name="outOfHours"
                checked={outOfHoursAction === "appointment"}
                onChange={() => setOutOfHoursAction("appointment")}
                className="mt-1"
              />
              <div>
                <p className="text-xs font-bold">Seguir atendiendo y dar cita</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Responde dudas y ofrece huecos en la agenda para días posteriores.
                </p>
              </div>
            </label>

            <label
              className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer ${
                outOfHoursAction === "message"
                  ? "bg-teal-50 border-teal-500 text-teal-900"
                  : "bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              <input
                type="radio"
                name="outOfHours"
                checked={outOfHoursAction === "message"}
                onChange={() => setOutOfHoursAction("message")}
                className="mt-1"
              />
              <div>
                <p className="text-xs font-bold">Solo tomar el recado</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Informa del horario del centro y anota nombre y consulta para responder al abrir.
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Cuándo pasar a una persona */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3">
          Derivación a una persona del equipo (Handoff)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={handoffComplaint}
              onChange={(e) => setHandoffComplaint(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            <span className="text-xs font-medium text-slate-800">Cuando hay una queja</span>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={handoffUrgency}
              onChange={(e) => setHandoffUrgency(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            <span className="text-xs font-medium text-slate-800">
              Urgencia (indica teléfono del centro)
            </span>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={handoffHumanAsk}
              onChange={(e) => setHandoffHumanAsk(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            <span className="text-xs font-medium text-slate-800">
              Pide hablar con alguien
            </span>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={handoffUnknown}
              onChange={(e) => setHandoffUnknown(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            <span className="text-xs font-medium text-slate-800">No sabe la respuesta</span>
          </label>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Regla personalizada adicional
          </label>
          <input
            type="text"
            value={handoffCustomRule}
            onChange={(e) => setHandoffCustomRule(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
            placeholder="Ej: Si menciona un dolor agudo o traumatismo dental..."
          />
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => setShowPromptModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold shadow-sm transition-all"
        >
          <Eye className="w-4 h-4 text-slate-500" />
          <span>Ver el prompt completo</span>
        </button>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      {/* Modal Prompt Completo */}
      {showPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-teal-700 font-semibold text-sm">
                <Bot className="w-5 h-5" />
                <span>Prompt del Sistema generado (Solo Lectura)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPromptModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 p-4 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono whitespace-pre-wrap leading-relaxed">
              {fullPromptPreview}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowPromptModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cerrar vista previa
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
