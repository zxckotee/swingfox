# План реализации HTTPS для разработки без nginx

## Цель
Настроить HTTPS для обоих серверов (frontend и backend) без использования nginx как reverse proxy.

## Архитектура решения

```
Browser → https://localhost:443 → Frontend Container (React + Webpack HTTPS)
Browser → https://localhost:3001 → Backend Container (Express HTTPS)
```

## Структура проекта

```
/docker/
├── ssl/
│   ├── generate-certs.sh          # Скрипт генерации сертификатов
│   ├── localhost.crt              # SSL сертификат
│   ├── localhost.key              # Приватный ключ
│   └── localhost.conf             # Конфигурация для сертификата
├── backend/
│   └── Dockerfile.dev             # Обновленный Dockerfile
└── frontend/
    └── Dockerfile.dev             # Обновленный Dockerfile
```

## Изменения в конфигурации

### 1. SSL Сертификаты

Создадим самоподписанный сертификат для localhost:
- **localhost.crt** - публичный сертификат
- **localhost.key** - приватный ключ
- Поддержка для localhost и 127.0.0.1

### 2. Webpack Dev Server (Frontend)

```javascript
// webpack.config.js
devServer: {
  port: 443,
  https: {
    key: fs.readFileSync('/app/ssl/localhost.key'),
    cert: fs.readFileSync('/app/ssl/localhost.crt'),
  },
  // остальная конфигурация...
}
```

### 3. Express Server (Backend)

```javascript
// server.js
const https = require('https');
const fs = require('fs');

const httpsOptions = {
  key: fs.readFileSync('./ssl/localhost.key'),
  cert: fs.readFileSync('./ssl/localhost.crt')
};

https.createServer(httpsOptions, app).listen(3001, () => {
  console.log('HTTPS Server running on port 3001');
});
```

### 4. Docker Compose

```yaml
services:
  backend:
    ports:
      - "3001:3001"  # HTTPS backend
    volumes:
      - ./docker/ssl:/app/ssl:ro
      
  frontend:
    ports:
      - "443:443"    # HTTPS frontend
    volumes:
      - ./docker/ssl:/app/ssl:ro
      
  # nginx сервис удаляется
```

### 5. Переменные окружения

```env
# .env.docker.dev
REACT_APP_API_URL=https://localhost:3001/api
REACT_APP_WS_URL=wss://localhost:3001/ws
```

## Преимущества нового подхода

1. **Упрощенная архитектура** - нет лишнего слоя nginx
2. **Прямое подключение** - меньше latency
3. **Полный HTTPS** - безопасное соединение на всех уровнях
4. **Легче отладка** - меньше компонентов в цепочке
5. **Автономность** - каждый сервер самостоятельный

## Недостатки и ограничения

1. **Самоподписанный сертификат** - браузер будет показывать предупреждение
2. **Два порта** - нужно помнить про порт 3001 для API
3. **CORS настройки** - нужно правильно настроить для HTTPS

## Этапы реализации

1. ✅ Анализ текущей проблемы
2. ✅ Выбор архитектуры
3. 🔄 Создание SSL сертификатов
4. ⏳ Обновление webpack конфигурации
5. ⏳ Обновление Express server
6. ⏳ Модификация docker-compose.yml
7. ⏳ Обновление переменных окружения
8. ⏳ Тестирование HTTPS подключений

## Команды для тестирования

```bash
# Генерация сертификатов
cd docker && ./ssl/generate-certs.sh

# Запуск с новой конфигурацией
docker-compose down
docker-compose up --build

# Тестирование подключений
curl -k https://localhost:443
curl -k https://localhost:3001/api/status
```

## Инструкции для браузера

После запуска нужно будет:
1. Открыть https://localhost:443
2. Нажать "Дополнительно" → "Перейти на localhost (небезопасно)"
3. Сделать то же самое для https://localhost:3001

## Альтернативные порты (если нужно)

Если порт 443 занят другим приложением:
- Frontend: https://localhost:8443
- Backend: https://localhost:8001

## Дополнительные настройки безопасности

```javascript
// Для Express
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});