# Rule: NO FALLBACKS

## Правило

Не подставляй дефолтные значения вместо отсутствующих данных. Не пробуй альтернативный подход молча. Если что-то не сработало — сообщи явно и понятно.

**Это правило про твоё поведение**, не про код проекта. Код проекта может иметь fallback'и если этого требует задача — но твои действия при написании/отладке этого кода — без фолбэков.

---

## Что нельзя

### ❌ Подставлять дефолты молча

**Плохо:**
```python
def get_user(user_id: str | None = None):
    if user_id is None:
        user_id = "default_user"  # ← молчаливый fallback
    return db.users.get(user_id)
```

**Хорошо:**
```python
def get_user(user_id: str) -> User:
    return db.users.get(user_id)  # TypeError если None, явно
```

### ❌ Глушить исключения

**Плохо:**
```python
try:
    result = api.call()
except Exception:
    result = None  # ← молчим
```

**Хорошо:**
```python
try:
    result = api.call()
except APIError as e:
    logger.error("API call failed: %s", e)
    raise  # пусть caller решает
```

### ❌ "Может быть" в логах

**Плохо:**
```
Warning: maybe something wrong with config
```

**Хорошо:**
```
Error: config.database.url is required but not set (checked: env, .env file, defaults)
```

### ❌ Graceful degradation без явного дизайн-решения

Если в задаче не сказано "делай degradation" — не делай. Падай явно, покажи ошибку пользователю, пусть он решит.

---

## Что можно

### ✅ Явный fallback когда пользователь попросил

**Пользователь говорит:** "сделай так чтобы если API недоступен — показывали кэш"

→ делаешь fallback, с явным комментарием что это продуманное решение.

### ✅ Default в сигнатуре функции когда это документированное поведение

```python
def format_date(date: datetime, format: str = "ISO") -> str:
    ...
```

Это не fallback, это API design.

### ✅ Try/except с конкретным типом и конкретной обработкой

```python
try:
    parse_json(data)
except JSONDecodeError as e:
    raise InvalidPayloadError(f"Payload is not valid JSON: {e}") from e
```

---

## Почему

1. **Фолбэки прячут проблемы.** Ты думаешь что всё работает — а на самом деле половина путей кода идёт через молчаливый default. Баг вылезет через неделю в проде.
2. **Фолбэки усложняют дебаг.** Ты читаешь логи и видишь "всё ок" — но поведение неправильное. Ищешь часами.
3. **Фолбэки создают непредсказуемое поведение.** Пользователь не понимает что происходит, потому что error передал в fallback вместо того чтобы упасть явно.
4. **Fail fast = fix fast.** Явная ошибка = явное исправление. Молчание = недели поиска.

---

## Проверка себя

Перед тем как объявить фичу DONE, пройди по изменениям и спроси:

- [ ] Есть ли хоть одно место где я подставляю default когда данных нет?
- [ ] Есть ли хоть один `except` без явного лога + re-raise / конкретного handling?
- [ ] Есть ли хоть один `// TODO: handle edge case`?
- [ ] Есть ли хоть один `if not x: x = "..."`?

Если да — переделай. Никаких фолбэков без явного запроса.
