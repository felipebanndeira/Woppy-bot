"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AssistantToggleProps {
  initialStatus: boolean;
}

export function AssistantToggle({ initialStatus }: AssistantToggleProps) {
  const [enabled, setEnabled] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/assistant/toggle-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setEnabled(data.isEnabled);
        router.refresh();
      }
    } catch (err) {
      console.error("Error al cambiar estado:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
      <span className="text-sm font-medium text-slate-700 pl-2">
        Asistente {enabled ? "encendido" : "en pausa"}
      </span>
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm ${
          enabled
            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
            : "bg-slate-200 hover:bg-slate-300 text-slate-700"
        } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        {loading
          ? "Cambiando..."
          : enabled
          ? "Encendido (Atendiendo)"
          : "En pausa"}
      </button>
    </div>
  );
}
