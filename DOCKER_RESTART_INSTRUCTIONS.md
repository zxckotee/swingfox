# Инструкция по перезапуску Docker для продакшена

## Проблема решена! ✅

Ваше приложение теперь настроено для работы с продакшен сервером `88.218.121.216`.

## Что было исправлено:

1. **API URL**: `https://88.218.121.216/api` ✅
2. **Uploads URL**: `https://88.218.121.216/uploads` ✅  
3. **WebSocket URL**: `wss://88.218.121.216/ws` ✅
4. **Docker конфигурация**: обновлена ✅

## Для применения изменений:

### Вариант 1: Полный перезапуск (рекомендуется)
```bash
# Остановить все контейнеры
docker-compose down

# Пересобрать образы с новыми настройками
docker-compose build --no-cache

# Запустить заново
docker-compose up -d
```

### Вариант 2: Перезапуск только frontend
```bash
# Остановить только frontend
docker-compose stop frontend

# Пересобрать frontend
docker-compose build --no-cache frontend

# Запустить frontend
docker-compose up -d frontend
```

### Вариант 3: Использовать готовый скрипт
```bash
# Сделать скрипт исполняемым
chmod +x restart-production.sh

# Запустить скрипт
./restart-production.sh
```

## Проверка работы:

После перезапуска проверьте:

1. **Frontend**: https://88.218.121.216:443
2. **Backend API**: https://88.218.121.216:3001/api/status
3. **MailHog**: http://88.218.121.216:8025

## Статус контейнеров:
```bash
docker-compose ps
```

## Логи для отладки:
```bash
# Логи frontend
docker-compose logs frontend

# Логи backend  
docker-compose logs backend

# Логи всех сервисов
docker-compose logs
```

## Важно:

- **401 Unauthorized** - это нормально, если вводите неправильные данные для входа
- **WebSocket ошибки** должны исчезнуть после перезапуска
- Все запросы теперь идут на `88.218.121.216` вместо `localhost`

## Если проблемы остаются:

1. Проверьте, что все контейнеры запущены: `docker-compose ps`
2. Проверьте логи: `docker-compose logs frontend`
3. Убедитесь, что порты 443 и 3001 доступны
4. Проверьте файрвол и сетевые настройки
