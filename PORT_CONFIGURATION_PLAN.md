# План изменения конфигурации портов

## Текущая архитектура
- Express сервер: порт 3000
- React dev-server: порт 3001
- Proxy: React → Express

## Новая архитектура
- **Express сервер: порт 3001**
- **React webpack dev-server: порт 443 (HTTPS без SSL)**
- Proxy: React → Express

## Изменения, которые нужно внести

### 1. Backend (Express сервер)

#### `server.js`
```javascript
// Изменить PORT с 3000 на 3001
const PORT = process.env.PORT || 3001;
```

#### `.env`
```env
PORT=3001
```

### 2. Frontend (React Webpack)

#### `client/webpack.config.js`
```javascript
devServer: {
  port: 443,
  https: false, // HTTPS без SSL сертификата
  proxy: {
    '/api': {
      target: 'http://localhost:3001', // Обновить на новый порт Express
      changeOrigin: true
    },
    '/uploads': {
      target: 'http://localhost:3001',
      changeOrigin: true
    }
  }
}
```

#### `client/.env`
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_UPLOADS_URL=http://localhost:3001/uploads
```

#### `client/package.json`
```json
{
  "scripts": {
    "start": "webpack serve --mode development --port 443",
    "dev": "webpack serve --mode development --port 443 --open"
  }
}
```

### 3. Документация

#### Обновить `README.md`
- Указать новые порты
- Обновить примеры URL

#### Обновить `client/README.md`
- Указать что фронтенд запускается на порту 443
- Обновить примеры команд

## Преимущества новой архитектуры

1. **Стандартные порты**: 443 для веб-приложения (стандартный HTTPS порт)
2. **Разделение ответственности**: четкое разделение фронтенда и API
3. **Подготовка к продакшену**: архитектура близкая к боевой среде

## Команды для запуска после изменений

```bash
# Запуск бэкенда (порт 3001)
npm start

# Запуск фронтенда (порт 443)
cd client
npm start
```

## URL после изменений

- **Фронтенд**: https://localhost:443 (или http://localhost:443)
- **API**: http://localhost:3001/api
- **Статические файлы**: http://localhost:3001/uploads

## Замечания

- Порт 443 может требовать прав администратора на некоторых системах
- Если возникнут проблемы с портом 443, можно использовать 8443 как альтернативу
- В продакшене фронтенд будет обслуживаться через nginx/apache на стандартном 443 порту