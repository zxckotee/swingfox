# 🚀 Быстрый старт SwingFox

## ⚡ Запуск за 5 минут

### 1. Клонирование и запуск

```bash
# Клонирование
git clone <repository-url>
cd swingfox

# Запуск всех сервисов
docker-compose up -d
```

### 2. Проверка статуса

```bash
# Статус контейнеров
docker-compose ps

# Логи backend
docker-compose logs -f backend
```

### 3. Доступ к приложению

- **Frontend**: https://localhost:443
- **API**: https://localhost:3001
- **Email тестирование**: http://localhost:8025

## 🔧 Разработка

### Локальная разработка

```bash
# Backend
npm install
npm run dev:backend

# Frontend (в новом терминале)
cd client
npm install
npm start
```

### Полезные команды

```bash
# Миграции БД
npm run migrate

# Тестовые данные
npm run seed

# Перезапуск сервиса
docker-compose restart backend
```

## 🐛 Отладка

### Логи Docker

```bash
# Все логи
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f backend
```

### Отладка Node.js

```bash
# Подключение к контейнеру
docker-compose exec backend bash

# Проверка миграций
npx sequelize-cli db:migrate:status
```

## 📚 Документация

- **Основной README**: [README.md](./README.md)
- **Клубная система**: [docs/CLUB_SYSTEM_IMPLEMENTATION_REPORT.md](./docs/CLUB_SYSTEM_IMPLEMENTATION_REPORT.md)
- **API документация**: [docs/CLUB_API_DOCUMENTATION.md](./docs/CLUB_API_DOCUMENTATION.md)

## 🆘 Частые проблемы

### Порт 443 занят
```bash
# Измените порт в docker-compose.yml
ports:
  - "8443:443"  # Вместо 443:443
```

### SSL ошибки
```bash
# Используйте --insecure для curl
curl -k https://localhost:3001/api/status

# Или настройте сертификаты
```

### Проблемы с БД
```bash
# Проверьте логи
docker-compose logs postgres

# Перезапустите БД
docker-compose restart postgres
```

---

**Время запуска**: ~5 минут  
**Статус**: 🟢 Готово к разработке
