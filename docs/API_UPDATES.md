# API ОБНОВЛЕНИЯ для продакшена

## Новые endpoints:
- `POST /api/subscriptions/cancel` - Отмена активной подписки

## Изменения в структуре ответов:

### GET /api/subscriptions/current
**Было:**
```json
{
  "has_subscription": true,
  "subscription": { ... },
  "user_type": "VIP"
}
```

**Стало:**
```json
{
  "has_subscription": true,
  "plan": "vip",
  "expires_at": "2024-01-28T00:00:00.000Z",
  "auto_renew": true,
  "days_remaining": 15,
  "subscription": { ... }
}
```

### GET /api/subscriptions/history
**Добавлено поле:**
```json
{
  "subscriptions": [ ... ],
  "payments": [ ... ],  // NEW
  "pagination": { ... }
}
```

## Breaking changes:
- Отмена подписки больше не требует subscription ID
- Все цены и возможности получаются асинхронно из базы данных
- Структура ответов изменена для совместимости с фронтендом

## Новые возможности:

### Отмена подписки без ID
```javascript
// Старый способ (больше не работает)
subscriptionsAPI.cancel(subscriptionId, reason);

// Новый способ
subscriptionsAPI.cancel(reason);
```



### Получение баланса пользователя
```javascript
// Новый метод
subscriptionsAPI.getBalance();
```

## Валидация входных данных:
Все API endpoints теперь используют Joi для валидации:
- `subscription_type`: только 'VIP' или 'PREMIUM'
- `duration_months`: только 1, 3 или 12
- `payment_method`: только разрешенные методы
- `auto_renewal`: только boolean

## Rate Limiting:
Критические операции ограничены:
- Максимум 5 операций с подписками за 15 минут
- Применяется к созданию и смене планов

## Метрики и аудит:
Все операции логируются с тегами:
- `📊 [METRICS]` - для бизнес-метрик
- `🔍 [AUDIT]` - для аудит-логов

## Обратная совместимость:
- Все существующие поля сохранены
- Новые поля добавляются без удаления старых
- Фронтенд может постепенно переходить на новую структуру
