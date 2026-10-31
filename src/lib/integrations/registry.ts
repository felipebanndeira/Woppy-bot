import { prisma } from "../prisma";
import { encrypt, decrypt } from "../crypto";

export interface IntegrationDefinition {
  provider: "GOOGLE_CALENDAR" | "GMAIL" | "GOOGLE_SHEETS" | "SLACK" | "STRIPE" | "WEBHOOK";
  name: string;
  description: string;
  logo: string;
  badge?: string;
  authType: "oauth" | "webhook_url" | "api_key";
}

export const INTEGRATIONS_CATALOG: IntegrationDefinition[] = [
  {
    provider: "GOOGLE_CALENDAR",
    name: "Google Calendar",
    description: "Sincroniza y agenda citas directamente en el calendario del negocio con control de huecos libres.",
    logo: "google_calendar",
    authType: "oauth",
  },
  {
    provider: "GMAIL",
    name: "Gmail",
    description: "Envía correos de confirmación al cliente y el resumen diario de actividad y citas al dueño.",
    logo: "gmail",
    authType: "oauth",
  },
  {
    provider: "GOOGLE_SHEETS",
    name: "Google Sheets",
    description: "Crea y actualiza automáticamente la hoja de contactos y pacientes generados.",
    logo: "google_sheets",
    authType: "oauth",
  },
  {
    provider: "SLACK",
    name: "Slack",
    description: "Envía alertas en tiempo real a tu canal de Slack cuando un cliente pide hablar con una persona o se crea una cita.",
    logo: "slack",
    authType: "webhook_url",
  },
  {
    provider: "STRIPE",
    name: "Stripe",
    description: "Genera enlaces de pago protegidos para cobrar la señal de las citas antes de confirmarlas.",
    logo: "stripe",
    authType: "api_key",
  },
  {
    provider: "WEBHOOK",
    name: "Webhooks externos",
    description: "Dispara eventos firmados con HMAC hacia n8n, Make, Zapier o servidores propios.",
    logo: "webhook",
    authType: "webhook_url",
  },
];
