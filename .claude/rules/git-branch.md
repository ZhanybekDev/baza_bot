# Rule: Git Branch Workflow

## Правило

Для любой не-тривиальной задачи — работай в отдельной feature-ветке от свежего `dev`. Один PR = одна тема. Pre-deployment чеки прогоняются на ветке до пуша.

`git worktree` остаётся опцией для специфичных случаев (см. секцию «Когда worktree всё-таки оправдан» ниже), но **дефолт = просто ветка** в текущей рабочей копии.

---

## Когда создавать ветку

**Создавать:**
- Любая задача которая трогает >1-2 файла
- Любая фича, bugfix, рефактор
- Любая задача где ты будешь запускать pre-deployment чеки перед пушем

**Не создавать (работать прямо в текущей ветке):**
- Typo в README
- Однострочный конфиг-твик
- Обновление одной зависимости без коммита кода

---

## Workflow

### Шаг 1 — Создать ветку от свежего `dev`

Перед созданием — убедись что working tree чистое (не пропадут несохранённые изменения):

```bash
git status                  # должно быть clean (или только untracked)
git checkout dev
git fetch origin
git pull --ff-only origin dev
git checkout -b feature/<name>
```

Если working tree грязный — сначала закоммить или `git stash`.

`.env` файлы остаются на месте (мы в той же рабочей копии) — копировать ничего не нужно.

### Шаг 2 — Работа

На ветке:
- Пиши код
- Коммить часто (small commits, conventional commits)
- Запускай локальные тесты
- Всё в пределах этой ветки

### Шаг 3 — Pre-deployment checks

**Перед мёрджем обязательно:**

```bash
# Backend
cd backend
ruff check .
pytest

# Frontend
cd ../frontend
npm run lint
npm run build
```

**Правило:** если хоть что-то красное — НЕ пушь. Чини, перезапускай, пока не зелёное.

### Шаг 4 — Merge / push

В этом проекте используется GitLab MR флоу:

```bash
# 1. Push ветку
git push -u origin feature/<name>

# 2. Открой MR в GitLab в dev (не в main напрямую)
# 3. Дождись CI зелёного
# 4. Merge через UI (squash или rebase по соглашению команды)

# 5. Локально clean up после merge на GitLab
git checkout dev
git fetch origin --prune
git pull --ff-only origin dev
git branch -D feature/<name>     # удалить локальную после успешного merge
```

---

## Параллельные задачи на одной рабочей копии

Если нужно переключиться на другую задачу пока текущая в работе:

```bash
# Сохранить текущее
git add -A && git commit -m "wip: <что не закончено>"
# или: git stash push -m "wip: ..."

# Уйти на другую задачу
git checkout dev && git pull --ff-only origin dev
git checkout -b feature/<other>

# Вернуться обратно потом
git checkout feature/<original>
# (если был stash) git stash pop
```

**Правило:** **не** переключай ветки с грязным working tree без stash/commit — git может отказать или потерять изменения.

---

## Когда worktree всё-таки оправдан (опционально)

Edge cases где `git worktree add` остаётся полезным:

- Параллельный длинный билд / E2E тест на одной ветке + интерактивное редактирование на другой одновременно
- Hot-fix на `main` пока feature ветка в работе и переключаться нельзя
- Ревью чужого PR с локальным запуском без потери своего state

В этих случаях:

```bash
git worktree add ../ppc_data_center-wt/<name> -b feature/<name>
cd ../ppc_data_center-wt/<name>
# ...работа...
cd /path/to/main/checkout
git worktree remove ../ppc_data_center-wt/<name>
```

Дефолт всё равно — обычная ветка в текущей рабочей копии.

---

## Key Principles

### GitLab CI first

Никогда не SSH в прод чтобы "просто перезапустить контейнер". Всё через `.gitlab-ci.yml` + Nomad. Если пайплайн не делает что-то что нужно — чини пайплайн, не обходи его.

### NO FALLBACKS

Падай явно с понятной ошибкой. Не глуши, не деградируй молча. Смотри `.claude/rules/no-fallbacks.md`.

### Lock file sync после мёрджа

После мёрджа `dev` в свою ветку (или после `pull` свежего dev) — обязательно:

```bash
cd backend && pip install -r requirements.txt
cd ../frontend && npm install
```

Docker `npm ci` в CI требует точной синхронизации `package-lock.json`.

### Don't over-engineer

Делай только то, что напрямую запрошено. Никакого "пока я тут, заодно отрефакторю".

---

## Implementation Verification

После каждого изменения, **перед коммитом в feature-ветке**:

1. **Re-read всех изменённых файлов** — не полагайся на память.
2. **Проверь что каждое изменение делает ровно то что ты хотел.**
3. **Ищи leftover debug код** (console.log, print, debugger, TODO).
4. **Проверь что нет случайных регрессий** — старые тесты проходят.
5. **Confirm imports и dependencies** — все импорты нужны, ни одного лишнего.

---

## Если чего-то нет

- **Нет `.env`?** Сначала создай `.env.example` с плейсхолдерами, потом локальный `.env` вне git.
- **Solo dev?** Всё равно делай отдельные ветки на каждую задачу — это упрощает review/cherry-pick/revert.
- **Конфликт миграций alembic?** Не сливай две головы автоматически — создай новую миграцию-merge или ребейз ветку на свежий dev.
