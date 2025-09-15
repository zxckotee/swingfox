#!/bin/bash

# Скрипт для настройки продакшена
# IP сервера: 88.218.121.216

echo "Настройка продакшена для SwingFox..."

# Создаем .env файл
cat > .env << EOF
# Production Environment Variables
# IP сервера продакшена: 88.218.121.216

# API Configuration
REACT_APP_API_URL=https://88.218.121.216/api
REACT_APP_UPLOADS_URL=https://88.218.121.216/uploads

# WebSocket Configuration  
REACT_APP_WS_URL=wss://88.218.121.216/ws

# Environment
NODE_ENV=production
EOF

echo "✅ Создан .env файл с настройками для IP 88.218.121.216"

# Собираем проект для продакшена
echo "🔨 Сборка проекта для продакшена..."
npm run build:prod

echo "✅ Сборка завершена!"
echo "📁 Файлы готовы в папке dist/"
echo "🌐 Приложение настроено для работы с сервером 88.218.121.216"
