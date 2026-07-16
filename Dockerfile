# Telegram-бот (long polling). Лёгкий образ — без Playwright/chromium (это только ingest).
FROM node:22-slim

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json ./
COPY server ./server

RUN pnpm exec prisma generate

CMD ["pnpm", "bot"]
