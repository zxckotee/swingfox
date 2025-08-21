# Стратегия полного логирования API SwingFox

## Общие принципы

### Уровни логирования:
- **ERROR**: Ошибки системы и приложения
- **WARN**: Предупреждения, подозрительная активность
- **INFO**: Входящие запросы и результаты операций
- **DEBUG**: Процессы обработки, поиск в БД, бизнес-логика
- **TRACE**: Детальные сравнения, валидация, промежуточные данные

### Что логируем на ВХОДЕ (INFO уровень):
- HTTP метод и URL
- Заголовки запроса (без токенов)
- Тело запроса (пароли скрываются)
- Query параметры
- URL параметры
- IP адрес пользователя
- Идентификатор пользователя (если авторизован)

### Что логируем В ПРОЦЕССЕ (DEBUG/TRACE уровни):
- Все поиски в базе данных с условиями
- Сравнения данных (пароли, токены, коды)
- Валидация полей ввода
- Проверки прав доступа
- Вычисления (расстояния, возраст)
- Операции с файлами
- Проверки лимитов и ограничений

### Что логируем НА ВЫХОДЕ (INFO уровень):
- HTTP статус код
- Возвращаемые данные (токены скрываются)
- Результат операции (успех/ошибка)
- Время выполнения запроса

## Детальная стратегия по роутам

### AUTH роуты (src/routes/auth.js)

#### POST /login
**Вход:**
- login, password (скрыт)
**Процесс:**
- Поиск пользователя: `User.findByLoginOrEmail(login)`
- Сравнение паролей: `user.validatePassword(password)`
- Генерация токена: `generateToken(user)`
- Обновление БД: `user.update({ auth_token, online })`
**Выход:**
- success, token (скрыт), user данные

#### POST /send-code
**Вход:**
- email
**Процесс:**
- Проверка существования: `User.findOne({ where: { email } })`
- Проверка таймаута отправки
- Генерация кода: `generateEmailCode()`
- Отправка email
**Выход:**
- success, message

#### POST /register
**Вход:**
- email, mail_code (скрыт), login, password (скрыт), about, individual
**Процесс:**
- Валидация кода: сравнение `storedCode` с `mail_code`
- Проверка уникальности: `User.findOne` по login и email
- Создание пользователя: `User.create`
- Генерация токена: `generateToken(user)`
**Выход:**
- success, token (скрыт), user данные

#### POST /reset-password
**Вход:**
- email, mail_code (скрыт), password (скрыт)
**Процесс:**
- Валидация кода
- Поиск пользователя: `User.findOne({ where: { email } })`
- Обновление пароля: `user.update({ password })`
**Выход:**
- success, message

#### POST /logout
**Вход:**
- auth header
**Процесс:**
- Очистка токена: `User.update({ auth_token: null })`
**Выход:**
- success, message

### USERS роуты (src/routes/users.js)

#### GET /profile/:login
**Вход:**
- login (URL параметр), authorization header
**Процесс:**
- Поиск пользователя: `User.findOne({ where: { login } })`
- Поиск requestera для расчета расстояния
- Вычисление расстояния: `calculateDistance()`
- Форматирование данных: `formatAge()`, `formatOnlineTime()`
**Выход:**
- Полные данные профиля

#### PUT /profile
**Вход:**
- Данные профиля для обновления
**Процесс:**
- Валидация обязательных полей
- Поиск пользователя: `User.findOne({ where: { login: userId } })`
- Обновление: `user.update(newData)`
**Выход:**
- success, message, user данные

#### POST /upload-avatar
**Вход:**
- Файл изображения, координаты обрезки
**Процесс:**
- Валидация файла
- Обработка с Sharp: `extract()`, `resize()`, `png()`
- Удаление старого файла
- Обновление БД: `user.update({ ava })`
**Выход:**
- success, filename, url

#### POST /upload-images
**Вход:**
- Массив файлов, type
**Процесс:**
- Валидация файлов
- Проверка VIP статуса для locked_images
- Обработка каждого файла с Sharp
- Обновление БД: добавление к images/locked_images
**Выход:**
- success, uploaded_files, urls

#### DELETE /images/:filename
**Вход:**
- filename, type query параметр
**Процесс:**
- Поиск пользователя
- Удаление из списка изображений
- Удаление файла с диска
- Обновление БД
**Выход:**
- success, message

#### POST /set-locked-password
**Вход:**
- password (скрыт)
**Процесс:**
- Валидация длины пароля
- Обновление: `user.update({ images_password })`
**Выход:**
- success, message

#### POST /unlock-images
**Вход:**
- target_user, password (скрыт)
**Процесс:**
- Проверка VIP статуса
- Поиск целевого пользователя
- Сравнение паролей: `targetUser.images_password === password`
**Выход:**
- success, images, urls

### CHAT роуты (src/routes/chat.js)

#### GET /:username
**Вход:**
- username, limit, offset
**Процесс:**
- Проверка существования: `User.findOne({ where: { login: username } })`
- Поиск сообщений: `Chat.findAll` с условиями
- Отметка как прочитанные: `Chat.update({ is_read: true })`
- Форматирование сообщений
**Выход:**
- success, messages, companion, total_count

#### POST /send
**Вход:**
- to_user, message, файлы изображений
**Процесс:**
- Валидация получателя: `User.findOne({ where: { login: to_user } })`
- Обработка загруженных файлов
- Создание сообщения: `Chat.create`
**Выход:**
- success, message, data

#### GET /status/:username
**Вход:**
- username
**Процесс:**
- Обновление своего статуса в userStatuses
- Получение статуса собеседника из userStatuses
- Расчет времени активности
- Поиск последней активности в БД при необходимости
**Выход:**
- username, status, timestamp

#### POST /typing
**Вход:**
- to_user, is_typing
**Процесс:**
- Обновление статуса в userStatuses Map
**Выход:**
- success, message

#### GET /unread-count
**Вход:**
- auth header
**Процесс:**
- Подсчет: `Chat.count({ where: { to_user: currentUser, is_read: false } })`
**Выход:**
- success, unread_count

#### GET /conversations
**Вход:**
- limit, offset
**Процесс:**
- Поиск всех чатов: `Chat.findAll`
- Группировка по собеседникам
- Подсчет непрочитанных для каждого
- Поиск информации о собеседниках: `User.findAll`
**Выход:**
- success, conversations, total_count

#### DELETE /:username
**Вход:**
- username
**Процесс:**
- Удаление сообщений: `Chat.destroy` для обеих сторон
**Выход:**
- success, message, deleted_messages

### ADS роуты (src/routes/ads.js)

#### GET /
**Вход:**
- type, country, city, limit, offset, author
**Процесс:**
- Построение WHERE условий
- Поиск объявлений: `Ads.findAll`
- Поиск авторов: `User.findAll`
- Объединение данных
- Подсчет общего количества: `Ads.count`
**Выход:**
- success, ads, pagination

#### POST /create
**Вход:**
- type, description
**Процесс:**
- Валидация полей и длины
- Поиск пользователя: `User.findOne`
- Проверка лимитов для FREE пользователей
- Создание: `Ads.create`
**Выход:**
- success, message, ad

#### PUT /:id
**Вход:**
- id, type, description
**Процесс:**
- Поиск объявления: `Ads.findOne({ where: { id } })`
- Проверка прав: `ad.login === userLogin`
- Обновление: `ad.update`
**Выход:**
- success, message, ad

#### DELETE /:id
**Вход:**
- id
**Процесс:**
- Поиск объявления
- Проверка прав
- Удаление: `ad.destroy()`
**Выход:**
- success, message

#### GET /my
**Вход:**
- limit, offset
**Процесс:**
- Поиск объявлений пользователя: `Ads.findAll({ where: { login: userLogin } })`
- Подсчет: `Ads.count`
**Выход:**
- success, ads, pagination

#### POST /:id/respond
**Вход:**
- id, message
**Процесс:**
- Поиск объявления
- Проверка не свое ли объявление
- Создание сообщения: `Chat.create`
**Выход:**
- success, message

#### GET /stats
**Вход:**
- VIP проверка
**Процесс:**
- Подсчет общих: `Ads.count()`
- Группировка по типам: `Ads.findAll` с GROUP BY
- Группировка по городам: `Ads.findAll` с GROUP BY
**Выход:**
- success, stats

### SWIPE роуты (src/routes/swipe.js)

#### GET /profiles
**Вход:**
- direction
**Процесс:**
- Поиск текущего пользователя
- Если назад - проверка VIP и истории
- Если вперед - случайный поиск: `User.findOne` с random()
- Вычисление расстояния
- Форматирование возраста и времени онлайн
- Обновление истории в userSlideHistory
**Выход:**
- Данные профиля

#### POST /like
**Вход:**
- target_user
**Процесс:**
- Проверка лимитов для FREE: `Likes.getTodayLikesCount`
- Проверка взаимного лайка: `Likes.checkMutualLike`
- Создание лайка: `Likes.create`
- Обновление взаимного при необходимости
**Выход:**
- result, message

#### POST /dislike
**Вход:**
- target_user
**Процесс:**
- Поиск входящего лайка: `Likes.findOne`
- Обновление на отклонен при необходимости
**Выход:**
- result, message

#### POST /superlike
**Вход:**
- target_user, message
**Процесс:**
- Проверка VIP статуса
- Проверка лимитов: `Likes.getTodaySuperlikes`
- Создание суперлайка: `Likes.create`
- Автоматическое создание взаимности
**Выход:**
- result, message, remaining_count

#### GET /superlike-count
**Вход:**
- auth header
**Процесс:**
- Проверка VIP статуса
- Подсчет использованных: `Likes.getTodaySuperlikes`
- Вычисление оставшихся
**Выход:**
- total, used, remaining, vip_type

### ADMIN роуты (src/routes/admin.js)

#### GET /stats
**Вход:**
- admin права
**Процесс:**
- Множественные подсчеты: `User.count()`, `Ads.count()`, etc
- Поиск последней активности: `User.findAll`
**Выход:**
- Статистика системы

#### GET /users
**Вход:**
- search, status, page, limit
**Процесс:**
- Построение WHERE условий с поиском
- Поиск пользователей: `User.findAll`
**Выход:**
- Список пользователей

#### POST /users/:userId/action
**Вход:**
- userId, action
**Процесс:**
- Поиск пользователя: `User.findByPk(userId)`
- Проверка прав администратора
- Выполнение действия: ban/unban/verify/delete
- При удалении - очистка связанных данных
**Выход:**
- message

И так далее для всех остальных admin эндпоинтов...

## Примеры логов

### Пример лога успешной авторизации:
```
2024-01-20T10:30:15.123Z [INFO] 🚀 [AUTH] POST /login - REQUEST START | User: anonymous | IP: 192.168.1.100
📄 Data: {
  "method": "POST",
  "body": { "login": "testuser", "password": "[HIDDEN]" },
  "requestId": "req_abc123"
}

2024-01-20T10:30:15.125Z [DEBUG] 💾 [AUTH] DB SEARCH - users | User: anonymous
📄 Data: {
  "operation": "SEARCH",
  "table": "users", 
  "data": { "condition": "login OR email = 'testuser'" },
  "requestId": "req_abc123"
}

2024-01-20T10:30:15.127Z [TRACE] ⚖️ [AUTH] COMPARISON: Password validation
📄 Data: {
  "expected": "[HIDDEN]",
  "actual": "[HIDDEN]", 
  "result": true,
  "match": true,
  "requestId": "req_abc123"
}

2024-01-20T10:30:15.130Z [DEBUG] 🧮 [AUTH] STEP 1: Token generation | User: testuser
📄 Data: {
  "step": 1,
  "data": { "userId": 12345, "login": "testuser" },
  "requestId": "req_abc123"
}

2024-01-20T10:30:15.135Z [INFO] ✅ [AUTH] REQUEST SUCCESS | User: testuser | IP: 192.168.1.100
📄 Data: {
  "statusCode": 200,
  "responseData": { "success": true, "token": "[HIDDEN]", "user": {...} },
  "requestId": "req_abc123"
}