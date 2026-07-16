# TESTING-SKILL.md — baza_bot

**ВАЖНО:** этот файл читается в **отдельной сессии Claude Code**, посвящённой только тестированию. Не смешивай тестирование и разработку в одной сессии — контекст забивается, агент начинает подгонять тесты под код.

---

## Обязательные правила

> **ПРАВИЛО №1:** весь софт покрыт unit-тестами. Без исключений. Каждый модуль, каждая функция, каждый сервис.

| Обязательно ДЛЯ baza_bot | ЗАПРЕЩЕНО |
|---|---|
| ✅ Unit-тесты на 100% кода | ❌ Код без unit-тестов в PR |
| ✅ Backend E2E (API flows на реальной DB, не моках) | ❌ Тесты в той же сессии что разработка |
| ✅ Браузер: на реальных данных, не моках, desktop only | ❌ Браузерные тесты на моках |
| ✅ Отдельная сессия Claude Code для тестов | ❌ Тестирование мобильных (desktop only) |
| ✅ Скилл агента (этот файл) подгружается первым | ❌ `test.skip` / пустые тесты |
| ✅ Доска тестирования обновляется по итогам | ❌ Merge без подписанного отчёта |

---

## Контекст проекта

### Стек

- **Название:** baza_bot
- **Тип:** saas-ui
- **Frontend:** Nuxt 4.4 + Vue 3 + TypeScript
- **Backend:** Nitro (server/) + grammY
- **Database:** PostgreSQL 17 + pgvector
- **Unit framework:** Vitest
- **E2E framework:** Playwright

### Команды

| Что | Команда |
|---|---|
| Unit | `pnpm test` |
| E2E | _(заполни — обычно `npm run test:e2e` или `pytest tests/e2e`)_ |
| Coverage | _(заполни — `npm run test:coverage` / `pytest --cov`)_ |
| Lint | `pnpm lint && pnpm typecheck` |

### Base URL (для браузерных тестов)

_(заполни — обычно `http://localhost:3000` или порт dev-сервера)_

### Целевые браузеры (desktop only)

Chrome, Firefox, Safari _(скорректируй под проект)_

### Критичные user flows

ответы бота по 12 тест-кейсам заказчика, повторяемый ingest, голосовые сообщения

### Внешние API

bothub (LLM+эмбеддинги), Soniox (STT), Telegram Bot API, Yandex Disk, Google export, портал realtors.baza.bz

**Правило моков:** мокаются ТОЛЬКО внешние API (чтобы не тратить rate limits и не зависеть от их доступности). Внутренняя БД и внутренние сервисы — реальные.

---

## Правило разделения сессий

| Сессия 1: Разработка | Сессия 2: Тестирование | Сессия 3: Браузер |
|---|---|---|
| Пишем фичи, фиксим баги | Новая сессия Claude Code | Реальные данные, не моки |
| Рефакторинг | Unit + backend E2E | Desktop браузеры |
| **Не тестируем тут** | Этот файл подгружается | Сотрудник проверяет руками |
| | **Чистый контекст** | Визуальная верификация |

**Как начать testing session:**
1. Открой новую Claude Code сессию в корне проекта.
2. Первый промпт: `Read TESTING-SKILL.md. This is a testing session. Do not write feature code.`
3. Дальше — используй промпты из раздела ниже.

---

## Testing Map

_(Обновляй по мере роста проекта. Для каждого модуля — текущий статус покрытия.)_

| Модуль | Unit coverage | E2E | Browser | Priority |
|---|---|---|---|---|
| _(example)_ | 0% | ❌ | ❌ | high |

Статусы:
- ✅ — покрыто и проходит
- ⚠️ — частично покрыто
- ❌ — не покрыто
- **[NOT COVERED]** — явно помеченный пробел

---

## Test Patterns — project-specific

### Fixtures / factories

_(Где лежат тестовые фикстуры, как добавлять новые)_

### Test DB setup

_(Как поднять тестовую БД. Обычно отдельная БД, или docker-compose test service, или in-memory SQLite как fallback)_

### Common edge cases для домена

_(Типичные границы: пустые массивы, null, больше max, меньше min, конкурентные записи, timezone edge cases, etc.)_

---

## Промпты для сессии тестирования

Скопируй в Claude Code когда в testing-сессии.

### Написать новые unit-тесты для модуля

```
Write unit tests for ALL untested functions in [module/path].
Use Vitest.
Cover: happy path, edge cases (null, empty, boundary, errors).
Naming: should_[expected]_when_[condition].
Run and fix until green.
```

### Добить unit coverage до 100%

```
Run coverage for entire project: pnpm test --coverage (или аналог).
List all files below 80% branch coverage.
Write tests for each.
Goal: 100% branch coverage for business logic.
Show final coverage report.
```

### Backend E2E для эндпойнта

```
Write E2E tests for ALL endpoints in [router/module].
Test full request lifecycle with REAL test DB (not mocks).
Cover: valid data, validation errors, auth required, not found, duplicate, concurrent updates.
Verify response schemas match Pydantic/TypeScript definitions.
```

### Browser тесты для flow

```
Write Playwright (or Playwright) tests for [flow from Critical Flows].
Use REAL test data: seed DB before tests, don't mock API responses.
Run on: Chrome, Firefox, Safari (desktop only).
Screenshot on failure.
```

### Обновить testing board

```
Review this TESTING-SKILL.md.
Show testing status as a table: module | unit | e2e | browser | priority.
Mark new [NOT COVERED] modules if any.
Update the board in [project tracker].
```

### PR-отчёт

```
Run all tests: pnpm test and E2E command.
Show:
- passed / failed / skipped counts
- coverage %
- flaky tests
- test.skip count (should be 0)
Format as Markdown table for PR.
```

---

## Чек-лист перед merge

- [ ] Весь новый код покрыт unit-тестами (coverage diff = 0% нового кода без тестов)
- [ ] Assertions проверяют **спецификацию**, не реализацию
- [ ] Backend E2E идёт через реальную DB (нет моков на DB-уровне)
- [ ] Browser тесты на реальных данных, desktop (нет `cy.intercept` / mock API)
- [ ] Тесты писались в отдельной сессии (не в той же что код)
- [ ] Нет `test.skip` / `xit` / `it.only` / `describe.only`
- [ ] Доска тестирования обновлена
- [ ] PR-отчёт вложен

---

## Шаблон PR-отчёта

```markdown
## Тестирование — baza_bot

**Unit:** ___ passed, ___ failed | Coverage: ___% branches
**Backend E2E:** ___ passed | Endpoints: ___
**Browser (desktop, real data):** Chrome / Firefox / Safari — ___ scenarios
**Сессия тестирования:** отдельная ✅
**Доска:** обновлена ✅
**Подпись:** _______________  |  Дата: ______
```

---

## Testing board — структура

Колонки в таск-трекере:

| Не покрыто | Пишутся тесты | На ревью | Проверено | Браузер OK |
|---|---|---|---|---|
| Модули без unit, API без E2E | Сессия в процессе | Тесты готовы, ждут проверки | Unit + E2E прошли ревью | Browser на реальных данных — OK |

---

> **СТОИМОСТЬ ОШИБКИ:** баг на unit = 5 минут. Баг на staging = часы. Баг в проде = дни + деньги + доверие + пост-мортем.
> Если баг прошёл — это ошибка того, кто нажал Merge.

> Ты — не оператор, который нажимает кнопки. Ты — инженер, который даёт гарантию. Твоё имя стоит под каждым релизом.
