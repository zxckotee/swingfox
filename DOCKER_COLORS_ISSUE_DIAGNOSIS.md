# Диагностика проблемы с модулем 'colors' в Docker

## Описание проблемы
```
Error: Cannot find module 'colors'
Require stack:
- /app/src/utils/logger.js
- /app/src/routes/auth.js
- /app/server.js
```

## Факты
1. ✅ `colors` присутствует в `package.json` (версия ^1.4.0)
2. ✅ Локальных `node_modules` нет в корне проекта
3. ✅ Docker выполнил `docker-compose build` и пересобрал образы
4. ✅ `.dockerignore` корректно исключает `node_modules`
5. ✅ `docker-compose.yml` использует анонимный volume для `/app/node_modules`

## Возможные причины

### 1. Проблема с Docker кешом
**Диагностика:**
```bash
# Проверить какие слои закешированы
docker-compose build --no-cache backend

# Или полная очистка
docker system prune -a
docker-compose build
```

### 2. Проблема с npm ci в контейнере
**Диагностика:**
```bash
# Проверить установку зависимостей в контейнере
docker-compose exec backend ls -la /app/node_modules/colors
docker-compose exec backend npm list colors
```

### 3. Рассинхронизация package-lock.json
**Диагностика:**
```bash
# Проверить целостность lock файла
npm audit fix
npm ci  # локально для проверки
```

### 4. Проблема с путями в Dockerfile
**Возможная проблема:** При `COPY . .` может происходить перезапись

### 5. Node.js alpine совместимость
**Возможная проблема:** `colors` может требовать нативные зависимости

## План исправления

### Шаг 1: Диагностика в контейнере
```bash
# Войти в контейнер
docker-compose exec backend sh

# Проверить структуру node_modules
ls -la /app/node_modules/ | grep colors
cat /app/package.json | grep colors

# Попробовать установить colors вручную
npm install colors
```

### Шаг 2: Проверка Dockerfile
Возможно нужно:
1. Использовать `npm install` вместо `npm ci`
2. Добавить явную установку colors
3. Проверить права доступа

### Шаг 3: Полная пересборка без кеша
```bash
docker-compose down
docker system prune -a
docker-compose build --no-cache
docker-compose up
```

### Шаг 4: Альтернативное решение
Если проблема критична - временно убрать зависимость от colors:
```javascript
// Fallback без colors
let colors;
try {
  colors = require('colors');
} catch (e) {
  // Создать заглушки для методов colors
  colors = {
    red: { bold: (text) => `[ERROR] ${text}` },
    yellow: { bold: (text) => `[WARN] ${text}` },
    blue: { bold: (text) => `[INFO] ${text}` },
    green: { bold: (text) => `[DEBUG] ${text}` },
    gray: { bold: (text) => `[TRACE] ${text}` },
    cyan: (text) => text,
    magenta: (text) => text
  };
}
```

## Следующие шаги
1. Выполнить диагностику в контейнере
2. Проверить package-lock.json
3. Пересобрать без кеша если нужно
4. Обновить Dockerfile если найдены проблемы