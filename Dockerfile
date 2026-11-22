# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 kunooze

COPY --from=builder --chown=kunooze:nodejs /app/dist ./dist
COPY --from=builder --chown=kunooze:nodejs /app/package.json ./package.json
COPY --from=builder --chown=kunooze:nodejs /app/node_modules ./node_modules

USER kunooze

EXPOSE 3000

CMD ["node", "dist/index.js"]
