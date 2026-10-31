"use client";

import { useState, useEffect } from "react";
import {
  Cpu,
  RefreshCw,
  Search,
  DollarSign,
  Calculator,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from "lucide-react";

interface SettingsManagerProps {
  business: any;
  assistant: any;
  branding: any;
  users: any[];
  hasApiKey: boolean;
}

export function SettingsManager({
  business,
  assistant,
  branding,
  users,
  hasApiKey: initialHasKey,
}: SettingsManagerProps) {
  const [activeTab, setActiveTab] = useState<"ai" | "branding" | "users">("ai");

  // Modelos de OpenRouter
  const [models, setModels] = useState<any[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [selectedModel, setSelectedModel] = useState(
    assistant?.selectedModel || "anthropic/claude-haiku-5.5"
  );
  const [searchModel, setSearchModel] = useState("");
  const [filterProvider, setFilterProvider] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"price" | "name">("price");

  // Estimador de costes
  const [inputTokensEst, setInputTokensEst] = useState(20000);
  const [outputTokensEst, setOutputTokensEst] = useState(2000);

  // Clave y Saldo de OpenRouter
  const [keyInfo, setKeyInfo] = useState<any>(null);

  // Marca de agencia
  const [agencyName, setAgencyName] = useState(branding?.agencyName || "Atiende");

  // Cargar modelos
  const fetchModels = async (force = false) => {
    setLoadingModels(true);
    try {
      const res = await fetch(`/api/openrouter/models?force=${force}`);
      const data = await res.json();
      setModels(data.models || []);
    } catch {
      console.error("Error al cargar modelos");
    } finally {
      setLoadingModels(false);
    }
  };

  // Cargar info de la clave
  const fetchKeyInfo = async () => {
    try {
      const res = await fetch("/api/openrouter/key");
      const data = await res.json();
      setKeyInfo(data);
    } catch {}
  };

  useEffect(() => {
    fetchModels();
    fetchKeyInfo();
  }, []);

  // Modelo actualmente seleccionado
  const currentModelObj =
    models.find((m) => m.id === selectedModel) || {
      id: selectedModel,
      name: selectedModel,
      provider: "OpenRouter",
      promptPrice: 0.8,
      completionPrice: 4.0,
      contextLength: 200000,
    };

  // Cálculo estimador (1.000 conversaciones)
  const monthlyCostEstimate =
    (1000 *
      (inputTokensEst * (currentModelObj.promptPrice / 1_000_000) +
        outputTokensEst * (currentModelObj.completionPrice / 1_000_000))) ||
    0;

  // Filtrado de modelos
  const filteredModels = models
    .filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchModel.toLowerCase()) ||
        m.id.toLowerCase().includes(searchModel.toLowerCase()) ||
        m.provider.toLowerCase().includes(searchModel.toLowerCase());

      if (!matchesSearch) return false;

      if (filterProvider === "free") return m.isFree;
      if (filterProvider === "anthropic") return m.id.startsWith("anthropic/");
      if (filterProvider === "google") return m.id.startsWith("google/");
      if (filterProvider === "openai") return m.id.startsWith("openai/");

      return true;
    })
    .sort((a, b) => {
      if (sortOrder === "price") {
        return a.promptPrice + a.completionPrice - (b.promptPrice + b.completionPrice);
      }
      return a.name.localeCompare(b.name);
    });

  const handleSaveModel = async (modelId: string) => {
    setSelectedModel(modelId);
    const targetModel = models.find((m) => m.id === modelId);
    try {
      await fetch("/api/assistant/model", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId,
          inputCost: targetModel?.promptPrice || 0.8,
          outputCost: targetModel?.completionPrice || 4.0,
        }),
      });
    } catch {
      alert("Error al guardar el modelo");
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/agency/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyName }),
      });
      alert("Marca blanca guardada correctamente");
      window.location.reload();
    } catch {
      alert("Error al guardar marca");
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("ai")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "ai"
              ? "bg-teal-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Modelo de Inteligencia Artificial</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("branding")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "branding"
              ? "bg-teal-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Marca Blanca de la Agencia</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "users"
              ? "bg-teal-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Usuarios y Equipo ({users.length})</span>
        </button>
      </div>

      {/* Tab: IA y OpenRouter */}
      {activeTab === "ai" && (
        <div className="space-y-6">
          {/* Tarjeta Estado de la Clave OpenRouter */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  keyInfo?.configured
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "bg-amber-50 text-amber-600 border border-amber-200"
                }`}
              >
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Clave de API OpenRouter
                </p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {keyInfo?.configured
                    ? "Configurada de forma segura en el servidor"
                    : "No configurada aún en .env (OPENROUTER_API_KEY)"}
                </p>
                {keyInfo?.label && (
                  <p className="text-[11px] text-slate-500">Etiqueta: {keyInfo.label}</p>
                )}
              </div>
            </div>

            {keyInfo?.configured && keyInfo.balance !== null && (
              <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-right">
                <span className="text-[10px] uppercase font-semibold text-slate-500">
                  Saldo restante
                </span>
                <p className="text-base font-bold text-slate-900">${keyInfo.balance} USD</p>
              </div>
            )}
          </div>

          {/* Estimador de costes */}
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-6 rounded-2xl border border-teal-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-teal-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Estimación de costes para 1.000 conversaciones / mes
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Coste estimado:</span>
                <p className="text-xl font-bold text-teal-900">
                  ${monthlyCostEstimate.toFixed(2)} USD / mes
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Calculado con el modelo actual <strong>{currentModelObj.name}</strong> (${currentModelObj.promptPrice} / M entrada y ${currentModelObj.completionPrice} / M salida).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">
                  Tokens de entrada por conversación
                </label>
                <input
                  type="number"
                  value={inputTokensEst}
                  onChange={(e) => setInputTokensEst(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-600 mb-1">
                  Tokens de salida por conversación
                </label>
                <input
                  type="number"
                  value={outputTokensEst}
                  onChange={(e) => setOutputTokensEst(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Selector y buscador de modelos */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Catálogo de modelos compatibles con herramientas (tools)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Solo se listan modelos que admiten invocación de funciones para gestionar citas y contactos.
                </p>
              </div>

              <button
                type="button"
                onClick={() => fetchModels(true)}
                disabled={loadingModels}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingModels ? "animate-spin" : ""}`} />
                <span>Actualizar catálogo</span>
              </button>
            </div>

            {/* Buscador y Filtros */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchModel}
                  onChange={(e) => setSearchModel(e.target.value)}
                  placeholder="Buscar modelo por nombre, proveedor o ID..."
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: "all", label: "Todos" },
                  { id: "free", label: "Gratis" },
                  { id: "anthropic", label: "Anthropic" },
                  { id: "google", label: "Google" },
                  { id: "openai", label: "OpenAI" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilterProvider(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      filterProvider === f.id
                        ? "bg-teal-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de Modelos */}
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
              {filteredModels.map((m) => {
                const isSelected = selectedModel === m.id;
                const isRecommended = m.id === "anthropic/claude-haiku-5.5";

                return (
                  <div
                    key={m.id}
                    onClick={() => handleSaveModel(m.id)}
                    className={`p-3.5 flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                      isSelected ? "bg-teal-50/80" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900">{m.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          {m.provider}
                        </span>
                        {isRecommended && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold">
                            Recomendado
                          </span>
                        )}
                        {m.isFree && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                            Gratis
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-slate-400">{m.id}</p>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-800">
                          {m.isFree
                            ? "Gratis"
                            : `$${m.promptPrice.toFixed(2)} in / $${m.completionPrice.toFixed(2)} out`}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {Math.round(m.contextLength / 1000)}k contexto
                        </p>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? "border-teal-600 bg-teal-600 text-white"
                            : "border-slate-300"
                        }`}
                      >
                        {isSelected && <span className="text-xs">✓</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Marca Blanca */}
      {activeTab === "branding" && (
        <form
          onSubmit={handleSaveBranding}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 text-xs"
        >
          <div>
            <h3 className="text-base font-semibold text-slate-900">Marca de tu Agencia</h3>
            <p className="text-slate-500 mt-0.5">
              Este nombre y logotipo aparecerán en la barra lateral y en la pantalla de inicio de sesión de tus clientes.
            </p>
          </div>

          <div>
            <label className="block font-semibold uppercase text-slate-600 mb-1">
              Nombre de la agencia
            </label>
            <input
              type="text"
              required
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
              placeholder="Ej: Atiende"
            />
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl shadow-sm"
            >
              Guardar marca
            </button>
          </div>
        </form>
      )}

      {/* Tab: Usuarios */}
      {activeTab === "users" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">
              Miembros con acceso al panel
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {users.map((u) => (
              <div key={u.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{u.name}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                  {u.role === "ADMIN" ? "Administrador" : "Miembro"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
