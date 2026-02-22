# Admin API Requirements — новые endpoints

## 1. AI Chat History (Михалыч)

### GET `/api/admin/ai-history?secret=craft-webhook-secret-2026`
Возвращает список юзеров с количеством AI-сообщений.

**Response:**
```json
{
  "users": [
    {
      "user_id": 123456,
      "username": "johndoe",
      "first_name": "John",
      "message_count": 42,
      "last_message_at": "2026-02-22T09:00:00Z"
    }
  ]
}
```

**SQL источник:** таблица `ai_conversations` или `ai_messages` (user_id, role, content, created_at).

Группировка: `SELECT user_id, COUNT(*) as message_count, MAX(created_at) as last_message_at FROM ai_messages GROUP BY user_id ORDER BY last_message_at DESC`

JOIN с таблицей `users` для получения username/first_name.

---

### GET `/api/admin/ai-history/:user_id?secret=craft-webhook-secret-2026`
Возвращает полную историю AI-разговора конкретного юзера.

**Response:**
```json
{
  "messages": [
    {
      "id": 1,
      "role": "user",
      "content": "Привет, Михалыч!",
      "created_at": "2026-02-22T08:00:00Z"
    },
    {
      "id": 2,
      "role": "assistant",
      "content": "Здарова, братан! Чем помочь?",
      "created_at": "2026-02-22T08:00:01Z"
    }
  ]
}
```

**SQL:** `SELECT id, role, content, created_at FROM ai_messages WHERE user_id = :user_id ORDER BY created_at ASC`

---

## 2. User Chat (Admin Messages)

### GET `/api/admin/user-chat/users?secret=craft-webhook-secret-2026`
Список юзеров, которые писали боту (из таблицы `admin_messages` или аналогичной).

**Response:**
```json
{
  "users": [
    {
      "user_id": 123456,
      "username": "johndoe",
      "first_name": "John",
      "last_message_at": "2026-02-22T09:00:00Z",
      "unread_count": 3
    }
  ]
}
```

---

### GET `/api/admin/user-chat/messages/:user_id?secret=craft-webhook-secret-2026`
История сообщений с конкретным юзером.

**Response:**
```json
{
  "messages": [
    {
      "id": 1,
      "user_id": 123456,
      "direction": "in",
      "text": "Привет!",
      "created_at": "2026-02-22T08:00:00Z"
    },
    {
      "id": 2,
      "user_id": 123456,
      "direction": "out",
      "text": "Здравствуйте! Чем могу помочь?",
      "created_at": "2026-02-22T08:01:00Z"
    }
  ]
}
```

- `direction: "in"` — сообщение от юзера
- `direction: "out"` — ответ бота/админа

---

### POST `/api/admin/user-chat/send?secret=craft-webhook-secret-2026`
Отправить сообщение юзеру от имени бота.

**Body:**
```json
{
  "user_id": 123456,
  "text": "Ответ от администратора"
}
```

**Действие:** Сохранить в `admin_messages` (direction="out") + отправить через Telegram Bot API `sendMessage` юзеру.
