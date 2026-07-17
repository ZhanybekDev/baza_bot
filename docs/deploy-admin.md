# Деплой админки (Часть 2)

Админка — тот же Nuxt-проект, что и бот, но запускается как отдельный сервис
(`node .output/server/index.mjs`). Собирается из `Dockerfile.admin` (база — playwright,
чтобы кнопка «переобновить» могла поднять headed chromium под xvfb).

Локально всё зелёное: `eslint` 0, `vue-tsc` 0, `nuxt build` OK. Все страницы отдают 200
на живой БД (642 чанка, 13 проектов, последний парсинг SUCCESS).

## Что уже сделано автономно

- Код админки (`app/pages/admin/*`, `app/components/ui/*`, `server/api/admin/*`) — закоммичен в `feat/admin`.
- `Dockerfile.admin` + сервис `admin` в `docker-compose.prod.yml` (порт `127.0.0.1:3000`).
- Образ `baza-bot-admin:prod` собран локально под `linux/amd64` (см. `docker images`).

## Почему деплой не доведён до публичной ссылки автономно

Публичный URL идёт через **Cloudflare Tunnel**, конфиг которого лежит на сервере вне репозитория,
и создание публичного хоста требует доступа к аккаунту Cloudflare. Плюс SSH-пользователь сервера
нигде в проекте не задокументирован. Выставление панели наружу — действие, которое подтверждаем руками.

## Шаги (на сервере, 10 минут)

### 1. Перенести образ на сервер

С Mac (образ уже собран):

```bash
docker save baza-bot-admin:prod | gzip | \
  ssh <user>@<SERVER_HOST> 'gunzip | docker load'
```

### 2. Поднять сервис

На сервере, в каталоге с `docker-compose.prod.yml` (там же лежит `.env` с `POSTGRES_PASSWORD`,
`BOTHUB_API_KEY`). Сервис `admin` использует `image: baza-bot-admin:prod` через override
(`docker-compose.deploy.yml`, не в git) — либо временно замените `build:` на `image:` в `admin`:

```bash
docker compose -f docker-compose.prod.yml up -d admin
docker compose -f docker-compose.prod.yml logs -f admin   # ждём "Listening on http://0.0.0.0:3000"
curl -s localhost:3000/api/admin/sources | head -c 200      # проверка: JSON с sources
```

### 3. Выставить наружу через Cloudflare Tunnel

Добавить ingress-правило в конфиг `cloudflared` на сервере
(`~/.cloudflared/config.yml` или dashboard-managed tunnel):

```yaml
ingress:
  - hostname: baza-admin.<ваш-домен>
    service: http://localhost:3000
  # ... существующие правила ...
  - service: http_status:404
```

Затем `sudo systemctl restart cloudflared` (или пересоздать через dashboard).
DNS-запись `baza-admin` → tunnel создаётся автоматически (dashboard) или `cloudflared tunnel route dns`.

### 4. Защита доступа (важно)

У панели **нет своей авторизации**. Не оставляйте её открытой публично — поставьте перед ней
**Cloudflare Access** (Zero Trust → Applications → Self-hosted, политика по email). 5 минут в dashboard.

## Кнопка «переобновить» в проде

Сервис `admin` собран из playwright-базы и запускает ingest как `xvfb-run -a pnpm ingest`
(переменная `INGEST_COMMAND`). Прогресс — через опрос `IngestRun` на дашборде.
Первый прогон тяжёлый (headed chromium под xvfb, паузы против троттлинга портала).
