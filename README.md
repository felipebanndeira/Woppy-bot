# «Atiende» — Asistente de IA para Negocios Locales

«Atiende» es una plataforma para que agencias instalen y configuren un asistente de inteligencia artificial que atiende a los clientes de un negocio local por WhatsApp y chat web, sincroniza citas en Google Calendar, cobra señas con Stripe, notifica al equipo humano por Slack y transfiere el control a una persona cuando hace falta.

Toda la interfaz está en español de España y opera en la zona horaria `Europe/Madrid`.

---

## 🚀 Pasos para arrancar en local

### 1. Requisitos
- Node.js versión 20 o superior.
- No necesitas tener Docker instalado: la base de datos PostgreSQL local se levanta automáticamente mediante el PostgreSQL local de Prisma (`prisma dev`).

### 2. Configurar variables de entorno
Copia el archivo de ejemplo:
```bash
cp .env.example .env
```
Las credenciales de acceso iniciales por defecto son:
- **Correo:** `admin@atiende.es`
- **Contraseña:** `AdminSeguro123!`

Si deseas usar llamadas reales de IA mediante modelos avanzados como Claude Haiku 3.5 o Sonnet, coloca tu clave de [OpenRouter](https://openrouter.ai/keys) en `OPENROUTER_API_KEY`. Si no tienes clave al momento, el sistema incluye un simulador inteligente local con llamadas a herramientas funcionales para pruebas.

### 3. Arrancar la aplicación
Con un solo comando arrancas la base de datos, el panel web y el worker:
```bash
npm run dev
```
O de forma individual:
- **Base de datos:** `npm run dev:db`
- **Panel Web Next.js:** `npm run dev:web`
- **Worker de WhatsApp y cron:** `npm run dev:worker`

Abre en tu navegador: [http://localhost:3000](http://localhost:3000)

---

## 📱 Pantallas Principales

1. **Resumen (`/`):** Switch general de encendido/pausa, métricas clave (citas creadas, conversaciones activas, transferencias pendientes) y últimas acciones.
2. **Comportamiento (`/comportamiento`):** Nombre, avatar, selector de tono (cercano, profesional, directo), mensaje de bienvenida, reglas prohibidas, horario semanal, reglas de pase a persona y botón modal **«Ver el prompt completo»**.
3. **Conocimiento (`/conocimiento`):** Ficha del negocio, catálogo de servicios con precio/duración, FAQs y la herramienta **«Importar desde una web»** que rastrea hasta 5 páginas internas y propone servicios y tarifas estructurados con IA.
4. **Integraciones (`/integraciones`):** Catálogo modular con logos oficiales:
   - **Google Calendar:** Sincronización y reserva de citas con autorización incremental OAuth.
   - **Gmail:** Envío de confirmaciones y resumen diario al propietario.
   - **Google Sheets:** Creación de hoja restringida y sincronización de contactos.
   - **Slack:** Notificaciones al canal con botón «Enviar mensaje de prueba».
   - **Stripe:** Enlaces de pago para señas con detección de modo test.
   - **Webhooks:** Emisión de eventos firmados con clave secreta HMAC-SHA256 para n8n/Make/Zapier.
5. **Canales (`/canales`):**
   - **WhatsApp:** Conexión Baileys con código QR transmitido por Server-Sent Events (SSE), buffer de 8 segundos y persistencia en disco.
   - **Chat Web:** Generador del script embebible y vista previa interactiva en `/demo`.
6. **Probar (`/probar`):** Simulador diseñado para grabación en vídeo: chat interactivo a la izquierda y línea de tiempo de ejecución de herramientas a la derecha, con switch de **Modo Seguro** (simula creación de citas y cobros sin alterar datos reales).
7. **Conversaciones (`/conversaciones`):** Bandeja dividida con filtros (Todas, Necesitan atención, WhatsApp, Web), diferenciación visual de burbujas, desplegable de herramientas ejecutadas y botones **«Tomar el control»** y **«Devolver al asistente»**.
8. **Actividad (`/actividad`):** Histórico completo de eventos, herramientas y llamadas a integraciones con detalles y estados.
9. **Ajustes (`/ajustes`):** Selector dinámico de modelos de OpenRouter filtrados por compatibilidad con herramientas (`tools`), precios por millón de tokens, estimador mensual para 1.000 conversaciones y marca blanca de la agencia.

---

## 🚢 Despliegue en Producción

La carpeta raíz incluye los archivos de producción listos para su uso:
- `Dockerfile`: Construcción multietapa ligera optimizada que arranca como servidor web o worker según el comando.
- `docker-compose.yml`: Configuración completa para Hostinger con soporte para el proxy de Traefik (`traefik-proxy`), certificados Let's Encrypt automáticos y red interna aislada sin publicar puertos.
- `.github/workflows/build-and-publish.yml`: Pipeline para construir y publicar la imagen en GitHub Container Registry (`ghcr.io`).
