# STRUCTURE.md — baza_bot

Карта проекта. Обновляется при любом изменении структуры директорий, добавлении/удалении модулей, смене архитектурных границ.

**Последнее обновление:** 2026-07-16

> **Phase 1 реализована** (ветка `feat/ingest`): реестр + ingest. `app/` и `server/core/*`,
> `server/api/*` — из Phase 2/3, ещё не созданы. Дерево ниже отражает реализованное + целевое.

---

## Дерево проекта

```
baza_bot/
├── docker-compose.yml            # pgvector/pgvector:pg17, хост-порт 5433
├── docker-compose.prod.yml       # прод-стек для домашнего сервера
├── Dockerfile                    # Nuxt app (бот)
├── Dockerfile.ingest             # chromium + xvfb для headed-парсинга
├── nuxt.config.ts
├── prisma/
│   ├── schema.prisma             # Project, Source, Document, Chunk, IngestRun, Intent, CannedAnswer, Manager, Dialog, Message
│   └── migrations/               # init: CREATE EXTENSION vector + vector(1024) руками
├── server/
│   ├── db/client.ts              # Prisma через @prisma/adapter-pg
│   ├── registry/
│   │   ├── projects.ts           # 11 проектов: алиасы, регион, класс, fee{base,bonus,bonusRule}
│   │   └── sources.ts            # 17 фиксированных источников
│   ├── ingest/
│   │   ├── fetchers/             # site (headed Playwright), gdocs, yadisk, portal (обход дерева)
│   │   ├── parsers/              # xlsx, docx, pptx, pdf
│   │   ├── chunk.ts              # structure-aware чанки с метаданными
│   │   ├── embed.ts              # bge-m3 батчами по 64
│   │   └── run.ts                # оркестратор + CLI (pnpm ingest)
│   ├── core/
│   │   ├── router.ts             # keyword fast-path + регистронезависимый alias-роутер
│   │   ├── intents.ts, canned/   # 10 групп, авторские тексты, региональная привязка
│   │   ├── retrieve.ts           # project-scoped контекст; pgvector для безымянных
│   │   ├── prompt.ts, answer.ts  # промпт + сборка ответа, дословное цитирование
│   │   └── stt.ts                # Soniox stt-async-v5 (Phase 3)
│   ├── api/telegram.post.ts      # grammY webhook
│   └── plugins/bot.ts            # инициализация бота
├── app/                          # Nuxt 4 UI (Часть 2 — админка, Часть 3 — Figma-страница)
├── .env.example
├── README.md                     # инструкция запуска + обоснование архитектуры + таблица замеров
└── .claude/                      # план, research, reviews, rules (в репо — требование ТЗ)
```

---

## Компоненты верхнего уровня

| Директория | Назначение | Владелец (слой) |
|---|---|---|
| `server/registry/` | Единственный источник истины о проектах и источниках | Domain |
| `server/ingest/` | Публичный URL → сырой текст → чанки → эмбеддинги → pgvector | Data pipeline |
| `server/core/` | Вопрос → маршрутизация → ответ (canned / RAG / «не знаю») | Application |
| `server/api/` | Telegram webhook — точка входа | Interface |
| `prisma/` | Схема БД + миграции (vector правится вручную) | Persistence |

---

## Граф зависимостей

```
telegram.post.ts → core/router → core/{canned, retrieve} → registry/{projects, sources}
                                        ↓                          ↓
                                   db/client (Prisma)         ingest (наполняет)
                                        ↓                          ↓
                                   Postgres+pgvector          bothub / Soniox / порталы
```

---

## Критичные файлы (нельзя трогать без причины)

- `prisma/migrations/*_init/migration.sql` — `CREATE EXTENSION vector` + `vector(1024)` заданы **вручную**; Prisma их не генерирует. `prisma db pull` **запрещён** — сгенерирует DROP колонки embedding.
- `server/registry/projects.ts` — атрибуция проекта, регион и комиссия. Ошибка = неверный процент вознаграждения агенту.
- `server/api/telegram.post.ts` — webhook с secret token.

---

## Entry points

| Что запускается | Где | Как |
|---|---|---|
| Dev server | `nuxt.config.ts` | `pnpm dev` |
| Ingest базы знаний | `server/ingest/run.ts` | `pnpm ingest` |
| Tests | `**/*.test.ts` | `pnpm test` |
| Build | `nuxt.config.ts` | `pnpm build` |

---

## External dependencies (runtime)

- **Database:** PostgreSQL 17 + pgvector 0.8.5 (хост-порт 5433 локально, 5432 занят `postgresql@18`)
- **External APIs:** bothub (LLM+эмбеддинги), Soniox (STT), Telegram Bot API, Yandex Disk API, Google export, портал realtors.baza.bz

---

## Conventions

### Naming
- TypeScript: camelCase для переменных/функций, PascalCase для типов/моделей Prisma.
- Файлы: kebab-case или lowercase (`telegram.post.ts` по конвенции Nitro).

### File organization
- Вся логика — в `server/`. `registry/` — данные-как-код, `ingest/` — наполнение, `core/` — ответ.
- UI (`app/`) появляется в Части 2.

### Import aliases
- `~/` и `@/` → корень проекта (Nuxt 4 дефолт).

---

## How to navigate (быстрый гайд для новой сессии Claude)

1. `CLAUDE.md` — правила и Golden Rule.
2. `MEMORY.md` — свежий контекст.
3. `.claude/plans/current-plan.md` — актуальный план (v13, APPROVED).
4. `.claude/rules/project-hard-rules.md` — выстраданные тех-правила (NFC, headed chromium, троттлинг портала…).
5. Эту карту — где что лежит.
