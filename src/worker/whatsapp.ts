import { Boom } from "@hapi/boom";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
} from "@whiskeysockets/baileys";
import pino from "pino";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";
import { runAssistantChat } from "../lib/assistant/chatEngine";

interface PendingMessage {
  text: string;
  senderName?: string;
  timestamp: number;
}

// Buffer de debouncing de 8 segundos por conversación de WhatsApp
const debounceQueues = new Map<string, { messages: PendingMessage[]; timer: NodeJS.Timeout }>();

export class WhatsAppManager {
  private sock: any = null;
  private sessionDir: string;
  private isConnecting: boolean = false;

  constructor() {
    this.sessionDir = process.env.WHATSAPP_SESSION_DIR || "./data/whatsapp_session";
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
    }
  }

  public async startSocket() {
    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.sessionDir);
      const { version } = await fetchLatestBaileysVersion();

      console.log(`📡 [WhatsApp Worker] Iniciando Baileys v${version.join(".")}...`);

      this.sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        browser: Browsers.macOS("Desktop"),
        syncFullHistory: false,
        generateHighQualityLinkPreview: true,
      });

      this.sock.ev.on("creds.update", saveCreds);

      this.sock.ev.on("connection.update", async (update: any) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          console.log("📲 [WhatsApp Worker] Nuevo código QR recibido.");
          try {
            const qrDataUrl = await QRCode.toDataURL(qr);
            await prisma.channelSettings.upsert({
              where: { channel: "WHATSAPP" },
              update: {
                qrCode: qrDataUrl,
                connectionStatus: "WAITING_QR",
              },
              create: {
                channel: "WHATSAPP",
                qrCode: qrDataUrl,
                connectionStatus: "WAITING_QR",
              },
            });
          } catch (err) {
            console.error("Error generando QR DataURL:", err);
          }
        }

        if (connection === "close") {
          const shouldReconnect =
            (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
          console.log("⚠️ [WhatsApp Worker] Conexión cerrada. ¿Reconectar?", shouldReconnect);

          await prisma.channelSettings.upsert({
            where: { channel: "WHATSAPP" },
            update: {
              connectionStatus: "DISCONNECTED",
              qrCode: null,
            },
            create: {
              channel: "WHATSAPP",
              connectionStatus: "DISCONNECTED",
            },
          });

          this.isConnecting = false;
          if (shouldReconnect) {
            setTimeout(() => this.startSocket(), 5000);
          }
        } else if (connection === "open") {
          console.log("✅ [WhatsApp Worker] ¡Conexión establecida con éxito!");
          const userJid = this.sock.user?.id || "";
          const phoneNumber = userJid.split(":")[0]?.replace("@s.whatsapp.net", "") || "";
          const lid = this.sock.user?.lid || null;

          await prisma.channelSettings.upsert({
            where: { channel: "WHATSAPP" },
            update: {
              connectionStatus: "CONNECTED",
              connectedNumber: phoneNumber,
              connectedLid: lid,
              qrCode: null,
            },
            create: {
              channel: "WHATSAPP",
              connectionStatus: "CONNECTED",
              connectedNumber: phoneNumber,
              connectedLid: lid,
            },
          });

          await prisma.activityLog.create({
            data: {
              channel: "WHATSAPP",
              action: `WhatsApp conectado con número +${phoneNumber}`,
              result: "SUCCESS",
            },
          });

          this.isConnecting = false;
        }
      });

      // Manejador de Mensajes entrantes con Buffer de 8 segundos
      this.sock.ev.on("messages.upsert", async (m: any) => {
        if (m.type !== "notify") return;

        for (const msg of m.messages) {
          // Ignorar mensajes propios, de grupos o de difusión
          if (msg.key.fromMe) continue;
          const jid = msg.key.remoteJid;
          if (!jid || jid.endsWith("@g.us") || jid === "status@broadcast") continue;

          // Extraer texto
          const text =
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            "";

          // Si llega audio o imagen, pedir amablemente que lo escriba
          const isMedia = Boolean(
            msg.message?.imageMessage ||
            msg.message?.audioMessage ||
            msg.message?.voiceMessage ||
            msg.message?.videoMessage
          );

          if (isMedia && !text) {
            await this.sock.sendMessage(jid, {
              text: "Disculpa, por el momento no puedo escuchar audios ni ver imágenes. ¿Podrías por favor escribirme tu consulta en texto para atenderte? ¡Muchas gracias!",
            });
            continue;
          }

          if (!text) continue;

          this.queueMessage(jid, {
            text,
            senderName: msg.pushName || "Cliente WhatsApp",
            timestamp: Date.now(),
          });
        }
      });
    } catch (error) {
      console.error("Error al iniciar socket Baileys:", error);
      this.isConnecting = false;
    }
  }

  /**
   * Acumula mensajes entrantes de un usuario durante 8 segundos.
   */
  private queueMessage(jid: string, pending: PendingMessage) {
    let existing = debounceQueues.get(jid);

    if (existing) {
      clearTimeout(existing.timer);
      existing.messages.push(pending);
    } else {
      existing = {
        messages: [pending],
        timer: null as any,
      };
      debounceQueues.set(jid, existing);
    }

    // Configurar timer de 8 segundos
    existing.timer = setTimeout(async () => {
      const items = debounceQueues.get(jid)?.messages || [];
      debounceQueues.delete(jid);

      if (items.length === 0) return;

      const combinedText = items.map((i) => i.text).join("\n");
      const senderName = items[0]?.senderName || "Cliente";

      await this.processAccumulatedMessages(jid, combinedText, senderName);
    }, 8000);
  }

  /**
   * Procesa los mensajes acumulados, activa estado 'escribiendo' e invoca al asistente.
   */
  private async processAccumulatedMessages(jid: string, text: string, senderName: string) {
    try {
      const rawNumber = jid.split("@")[0].split(":")[0];
      const phoneNumber = `+${rawNumber}`;

      // 1. Buscar o crear Contacto y Conversación
      let contact = await prisma.contact.findFirst({
        where: { phone: phoneNumber },
      });

      if (!contact) {
        contact = await prisma.contact.create({
          data: {
            name: senderName,
            phone: phoneNumber,
            channel: "WHATSAPP",
          },
        });
      }

      let conv = await prisma.conversation.findFirst({
        where: { contactId: contact.id, channel: "WHATSAPP" },
      });

      if (!conv) {
        conv = await prisma.conversation.create({
          data: {
            contactId: contact.id,
            channel: "WHATSAPP",
            status: "ACTIVE",
          },
        });
      }

      // Guardar mensaje entrante del cliente
      await prisma.message.create({
        data: {
          conversationId: conv.id,
          senderType: "CLIENT",
          content: text,
        },
      });

      // Si la conversación fue tomada por una persona o el asistente está pausado, no responder automáticamente
      const assistant = await prisma.assistantSettings.findFirst();
      if (!assistant?.isEnabled || conv.status === "HUMAN_CONTROL") {
        return;
      }

      // 2. Activar presencia "composing" (escribiendo...) en WhatsApp
      if (this.sock) {
        await this.sock.sendPresenceUpdate("composing", jid);
      }

      // 3. Ejecutar motor de IA con historial
      const history = await prisma.message.findMany({
        where: { conversationId: conv.id },
        orderBy: { createdAt: "asc" },
        take: 20,
      });

      const formattedHistory = history.map((h) => ({
        role: h.senderType === "CLIENT" ? ("user" as const) : ("assistant" as const),
        content: h.content,
      }));

      const reply = await runAssistantChat({
        messages: formattedHistory,
        contactId: contact.id,
        conversationId: conv.id,
      });

      // 4. Enviar respuesta final por WhatsApp
      if (this.sock) {
        await this.sock.sendMessage(jid, { text: reply.content });
      }

      // 5. Guardar respuesta del asistente en BD
      await prisma.message.create({
        data: {
          conversationId: conv.id,
          senderType: "ASSISTANT",
          content: reply.content,
          toolCalls: JSON.stringify(reply.toolExecutions),
        },
      });

      // Actualizar timestamp de la conversación
      await prisma.conversation.update({
        where: { id: conv.id },
        data: { lastMessageAt: new Date() },
      });
    } catch (error) {
      console.error("Error al procesar mensajes acumulados:", error);
    }
  }

  public async disconnect() {
    try {
      if (this.sock) {
        await this.sock.logout();
        this.sock = null;
      }
      if (fs.existsSync(this.sessionDir)) {
        fs.rmSync(this.sessionDir, { recursive: true, force: true });
      }
      await prisma.channelSettings.upsert({
        where: { channel: "WHATSAPP" },
        update: { connectionStatus: "DISCONNECTED", connectedNumber: null, qrCode: null },
        create: { channel: "WHATSAPP", connectionStatus: "DISCONNECTED" },
      });
    } catch (err) {
      console.error("Error al desconectar WhatsApp:", err);
    }
  }
}
