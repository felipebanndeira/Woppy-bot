import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { prisma } from "@/lib/prisma";

export async function DashboardShell({ children }: { children: ReactNode }) {
  const [branding, business, assistant] = await Promise.all([
    prisma.agencyBranding.findFirst(),
    prisma.businessProfile.findFirst(),
    prisma.assistantSettings.findFirst(),
  ]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        agencyName={branding?.agencyName || "Atiende"}
        agencyLogo={branding?.agencyLogo}
        businessName={business?.name || "Wopyy Nails"}
        assistantName={assistant?.name || "Wopyy"}
        isAssistantActive={assistant?.isEnabled ?? true}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 md:p-8 lg:p-10">{children}</div>
      </main>
    </div>
  );
}
