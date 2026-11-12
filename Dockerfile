# Build stage: install deps, generate Prisma client, build Next.js
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json* ./
# Retry flaky registry connections (ECONNRESET) instead of failing the whole build.
RUN npm config set fetch-retries 6 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && npm ci --no-audit --no-fund
COPY . .
# A placeholder URL is enough for `prisma generate`; the real one is injected at runtime.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npx prisma generate && npm run build

# Runtime stage: standalone server + Prisma CLI for migrations
FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
ENV PORT=3000
# Next's standalone server binds to $HOSTNAME, which Docker/Render set to the container id.
# Force it to listen on all interfaces so the platform's router can reach it.
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
# Prisma CLI lives in its own folder with a proper install, so all of its
# dependencies come along (copying individual packages out of node_modules is brittle).
RUN mkdir -p /opt/prisma-cli && cd /opt/prisma-cli && npm init -y >/dev/null \
 && npm config set fetch-retries 6 && npm install prisma@6.19.3 --no-audit --no-fund

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
CMD ["./docker-entrypoint.sh"]
