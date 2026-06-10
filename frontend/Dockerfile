# ── Build Stage ─────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# VITE_API_URL defaults to /api (proxied by nginx in production)
ARG VITE_API_URL=/api

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Build the app
COPY . .
RUN VITE_API_URL=${VITE_API_URL} npm run build

# ── Runtime Stage ──────────────────────────────────────
FROM nginx:stable-alpine AS runtime

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration (mounted/copied at compose level or baked in)
# The nginx.conf is expected at /etc/nginx/conf.d/default.conf
# We handle this via docker-compose volume mount

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
