# 🐳 Docker Development Setup для SwingFox

Этот документ описывает, как запустить SwingFox в Docker для разработки с поддержкой hot reload и отладки.

## 📋 Предварительные требования

- [Docker](https://docs.docker.com/get-docker/) (версия 20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (версия 2.0+)
- Минимум 4GB RAM
- Свободные порты: 80, 443, 3001, 5432, 8025, 9229

## 🏗️ Архитектура

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Network                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────┐    ┌──────────┐    ┌─────────────┐        │
│  │ Nginx   │────│ Frontend │    │ Backend     │        │
│  │ :80     │    │ :443     │    │ :3001       │        │
│  └─────────┘    └──────────┘    │ Debug :9229 │        │
│                                 └─────────────┘        │
│                                        │                │
│                 ┌─────────────┐       │                │
│                 │ PostgreSQL  │───────┘                │
│                 │ :5432      │                         │
│                 └─────────────┘                         │
│                                                         │
│                 ┌─────────────┐                         │
│                 │ MailHog     │                         │
│                 │ SMTP: 1025  │                         │
│                 │ Web: 8025   │                         │
│                 └─────────────┘                         │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Быстрый старт

### 1. Клонирование и подготовка

```bash
# Убедитесь, что вы находитесь в корневой директории проекта
cd /path/to/swingfox

# Скопируйте переменные окружения для Docker
cp .env.docker.dev .env
```

### 2. Сборка и запуск

```bash
# Сборка всех образов
docker-compose -f docker-compose.dev.yml build

# Запуск всех сервисов
docker-compose -f docker-compose.dev.yml up
```

### 3. Инициализация базы данных

```bash
# В другом терминале выполните миграции
docker-compose -f docker-compose.dev.yml exec backend npm run migrate

# (Опционально) Загрузите начальные данные
docker-compose -f docker-compose.dev.yml exec backend npm run seed
```

## 🌐 URL для доступа

После успешного запуска приложение будет доступно по следующим адресам:

- **🏠 Основное приложение**: http://localhost
- **🔧 API**: http://localhost/api
- **⚛️ Frontend (прямой доступ)**: https://localhost:443
- **🗄️ Backend (прямой доступ)**: http://localhost:3001
- **📧 MailHog Web UI**: http://localhost:8025
- **🗃️ PostgreSQL**: localhost:5432

## 🛠️ Команды для разработки

### Основные команды

```bash
# Запуск в фоновом режиме
docker-compose -f docker-compose.dev.yml up -d

# Просмотр логов всех сервисов
docker-compose -f docker-compose.dev.yml logs -f

# Просмотр логов конкретного сервиса
docker-compose -f docker-compose.dev.yml logs -f backend
docker-compose -f docker-compose.dev.yml logs -f frontend

# Остановка всех сервисов
docker-compose -f docker-compose.dev.yml down

# Остановка с удалением volumes (ВНИМАНИЕ: удалит данные БД!)
docker-compose -f docker-compose.dev.yml down -v
```

### Работа с сервисами

```bash
# Подключение к контейнеру backend
docker-compose -f docker-compose.dev.yml exec backend sh

# Подключение к контейнеру frontend
docker-compose -f docker-compose.dev.yml exec frontend sh

# Подключение к PostgreSQL
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d swingfox

# Перезапуск конкретного сервиса
docker-compose -f docker-compose.dev.yml restart backend
```

### Установка пакетов

```bash
# Установка пакета в backend
docker-compose -f docker-compose.dev.yml exec backend npm install package-name

# Установка пакета в frontend
docker-compose -f docker-compose.dev.yml exec frontend npm install package-name

# Пересборка после изменения package.json
docker-compose -f docker-compose.dev.yml build --no-cache backend
docker-compose -f docker-compose.dev.yml build --no-cache frontend
```

## 🐛 Отладка

### Backend отладка

Backend запускается с флагом `--inspect`, что позволяет подключить отладчик:

**VS Code launch.json**:
```json
{
  "type": "node",
  "request": "attach",
  "name": "Docker Backend Debug",
  "remoteRoot": "/app",
  "localRoot": "${workspaceFolder}",
  "port": 9229,
  "host": "localhost"
}
```

### Просмотр логов

```bash
# Логи в реальном времени
docker-compose -f docker-compose.dev.yml logs -f --tail=100

# Логи конкретного сервиса
docker-compose -f docker-compose.dev.yml logs backend
docker-compose -f docker-compose.dev.yml logs frontend
docker-compose -f docker-compose.dev.yml logs postgres
```

### Health Checks

```bash
# Проверка статуса всех сервисов
docker-compose -f docker-compose.dev.yml ps

# Проверка health check конкретного сервиса
docker inspect --format='{{json .State.Health}}' swingfox-dev-backend-1
```

## 📁 Volume Mapping

### Backend
- Код: `./ -> /app` (hot reload)
- Загрузки: `./public/uploads -> /app/public/uploads`
- node_modules: анонимный volume

### Frontend  
- Код: `./client -> /app` (hot reload)
- node_modules: анонимный volume

### PostgreSQL
- Данные: `postgres_data -> /var/lib/postgresql/data` (persistent)

## 🔧 Настройка портов

Если порты заняты, можете изменить их в `docker-compose.dev.yml`:

```yaml
services:
  nginx:
    ports:
      - "8080:80"  # Изменить основной порт
  
  backend:
    ports:
      - "3002:3001"  # Изменить backend порт
      - "9230:9229"  # Изменить debug порт
```

## 🚨 Решение проблем

### Проблема: Порт 443 занят
```bash
# Найти процесс, использующий порт
sudo lsof -i :443

# Изменить порт в docker-compose.dev.yml
ports:
  - "3443:443"
```

### Проблема: База данных не подключается
```bash
# Проверить статус PostgreSQL
docker-compose -f docker-compose.dev.yml exec postgres pg_isready -U postgres

# Перезапустить PostgreSQL
docker-compose -f docker-compose.dev.yml restart postgres

# Очистить volume и пересоздать
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up
```

### Проблема: Frontend не обновляется
```bash
# Проверить, что volume mapping работает
docker-compose -f docker-compose.dev.yml exec frontend ls -la /app

# Пересобрать без cache
docker-compose -f docker-compose.dev.yml build --no-cache frontend
```

### Проблема: HTTPS сертификат
Если возникают проблемы с HTTPS на порту 443, можете изменить webpack конфигурацию:

```javascript
// client/webpack.config.js
devServer: {
  https: false,  // Отключить HTTPS
  port: 3000,    // Изменить порт
}
```

## 📊 Мониторинг

### Просмотр использования ресурсов
```bash
# Статистика контейнеров
docker stats

# Использование дискового пространства
docker system df
```

### Очистка Docker
```bash
# Удаление неиспользуемых образов
docker image prune

# Полная очистка
docker system prune -a
```

## 🔄 Workflow разработки

1. **Запуск окружения**:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Разработка**: Изменяйте файлы в `./` и `./client/` - изменения автоматически подхватываются

3. **Тестирование email**: Проверяйте отправленные письма в MailHog UI

4. **Отладка**: Подключайте VS Code debugger к порту 9229

5. **База данных**: Используйте psql или pgAdmin для работы с БД

6. **Остановка**:
   ```bash
   docker-compose -f docker-compose.dev.yml down
   ```

## 💡 Полезные алиасы

Добавьте в `.bashrc` или `.zshrc`:

```bash
alias dcu='docker-compose -f docker-compose.dev.yml up'
alias dcd='docker-compose -f docker-compose.dev.yml down'
alias dcl='docker-compose -f docker-compose.dev.yml logs -f'
alias dcb='docker-compose -f docker-compose.dev.yml build'
alias dcr='docker-compose -f docker-compose.dev.yml restart'
```

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи: `docker-compose -f docker-compose.dev.yml logs`
2. Убедитесь, что все порты свободны
3. Проверьте, что Docker daemon запущен
4. Очистите Docker cache: `docker system prune`

---

🎉 **Готово!** Ваше development окружение SwingFox должно работать в Docker.