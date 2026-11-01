import "dotenv/config";
import { WhatsAppManager } from "./whatsapp";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("🛠️ [Worker] Iniciando proceso worker de larga duración...");

  const wa = new WhatsAppManager();
  await wa.startSocket();

  // Escuchar órdenes desde el panel web (Desconectar, Reconectar, etc.)
  setInterval(async () => {
    try {
      const commands = await prisma.workerCommand.findMany({
        where: { isHandled: false },
        orderBy: { createdAt: "asc" },
      });

      for (const cmd of commands) {
        if (cmd.command === "DISCONNECT") {
          console.log("🛠️ [Worker] Ejecutando orden: DISCONNECT");
          await wa.disconnect();
        } else if (cmd.command === "RECONNECT") {
          console.log("🛠️ [Worker] Ejecutando orden: RECONNECT (Re-generando QR)");
          await wa.disconnect();
          await wa.startSocket();
        }

        await prisma.workerCommand.update({
          where: { id: cmd.id },
          data: { isHandled: true },
        });
      }
    } catch (e) {
      // Ignorar fallos de sondeo
    }
  }, 3000);
}

main().catch(console.error);
