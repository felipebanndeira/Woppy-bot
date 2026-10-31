"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  BookOpen,
  Puzzle,
  Radio,
  Sparkles,
  MessageSquare,
  Activity,
  Settings,
  LogOut,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  agencyName?: string;
  agencyLogo?: string | null;
  businessName?: string;
  assistantName?: string;
  isAssistantActive?: boolean;
}

const navItems = [
  { href: "/", label: "Resumen", icon: LayoutDashboard },
  { href: "/comportamiento", label: "Comportamiento", icon: Bot },
  { href: "/conocimiento", label: "Conocimiento", icon: BookOpen },
  { href: "/integraciones", label: "Integraciones", icon: Puzzle },
  { href: "/canales", label: "Canales", icon: Radio },
  { href: "/probar", label: "Probar", icon: Sparkles, badge: "Vídeo" },
  { href: "/conversaciones", label: "Conversaciones", icon: MessageSquare },
  { href: "/actividad", label: "Actividad", icon: Activity },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
];

export function Sidebar({
  agencyName = "Atiende",
  businessName = "Clínica Dental Lumen",
  assistantName = "Lumen",
  isAssistantActive = true,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-screen">
      {/* Cabecera / Marca de la Agencia */}
      <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            A
          </div>
          <div>
            <h1 className="font-semibold text-slate-900 tracking-tight text-base leading-tight">
              {agencyName}
            </h1>
            <span className="text-[11px] text-slate-600 font-medium tracking-wide uppercase">
              Panel Asistente IA
            </span>
          </div>
        </div>
      </div>

      {/* Negocio activo y estado del asistente */}
      <div className="p-4 mx-3 my-3 bg-slate-50 border border-slate-200/80 rounded-xl">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-800">
          <Building2 className="w-3.5 h-3.5 text-teal-700" />
          <span className="truncate">{businessName}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-slate-600">Asistente: <strong>{assistantName}</strong></span>
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
              isAssistantActive
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            )}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full mr-1",
                isAssistantActive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              )}
            />
            {isAssistantActive ? "Activo" : "Pausado"}
          </span>
        </div>
      </div>

      {/* Navegación Principal */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-teal-50 text-teal-900 border border-teal-200/60 shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              )}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={cn(
                    "w-4 h-4",
                    isActive ? "text-teal-700" : "text-slate-600"
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Pie de navegación / Cerrar sesión */}
      <div className="p-4 border-t border-slate-200">
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center space-x-2.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
