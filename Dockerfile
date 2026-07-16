# Telegram-бот (long polling). Лёгкий образ — без Playwright/chromium (это только ingest).
FROM node:22-slim

WORKDIR /app
# openssl — нужен движку Prisma; ca-certificates — для TLS к bothub/Telegram.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# --ignore-scripts: postinstall (prisma generate) требует schema, которой ещё нет —
# генерируем клиент явно ниже, после COPY prisma.
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY server ./server

# prisma generate не подключается к БД, но prisma.config.ts резолвит DATABASE_URL при загрузке.
# Заглушка на время сборки; реальный URL приходит в runtime через compose.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN pnpm exec prisma generate

CMD ["pnpm", "bot"]
