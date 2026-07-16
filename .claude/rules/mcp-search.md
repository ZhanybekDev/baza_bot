# Rule: MCP Search — Exa + Context7 с актуальной датой

## Правило

Для любого поиска библиотек, документации, best practices — используй **Exa MCP** и **Context7 MCP**. Всегда включай текущую системную дату в запрос. Никогда не хардкодь год.

---

## Приоритет инструментов

1. **Exa MCP** — первый выбор. Лучше обычного WebSearch, возвращает cleaner content.
2. **Context7 MCP** — для документации библиотек.
3. **WebSearch** — fallback, если Exa недоступен.

---

## Обязательный workflow

### 1. Получи системную дату

```bash
date "+%Y-%m-%d %B %Y"
```

Пример результата: `2026-04-10 April 2026`

**ОБЯЗАТЕЛЬНО:** используй эту дату в следующем шаге. НИКОГДА не хардкодь год из своих знаний.

### 2. Проверь последнюю стабильную версию через Exa

```
mcp__exa__web_search_exa(
  query="[library] latest stable version [MONTH] [YEAR]"
)
```

Пример:
```
mcp__exa__web_search_exa(
  query="fastapi latest stable version April 2026"
)
```

### 3. Проверь актуальную документацию через Context7

```
mcp__context7__resolve-library-id(libraryName="fastapi", query="dependency injection patterns")
→ получаешь library ID типа "/tiangolo/fastapi"

mcp__context7__query-docs(
  libraryId="/tiangolo/fastapi",
  query="how to structure dependency injection for async sessions"
)
```

### 4. Сверь и используй

Если Exa и Context7 согласны — используй версию. Если расходятся — Context7 обычно авторитетнее для документации, Exa — для breaking changes / changelogs.

---

## Доступные Exa инструменты

| Tool | Когда использовать |
|---|---|
| `mcp__exa__web_search_exa` | Общий веб-поиск, достаточен в большинстве случаев |
| `mcp__exa__web_fetch_exa` | Прочитать конкретный URL (документация, GitHub, StackOverflow) |

---

## Правила запросов

### ✅ Правильно

```
"react 18 server components best practices April 2026"
"python asyncio.TaskGroup usage examples 2026"
"fastapi dependency injection async session pattern latest"
```

### ❌ Неправильно

```
"react best practices"             ← без года = устаревшие результаты
"python asyncio 2024"              ← хардкод старого года
"how to do async in fastapi"       ← слишком общо, без контекста версии
```

---

## Когда использовать

### Всегда (обязательно):

- Перед добавлением новой зависимости в `package.json` / `requirements.txt`
- Перед выбором версии библиотеки ("какую брать — 4.x или 5.x?")
- Перед использованием фичи которая может быть deprecated ("мой cached knowledge говорит что useEffect...")
- Перед принятием архитектурного решения про конкретную библиотеку

### Опционально (но полезно):

- При поиске примеров кода
- При поиске решения специфичной ошибки
- При изучении нового фреймворка

### Не нужно:

- Для базовых языковых конструкций (for, if, class в Python — стабильно десятилетиями)
- Для стандартной библиотеки в разумных случаях (но если сомневаешься — проверь)

---

## Почему это важно

1. **LLM знания устаревают.** Твой cached knowledge — снапшот на момент обучения. Библиотеки за месяц могут выпустить breaking changes.
2. **Год в запросе критичен.** Без него поисковик отдаст топовый результат за все годы — часто это 2022-2023 ответ на актуальный вопрос.
3. **Выбор устаревшей версии = техдолг с первого коммита.** Ты тащишь в проект библиотеку с известными уязвимостями / deprecation warnings.
4. **Context7 авторитетнее SO.** StackOverflow ответы часто устаревшие. Context7 тянет официальные доки.

---

## Проверка себя

Перед установкой зависимости или использованием новой фичи:

- [ ] Запустил `date`?
- [ ] Поиск через Exa с месяцем и годом?
- [ ] Context7 запрос для документации?
- [ ] Версия актуальная (не deprecated)?
- [ ] Breaking changes с последней major — прочитал?
