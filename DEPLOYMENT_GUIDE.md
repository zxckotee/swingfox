# 🚀 Руководство по развертыванию SwingFox

## 📋 Предварительные требования

### Системные требования
- **CPU**: 2+ ядра
- **RAM**: 4+ GB
- **Диск**: 20+ GB свободного места
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+

### Программное обеспечение
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Git**: 2.30+
- **Nginx** (опционально, для reverse proxy)

## 🐳 Развертывание через Docker

### 1. Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Клонирование проекта

```bash
# Клонирование репозитория
git clone <repository-url>
cd swingfox

# Создание .env файла
cp .env.example .env
```

### 3. Настройка переменных окружения

Создайте файл `.env` с продакшен настройками:

```env
# Окружение
NODE_ENV=production

# База данных
DB_HOST=postgres
DB_USER=swingfox_prod
DB_PASSWORD=strong_production_password_2024
DB_NAME=swingfox_prod
DB_PORT=5432

# JWT
JWT_SECRET=your_super_strong_jwt_secret_key_2024_production
JWT_EXPIRES_IN=7d

# Email (настройте реальный SMTP сервер)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@swingfox.ru

# Сервер
PORT=3001
UPLOAD_PATH=public/uploads
MAX_FILE_SIZE=10485760

# SSL (для продакшена)
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
```

### 4. Настройка SSL сертификатов

#### Let's Encrypt (рекомендуется)

```bash
# Установка Certbot
sudo apt install certbot

# Получение сертификата
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Автоматическое обновление
sudo crontab -e
# Добавьте строку:
0 12 * * * /usr/bin/certbot renew --quiet
```

#### Самоподписанные сертификаты (только для разработки)

```bash
# Генерация сертификатов
cd docker/ssl
./generate-certs.sh
```

### 5. Запуск сервисов

```bash
# Сборка и запуск
docker-compose up -d --build

# Проверка статуса
docker-compose ps

# Логи
docker-compose logs -f
```

### 6. Инициализация базы данных

```bash
# Запуск миграций
docker-compose exec backend npm run migrate

# Заполнение тестовыми данными (опционально)
docker-compose exec backend npm run seed
```

## 🌐 Настройка домена и DNS

### 1. DNS записи

```bash
# A запись для основного домена
yourdomain.com.     A     YOUR_SERVER_IP

# A запись для www поддомена
www.yourdomain.com. A     YOUR_SERVER_IP

# CNAME для API поддомена (опционально)
api.yourdomain.com. CNAME yourdomain.com.
```

### 2. Проверка DNS

```bash
# Проверка A записи
nslookup yourdomain.com

# Проверка CNAME
nslookup api.yourdomain.com
```

## 🔒 Настройка безопасности

### 1. Firewall

```bash
# UFW (Ubuntu)
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3001/tcp  # Backend API

# iptables (CentOS/RHEL)
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 3001 -j ACCEPT
```

### 2. Fail2ban

```bash
# Установка
sudo apt install fail2ban

# Настройка
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Редактирование конфигурации
sudo nano /etc/fail2ban/jail.local

# Перезапуск
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban
```

### 3. Обновление системы

```bash
# Автоматические обновления безопасности
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 📊 Мониторинг и логирование

### 1. Логирование

```bash
# Создание директории для логов
sudo mkdir -p /var/log/swingfox
sudo chown $USER:$USER /var/log/swingfox

# Настройка ротации логов
sudo nano /etc/logrotate.d/swingfox
```

Содержимое `/etc/logrotate.d/swingfox`:
```
/var/log/swingfox/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}
```

### 2. Мониторинг ресурсов

```bash
# Установка htop
sudo apt install htop

# Мониторинг в реальном времени
htop

# Мониторинг Docker
docker stats
```

### 3. Health checks

```bash
# Проверка здоровья API
curl -f https://yourdomain.com:3001/health

# Проверка frontend
curl -f https://yourdomain.com

# Автоматическая проверка
watch -n 30 'curl -f https://yourdomain.com:3001/health || echo "API недоступен"'
```

## 🔄 Обновления и развертывание

### 1. Автоматическое развертывание

Создайте скрипт `deploy.sh`:

```bash
#!/bin/bash

# Остановка сервисов
docker-compose down

# Получение обновлений
git pull origin main

# Пересборка и запуск
docker-compose up -d --build

# Проверка статуса
sleep 10
docker-compose ps

# Проверка здоровья
curl -f https://yourdomain.com:3001/health || exit 1

echo "Развертывание завершено успешно!"
```

### 2. Настройка CI/CD

#### GitHub Actions

Создайте `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.KEY }}
          script: |
            cd /path/to/swingfox
            ./deploy.sh
```

### 3. Откат изменений

```bash
# Откат к предыдущей версии
git log --oneline -5
git checkout <commit-hash>

# Пересборка
docker-compose down
docker-compose up -d --build
```

## 📈 Масштабирование

### 1. Горизонтальное масштабирование

```yaml
# docker-compose.scale.yml
services:
  backend:
    deploy:
      replicas: 3
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - REDIS_HOST=redis
  
  frontend:
    deploy:
      replicas: 2
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend
      - frontend
```

### 2. Load Balancer

Создайте `nginx.conf`:

```nginx
upstream backend {
    server backend:3001;
    server backend:3002;
    server backend:3003;
}

upstream frontend {
    server frontend:443;
    server frontend:444;
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location / {
        proxy_pass https://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. База данных

```bash
# Репликация PostgreSQL
# Настройка master-slave репликации
# Использование connection pooling (pgBouncer)
```

## 🧪 Тестирование развертывания

### 1. Smoke тесты

```bash
#!/bin/bash
# smoke-test.sh

BASE_URL="https://yourdomain.com"

echo "Проверка frontend..."
curl -f "$BASE_URL" || exit 1

echo "Проверка API..."
curl -f "$BASE_URL:3001/health" || exit 1

echo "Проверка SSL..."
curl -I "$BASE_URL" | grep "HTTP/2 200" || exit 1

echo "Все тесты пройдены успешно!"
```

### 2. Load тестирование

```bash
# Установка Apache Bench
sudo apt install apache2-utils

# Тест производительности
ab -n 1000 -c 10 https://yourdomain.com/

# Тест API
ab -n 1000 -c 10 https://yourdomain.com:3001/api/status
```

## 📞 Поддержка и мониторинг

### 1. Алерты

```bash
# Настройка мониторинга
# Использование Prometheus + Grafana
# Настройка уведомлений через email/Slack
```

### 2. Логирование ошибок

```bash
# Централизованное логирование
# ELK Stack (Elasticsearch, Logstash, Kibana)
# Sentry для отслеживания ошибок
```

### 3. Резервное копирование

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/swingfox"

# Резервная копия БД
docker-compose exec postgres pg_dump -U swingfox_prod swingfox_prod > "$BACKUP_DIR/db_$DATE.sql"

# Резервная копия файлов
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" public/uploads/

# Очистка старых резервных копий (оставить последние 7)
find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete

echo "Резервное копирование завершено: $DATE"
```

## 🎯 Чек-лист развертывания

### Предварительная подготовка
- [ ] Настройка сервера
- [ ] Установка Docker
- [ ] Настройка домена и DNS
- [ ] Получение SSL сертификатов

### Развертывание
- [ ] Клонирование репозитория
- [ ] Настройка переменных окружения
- [ ] Запуск сервисов
- [ ] Инициализация БД

### Безопасность
- [ ] Настройка firewall
- [ ] Установка Fail2ban
- [ ] Настройка SSL
- [ ] Обновление системы

### Мониторинг
- [ ] Настройка логирования
- [ ] Health checks
- [ ] Алерты
- [ ] Резервное копирование

### Тестирование
- [ ] Smoke тесты
- [ ] Load тестирование
- [ ] SSL проверка
- [ ] API тестирование

---

**Статус**: 🟢 Готово к продакшену  
**Последнее обновление**: 2024-01-02  
**Версия**: 2.0.0
