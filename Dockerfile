# ─────────────────────────────────────────────────────────────────────────────
# Maplebrook International Academy — production image
# Requires Node 22.5+ (built-in `node:sqlite`).
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/db ./db
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/next.config.mjs ./next.config.mjs

# Runtime data (SQLite DB + uploads) live in mounted volumes.
RUN mkdir -p /app/data /app/uploads /app/logs

EXPOSE 3000
CMD ["npm", "run", "start"]
