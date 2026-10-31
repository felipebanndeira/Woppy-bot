# 1. Base multietapa con Node 20 / 22 Alpine
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

# 2. Instalación de dependencias
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
COPY prisma7.config.ts ./
RUN npm ci

# 3. Compilación de la aplicación Next.js
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npx prisma generate
RUN npm run build

# 4. Imagen final ligera de producción
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Crear usuario sin privilegios
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Crear directorio persistente para sesión de WhatsApp
RUN mkdir -p /app/data/whatsapp_session && chown -R nextjs:nodejs /app/data

# Copiar artefactos de compilación
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma7.config.ts ./
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/src ./src

USER nextjs

EXPOSE 3000

# Script de inicio por defecto: ejecuta migraciones y arranca Next.js
# Si el contenedor se arranca con 'npm run worker', ejecuta el worker de Baileys
CMD ["sh", "-c", "npx prisma migrate deploy && ([ \"$SEED_DEMO\" = \"true\" ] && npx tsx src/scripts/seed.ts || true) && npm run start"]
