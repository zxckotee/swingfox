# Настройка MailHog для SwingFox

MailHog - это локальный SMTP сервер для перехвата и просмотра email'ов во время разработки.

## Что это такое?

- **nodemailer** - Node.js библиотека для отправки email
- **MailHog** - локальный SMTP сервер для перехвата email'ов

Они работают вместе:
1. nodemailer отправляет email на `localhost:1025` (MailHog SMTP)
2. MailHog перехватывает все email'ы и показывает в веб-интерфейсе

## Установка MailHog

### Вариант 1: Скачать исполняемый файл (Windows)
1. Перейдите на https://github.com/mailhog/MailHog/releases
2. Скачайте `MailHog_windows_amd64.exe`
3. Переименуйте в `MailHog.exe`
4. Запустите `MailHog.exe`

### Вариант 2: Docker
```bash
docker run -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

### Вариант 3: Go (если установлен)
```bash
go install github.com/mailhog/MailHog@latest
MailHog
```

## Использование

1. Запустите MailHog
2. SMTP сервер: `localhost:1025` (уже настроено в .env)
3. Веб-интерфейс: http://localhost:8025
4. Все email'ы отправленные из приложения будут видны в веб-интерфейсе

## Настройки в проекте

В `.env` уже настроено:
```
EMAIL_HOST=localhost
EMAIL_PORT=1025
EMAIL_FROM=info@swingfox.ru
```

## Тестирование

1. Запустите MailHog
2. Запустите сервер: `npm start`
3. Отправьте запрос на регистрацию через API
4. Проверьте email в http://localhost:8025

Все email'ы остаются локально и не отправляются реальным получателям!