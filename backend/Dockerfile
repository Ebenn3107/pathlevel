# ── Build Stage ─────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

RUN apk add --no-cache openssl

# Install ALL dependencies (including devDeps for TypeScript build)
COPY package.json package-lock.json ./
RUN npm ci

# Generate Prisma client from schema
COPY prisma/ ./prisma/
RUN npx prisma generate

# Compile TypeScript to dist/
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ── Runtime Stage ──────────────────────────────────────
FROM node:22-alpine AS runtime

WORKDIR /app

RUN apk add --no-cache openssl tini

# Install production dependencies (skip postinstall — we copy generated client)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy Prisma schema + migrations (needed for future migrations at runtime)
COPY prisma/ ./prisma/

# Copy pre-generated Prisma client from build stage
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# Copy compiled backend
COPY --from=build /app/dist ./dist

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

USER node

ENTRYPOINT ["tini", "--"]
CMD ["node", "dist/server.js"]
