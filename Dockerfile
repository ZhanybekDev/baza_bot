# Telegram-бот (long polling). Лёгкий образ — без Playwright/chromium (это только ingest).
FROM node:22-slim

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
# network-concurrency=1 + retries: сервер рвёт параллельную загрузку крупных пакетов (Prisma).
RUN pnpm config set fetch-retries 5 \
 && pnpm config set fetch-retry-maxtimeout 120000 \
 && pnpm config set network-concurrency 1 \
 && pnpm install --frozen-lockfile

COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json ./
COPY server ./server

RUN pnpm exec prisma generate

CMD ["pnpm", "bot"]
