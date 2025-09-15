# Настройка для продакшена

## Проблема
Приложение пытается подключиться к `localhost` вместо реального сервера в продакшене.

## Решение

### 1. Быстрая настройка (рекомендуется)

Запустите скрипт автоматической настройки:

```bash
cd client
./setup-production.sh
```

### 2. Ручная настройка

Создайте файл `.env` в папке `client/` со следующим содержимым:

```bash
# IP сервера продакшена: 88.218.121.216
REACT_APP_API_URL=https://88.218.121.216/api
REACT_APP_UPLOADS_URL=https://88.218.121.216/uploads
REACT_APP_WS_URL=wss://88.218.121.216/ws
NODE_ENV=production
```

### 3. Настройка для вашего сервера

**IP сервер: 88.218.121.216**
```bash
REACT_APP_API_URL=https://88.218.121.216/api
REACT_APP_UPLOADS_URL=https://88.218.121.216/uploads
REACT_APP_WS_URL=wss://88.218.121.216/ws
NODE_ENV=production
```

### 3. Сборка для продакшена

```bash
cd client
npm run build:prod
```

### 4. Проверка конфигурации

После сборки проверьте, что в файлах `dist/` используются правильные URL вместо localhost.

### 5. Docker настройка

Если используете Docker, добавьте переменные окружения в `docker-compose.yml`:

```yaml
services:
  frontend:
    environment:
      - REACT_APP_API_URL=https://YOUR_DOMAIN/api
      - REACT_APP_UPLOADS_URL=https://YOUR_DOMAIN/uploads
      - REACT_APP_WS_URL=wss://YOUR_DOMAIN/ws
      - NODE_ENV=production
```

## Что было изменено

1. **webpack.config.js** - добавлена поддержка переменных окружения для WebSocket и API URL
2. **api.js** - обновлена конфигурация для использования переменных окружения
3. **package.json** - добавлен скрипт `build:prod` для продакшена
4. Создан файл `production.env` с примером конфигурации

## Важно

- Замените `YOUR_DOMAIN` на ваш реальный домен или IP адрес
- Убедитесь, что ваш сервер поддерживает HTTPS и WebSocket соединения
- Проверьте, что порты 443 (HTTPS) и WebSocket порт доступны
