"use client";

import { useState } from "react";
import {
  Globe,
  Plus,
  Trash2,
  Check,
  Building,
  HelpCircle,
  Briefcase,
  Download,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface KnowledgeManagerProps {
  business: any;
  services: any[];
  faqs: any[];
}

export function KnowledgeManager({
  business,
  services: initialServices,
  faqs: initialFaqs,
}: KnowledgeManagerProps) {
  const [activeTab, setActiveTab] = useState<"business" | "services" | "faqs">("services");

  // Estados de negocio
  const [name, setName] = useState(business?.name || "");
  const [activity, setActivity] = useState(business?.activity || "");
  const [address, setAddress] = useState(business?.address || "");
  const [phone, setPhone] = useState(business?.phone || "");
  const [website, setWebsite] = useState(business?.website || "");
  const [generalInfo, setGeneralInfo] = useState(business?.generalInfo || "");

  // Servicios
  const [services, setServices] = useState(initialServices);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState(50);
  const [newServiceDuration, setNewServiceDuration] = useState(30);
  const [newServicePriceType, setNewServicePriceType] = useState<"exacto" | "desde">("desde");
  const [newServiceAssessment, setNewServiceAssessment] = useState(false);
  const [newServiceDesc, setNewServiceDesc] = useState("");

  // FAQs
  const [faqs, setFaqs] = useState(initialFaqs);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");

  // Scraper web
  const [importUrl, setImportUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapedPreview, setScrapedPreview] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, activity, address, phone, website, generalInfo }),
      });
      if (res.ok) {
        setStatusMessage("Datos del negocio guardados");
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch {
      alert("Error al guardar");
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newServiceName,
          description: newServiceDesc,
          durationMin: Number(newServiceDuration),
          price: Number(newServicePrice),
          priceType: newServicePriceType,
          requiresAssessment: newServiceAssessment,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setServices([...services, data.service]);
        setNewServiceName("");
        setNewServiceDesc("");
      }
    } catch (e) {
      alert("Error al crear servicio");
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("¿Eliminar este servicio?")) return;
    try {
      await fetch(`/api/services/${id}`, { method: "DELETE" });
      setServices(services.filter((s) => s.id !== id));
    } catch {
      alert("Error al eliminar");
    }
  };

  const handleCreateFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;

    try {
      const res = await fetch("/api/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: newQuestion, answer: newAnswer }),
      });
      const data = await res.json();
      if (res.ok) {
        setFaqs([...faqs, data.faq]);
        setNewQuestion("");
        setNewAnswer("");
      }
    } catch {
      alert("Error al crear FAQ");
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm("¿Eliminar esta pregunta frecuente?")) return;
    try {
      await fetch(`/api/faqs/${id}`, { method: "DELETE" });
      setFaqs(faqs.filter((f) => f.id !== id));
    } catch {
      alert("Error al eliminar");
    }
  };

  const handleImportWeb = async () => {
    if (!importUrl) return;
    setScraping(true);
    setScrapedPreview(null);
    try {
      const res = await fetch("/api/assistant/import-web", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setScrapedPreview(result.data);
    } catch (err: any) {
      alert(err.message || "Error al rastrear la web");
    } finally {
      setScraping(false);
    }
  };

  const handleApplyImportedData = async () => {
    if (!scrapedPreview) return;
    try {
      // Actualizar perfil de negocio
      if (scrapedPreview.business) {
        setName(scrapedPreview.business.name || name);
        setActivity(scrapedPreview.business.activity || activity);
        setAddress(scrapedPreview.business.address || address);
        setPhone(scrapedPreview.business.phone || phone);
        setWebsite(scrapedPreview.business.website || website);
        setGeneralInfo(scrapedPreview.business.generalInfo || generalInfo);
      }

      // Aplicar servicios y faqs via API
      const res = await fetch("/api/assistant/apply-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scrapedPreview),
      });

      if (res.ok) {
        alert("¡Datos importados y guardados con éxito!");
        window.location.reload();
      }
    } catch {
      alert("Error al guardar datos importados");
    }
  };

  return (
    <div className="space-y-6">
      {statusMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Caja de Importación desde Web */}
      <div className="bg-gradient-to-r from-teal-50 to-indigo-50 p-6 rounded-2xl border border-teal-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Importar conocimiento desde una página web
            </h2>
            <p className="text-xs text-slate-600">
              Pega la URL de tu cliente: rastreará hasta 5 páginas internas y estructurará servicios, tarifas y FAQs con IA.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="url"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            placeholder="https://ejemplo-clinica.es"
            className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
          <button
            type="button"
            disabled={scraping || !importUrl}
            onClick={handleImportWeb}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            {scraping ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Rastreando y procesando...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Importar con IA</span>
              </>
            )}
          </button>
        </div>

        {/* Previsualización del rastreo */}
        {scrapedPreview && (
          <div className="mt-4 p-5 bg-white rounded-xl border border-teal-300 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-teal-800">
                Resultado de la extracción con IA
              </span>
              <button
                type="button"
                onClick={handleApplyImportedData}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-sm"
              >
                Aplicar y guardar en el catálogo
              </button>
            </div>

            <div>
              <p className="font-semibold text-slate-700">Negocio:</p>
              <p className="text-slate-600">{scrapedPreview.business?.name} — {scrapedPreview.business?.activity}</p>
            </div>

            <div>
              <p className="font-semibold text-slate-700">
                Servicios detectados ({scrapedPreview.services?.length || 0}):
              </p>
              <ul className="list-disc list-inside text-slate-600 mt-1">
                {scrapedPreview.services?.map((s: any, idx: number) => (
                  <li key={idx}>
                    <strong>{s.name}</strong> ({s.durationMin} min) — {s.priceType === "desde" ? "Desde " : ""}${s.price.toLocaleString("es-AR")}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-semibold text-slate-700">
                Preguntas frecuentes detectadas ({scrapedPreview.faqs?.length || 0}):
              </p>
              <ul className="list-disc list-inside text-slate-600 mt-1">
                {scrapedPreview.faqs?.map((f: any, idx: number) => (
                  <li key={idx}>{f.question}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("services")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "services"
              ? "bg-teal-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Servicios y Tarifas ({services.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("faqs")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "faqs"
              ? "bg-teal-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Preguntas Frecuentes ({faqs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("business")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "business"
              ? "bg-teal-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Datos del Negocio</span>
        </button>
      </div>

      {/* Tab: Servicios */}
      {activeTab === "services" && (
        <div className="space-y-6">
          <form
            onSubmit={handleCreateService}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs"
          >
            <h3 className="font-semibold text-slate-900 text-sm">Añadir nuevo servicio</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="Ej: Empaste dental"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Precio ($ ARS)</label>
                <div className="flex gap-2">
                  <select
                    value={newServicePriceType}
                    onChange={(e: any) => setNewServicePriceType(e.target.value)}
                    className="px-2 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="exacto">Exacto</option>
                    <option value="desde">Desde</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(Number(e.target.value))}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Duración (minutos)</label>
                <input
                  type="number"
                  value={newServiceDuration}
                  onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">Descripción</label>
              <textarea
                rows={2}
                value={newServiceDesc}
                onChange={(e) => setNewServiceDesc(e.target.value)}
                placeholder="Breve explicación del tratamiento para el paciente..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newServiceAssessment}
                  onChange={(e) => setNewServiceAssessment(e.target.checked)}
                  className="rounded text-teal-600"
                />
                <span className="text-slate-700">Requiere valoración o diagnóstico previo</span>
              </label>

              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir servicio</span>
              </button>
            </div>
          </form>

          {/* Lista de Servicios */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
            {services.map((s) => (
              <div key={s.id} className="p-4 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h4 className="font-semibold text-slate-900 text-sm">{s.name}</h4>
                    {s.requiresAssessment && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        Requiere valoración previa
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{s.description}</p>
                  <p className="text-xs text-slate-700 font-medium">
                    {s.priceType === "desde" ? "Desde " : ""}
                    {formatCurrency(s.price)} · {s.durationMin} minutos
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteService(s.id)}
                  className="text-slate-400 hover:text-rose-600 p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: FAQs */}
      {activeTab === "faqs" && (
        <div className="space-y-6">
          <form
            onSubmit={handleCreateFaq}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs"
          >
            <h3 className="font-semibold text-slate-900 text-sm">Añadir nueva pregunta frecuente</h3>
            <div>
              <label className="block font-medium text-slate-600 mb-1">Pregunta</label>
              <input
                type="text"
                required
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Ej: ¿Dónde puedo aparcar cerca?"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">Respuesta</label>
              <textarea
                rows={3}
                required
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                placeholder="Respuesta concisa que el asistente usará para contestar al cliente..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Guardar pregunta</span>
              </button>
            </div>
          </form>

          {/* Lista de FAQs */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
            {faqs.map((f) => (
              <div key={f.id} className="p-4 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-teal-600 shrink-0" />
                    <h4 className="font-semibold text-slate-900 text-sm">{f.question}</h4>
                  </div>
                  <p className="text-xs text-slate-600 pl-6 leading-relaxed">{f.answer}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteFaq(f.id)}
                  className="text-slate-400 hover:text-rose-600 p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Datos del Negocio */}
      {activeTab === "business" && (
        <form
          onSubmit={handleSaveBusiness}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold uppercase text-slate-600 mb-1">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase text-slate-600 mb-1">Actividad</label>
              <input
                type="text"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase text-slate-600 mb-1">Dirección</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase text-slate-600 mb-1">Teléfono</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold uppercase text-slate-600 mb-1">Sitio Web</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold uppercase text-slate-600 mb-1">
                Información libre complementaria
              </label>
              <textarea
                rows={4}
                value={generalInfo}
                onChange={(e) => setGeneralInfo(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl shadow-sm"
            >
              Guardar datos del negocio
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
