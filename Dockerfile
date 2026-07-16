# Telegram-бот (long polling). Лёгкий образ — без Playwright/chromium (это только ingest).
FROM node:22-slim

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
# pnpm HTTP-клиент рвёт крупные пакеты (Prisma) внутри Docker, хотя реестр достижим.
# Store накапливается между попытками, поэтому повторяем install до успеха (официальный npm).
RUN pnpm config set fetch-retries 8 \
 && pnpm config set fetch-retry-maxtimeout 180000 \
 && pnpm config set network-concurrency 1 \
 && for i in 1 2 3 4 5 6 7 8; do pnpm install --frozen-lockfile && break || { echo "install attempt $i failed, retrying..."; sleep 8; }; done \
 && pnpm install --frozen-lockfile

COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json ./
COPY server ./server

RUN pnpm exec prisma generate

CMD ["pnpm", "bot"]
