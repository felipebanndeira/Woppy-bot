# Wopyy Nails & Lashes — Asistente de IA para WhatsApp e Instagram

Asistente virtual de Inteligencia Artificial para **Wopyy Nails & Lashes** (Celene Yoselin Caceres). Atiende clientas automáticamente por WhatsApp, Instagram y Chat Web: brinda información de servicios y precios, responde dudas frecuentes, coordina turnos y explica las políticas de seña y tarjeta de fidelidad.

---

## 💅 Servicios y Precios Configurados

### 🌸 Uñas
- **Semipermanentes:** $13.000 (duración ~60 min)
- **Semi con Diseño:** $15.000 (duración ~75 min)
- **Semi en Pies:** $13.000 (duración ~60 min)
- **Kapping Liso:** $15.000 (duración ~75 min)
- **Kapping con Diseño:** $17.000 (duración ~90 min)
- **Kapping en Pies:** $15.000 (duración ~60 min)
- **Soft Gel Lisas:** $20.000 (duración ~90 min)
- **Soft Gel con Diseño:** $23.000 (duración ~105 min)

### 🧼 Retirados
- **Retirado en Semi:** $4.000 (duración ~30 min)
- **Retirado Kapping:** $5.000 (duración ~40 min)
- **Retirado Soft Gel:** $8.000 (duración ~45 min)

### ✨ Pestañas
- **Clásicas:** $25.000 (efecto pelo por pelo natural)
- **Volumen Medio:** $30.000 (mayor densidad y definición)
- **Efecto Lifting:** $35.000 (mirada abierta y curvada sin tanto volumen)
- **Efecto Foxy:** $40.000 (mirada felina alargada)

---

## 🏦 Datos Oficiales de Seña y Pagos
- **Alias:** `celene..65`
- **Titular:** Caceres Celene Yoselin
- **WhatsApp Oficial:** `+54 9 3755 65-8105`
- **Ubicación:** Oberá, Misiones, Argentina

---

## 🚀 Cómo Iniciar el Panel y el Asistente

### 1. Iniciar la Base de Datos y el Panel Web:
```bash
cd "agente Ia"
npm run dev
```
O de forma independiente:
- **Base de datos:** `npm run dev:db`
- **Panel Web:** `npm run dev:web -- -p 3005`
- **Worker de WhatsApp (Baileys):** `npm run dev:worker`

### 2. Acceso al Panel de Control:
- **URL:** [http://localhost:3005](http://localhost:3005)
- **Usuario:** `admin@atiende.es`
- **Contraseña:** `AdminSeguro123!`

### 3. Vincular WhatsApp con Código QR:
1. Ingresa a [http://localhost:3005/canales](http://localhost:3005/canales).
2. Escanea el código QR desde tu celular en **WhatsApp > Dispositivos vinculados**.
3. ¡Listo! El bot responderá automáticamente los mensajes entrantes con las respuestas y precios de Wopyy.
