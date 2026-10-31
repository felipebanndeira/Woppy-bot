import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wopyy Nails & Lashes — Panel de Asistente IA",
  description: "Asistente de IA para WhatsApp, Instagram y web de Wopyy Nails & Lashes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-900 selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
