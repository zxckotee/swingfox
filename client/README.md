# SwingFox Frontend

React-приложение для социальной платформы SwingFox, собираемое через Webpack.

## Технологический стек

- **React 18** - UI библиотека
- **Webpack 5** - сборщик модулей
- **Babel** - транспилятор JS/JSX
- **Styled Components** - CSS-in-JS
- **React Router** - маршрутизация
- **React Query** - управление состоянием сервера
- **React Hook Form** - работа с формами
- **Framer Motion** - анимации
- **Axios** - HTTP клиент

## Команды для разработки

```bash
# Установка зависимостей
npm install

# Запуск dev-сервера (https://88.218.121.216:443)
npm start

# Запуск dev-сервера с автооткрытием браузера
npm run dev

# Сборка для продакшена
npm run build

# Анализ размера бандла
npm run analyze
```

## Структура проекта

```
client/
├── public/
│   └── index.html          # HTML шаблон
├── src/
│   ├── components/         # Переиспользуемые компоненты
│   ├── pages/             # Страницы приложения
│   ├── services/          # API сервисы
│   ├── styles/            # Глобальные стили
│   ├── utils/             # Утилиты
│   ├── App.js             # Главный компонент
│   └── index.js           # Точка входа
├── dist/                  # Собранные файлы (после build)
├── webpack.config.js      # Конфигурация Webpack
├── babel.config.js        # Конфигурация Babel
└── postcss.config.js      # Конфигурация PostCSS
```

## Переменные окружения

Создайте файл `.env` в папке `client/`:

```env
# API Configuration
REACT_APP_API_URL=https://88.218.121.216/api
REACT_APP_UPLOADS_URL=https://88.218.121.216/uploads

# Environment
NODE_ENV=development

# Features flags
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_ENABLE_DEBUG=true
```

## Особенности сборки

### Development режим
- Hot Module Replacement (HMR)
- React Refresh для быстрой перезагрузки
- Source maps для отладки
- Proxy для API запросов к бэкенду

### Production режим
- Минификация CSS и JS
- Извлечение CSS в отдельные файлы
- Оптимизация изображений
- Code splitting для лучшего кэширования
- Bundle analyzer для анализа размера

## Алиасы путей

В webpack настроены алиасы для удобного импорта:

```javascript
import Button from '@components/Button';
import { authAPI } from '@services/api';
import { theme } from '@styles/theme';
```

## Проксирование API

В development режиме все запросы к `/api` и `/uploads` проксируются на бэкенд сервер (88.218.121.216:3001).

## Совместимость с браузерами

- Chrome/Edge: последние 2 версии
- Firefox: последние 2 версии
- Safari: последние 2 версии
- IE: не поддерживается

## Оптимизация

- Lazy loading для страниц
- Мемоизация компонентов
- Виртуализация длинных списков
- Оптимизация изображений
- Code splitting по роутам

## Линтинг и форматирование

```bash
# Линтинг (если настроен ESLint)
npm run lint

# Автоисправление
npm run lint:fix

# Форматирование (если настроен Prettier)
npm run format
```

## Деплой

Для деплоя выполните:

```bash
npm run build
```

Файлы в папке `dist/` готовы для размещения на веб-сервере.

## Полезные ссылки

- [React Documentation](https://react.dev/)
- [Webpack Documentation](https://webpack.js.org/)
- [Styled Components](https://styled-components.com/)
- [React Router](https://reactrouter.com/)
- [React Query](https://tanstack.com/query/latest)