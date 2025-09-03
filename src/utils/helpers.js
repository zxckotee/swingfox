/**
 * Утилиты для SwingFox приложения
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Генерирует уникальный ID на основе времени и случайных чисел
 * @returns {string} Уникальный ID
 */
function generateId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `${timestamp}${random.toString().padStart(6, '0')}`;
}

/**
 * Валидация email адреса
 * @param {string} email - Email для проверки
 * @returns {boolean} Валиден ли email
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Очистка строки от HTML тегов
 * @param {string} str - Строка для очистки
 * @returns {string} Очищенная строка
 */
function stripHtml(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Ограничение длины строки с добавлением многоточия
 * @param {string} str - Исходная строка
 * @param {number} maxLength - Максимальная длина
 * @returns {string} Обрезанная строка
 */
function truncateString(str, maxLength) {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Форматирование даты в читаемый вид
 * @param {Date|string} date - Дата для форматирования
 * @returns {string} Отформатированная дата
 */
function formatDate(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  
  // Меньше минуты
  if (diff < 60000) {
    return 'только что';
  }
  
  // Меньше часа
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} мин назад`;
  }
  
  // Меньше дня
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} час${hours === 1 ? '' : hours < 5 ? 'а' : 'ов'} назад`;
  }
  
  // Меньше недели
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'} назад`;
  }
  
  // Обычное форматирование
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}.${month}.${year}`;
}

/**
 * Валидация пароля
 * @param {string} password - Пароль для проверки
 * @returns {object} Результат валидации
 */
function validatePassword(password) {
  const errors = [];
  
  if (!password) {
    errors.push('Пароль обязателен');
    return { valid: false, errors };
  }
  
  if (password.length < 6) {
    errors.push('Пароль должен содержать минимум 6 символов');
  }
  
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('Пароль должен содержать буквы');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Пароль должен содержать цифры');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Генерация случайной строки
 * @param {number} length - Длина строки
 * @param {string} chars - Набор символов
 * @returns {string} Случайная строка
 */
function generateRandomString(length = 16, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Расчет расстояния между двумя точками (Haversine formula)
 * @param {number} lat1 - Широта первой точки
 * @param {number} lon1 - Долгота первой точки
 * @param {number} lat2 - Широта второй точки
 * @param {number} lon2 - Долгота второй точки
 * @returns {number} Расстояние в километрах
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Радиус Земли в км
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Конвертация возраста в год рождения
 * @param {number} age - Возраст
 * @returns {number} Год рождения
 */
function ageToYear(age) {
  return new Date().getFullYear() - age;
}

/**
 * Конвертация года рождения в возраст
 * @param {number} year - Год рождения
 * @returns {number} Возраст
 */
function yearToAge(year) {
  return new Date().getFullYear() - year;
}

/**
 * Сокрытие части email адреса
 * @param {string} email - Email адрес
 * @returns {string} Замаскированный email
 */
function maskEmail(email) {
  if (!email || !email.includes('@')) return email;
  
  const [name, domain] = email.split('@');
  if (name.length <= 2) return email;
  
  const maskedName = name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
  return `${maskedName}@${domain}`;
}

/**
 * Escape строки для SQL запросов
 * @param {string} str - Строка для экранирования
 * @returns {string} Экранированная строка
 */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Генерирует JWT токен для пользователя
 * @param {Object} user - Объект пользователя с полем id
 * @returns {string} JWT токен
 */
function generateToken(user) {
  const payload = {
    userId: user.id,
    login: user.login
  };
  
  const secret = process.env.JWT_SECRET || 'swingfox_default_secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  
  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Генерирует 6-значный цифровой код для подтверждения email
 * @returns {string} 6-значный код
 */
function generateEmailCode() {
  // Используем криптографически стойкий генератор
  const buffer = crypto.randomBytes(3);
  const code = parseInt(buffer.toString('hex'), 16) % 1000000;
  return code.toString().padStart(6, '0');
}

/**
 * Дебаунс функция
 * @param {Function} func - Функция для дебаунса
 * @param {number} wait - Время ожидания в мс
 * @returns {Function} Дебаунс функция
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

module.exports = {
  generateId,
  generateToken,
  generateEmailCode,
  isValidEmail,
  stripHtml,
  truncateString,
  formatDate,
  validatePassword,
  generateRandomString,
  calculateDistance,
  ageToYear,
  yearToAge,
  maskEmail,
  escapeHtml,
  debounce,
  parseGeo,
  formatAge,
  formatWomanAge,
  formatOnlineTime
};

/**
 * Парсинг геолокационных данных из строки формата "lat&&lng"
 * @param {string} geoString - Строка с координатами в формате "lat&&lng"
 * @returns {object|null} Объект с координатами {lat, lng} или null
 */
function parseGeo(geoString) {
  if (!geoString || typeof geoString !== 'string') {
    return null;
  }
  
  const parts = geoString.split('&&');
  if (parts.length !== 2) {
    return null;
  }
  
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  
  if (isNaN(lat) || isNaN(lng)) {
    return null;
  }
  
  return { lat, lng };
}

/**
 * Форматирование возраста по дате рождения
 * @param {string|Date} birthDate - Дата рождения (формат: "2000-02-20" для одиночки или "2000-09-12_2000-02-20" для пары)
 * @returns {number|null} Возраст в годах или null
 */
function formatAge(birthDate) {
  if (!birthDate) {
    return null;
  }
  
  // Если это пара (содержит _), берем первую дату (мужчина)
  let dateString = birthDate;
  if (typeof birthDate === 'string' && birthDate.includes('_')) {
    dateString = birthDate.split('_')[0];
  }
  
  let date;
  if (typeof dateString === 'string') {
    // Пробуем парсить разные форматы дат
    if (dateString.includes('-')) {
      date = new Date(dateString);
    } else if (dateString.length === 4) {
      // Если это просто год
      date = new Date(parseInt(dateString), 0, 1);
    } else {
      date = new Date(dateString);
    }
  } else {
    date = new Date(dateString);
  }
  
  if (isNaN(date.getTime())) {
    return null;
  }
  
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--;
  }
  
  return age >= 0 ? age : null;
}

/**
 * Получение возраста женщины в паре
 * @param {string} birthDate - Дата рождения пары (формат: "2000-09-12_2000-02-20")
 * @returns {number|null} Возраст женщины в годах или null
 */
function formatWomanAge(birthDate) {
  if (!birthDate || typeof birthDate !== 'string' || !birthDate.includes('_')) {
    return null;
  }
  
  const womanDateString = birthDate.split('_')[1];
  if (!womanDateString) {
    return null;
  }
  
  const date = new Date(womanDateString);
  if (isNaN(date.getTime())) {
    return null;
  }
  
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--;
  }
  
  return age >= 0 ? age : null;
}

/**
 * Форматирование времени последней активности
 * @param {string|Date|number} lastOnline - Время последней активности
 * @returns {string} Отформатированное время или статус
 */
function formatOnlineTime(lastOnline) {
  if (!lastOnline) {
    return 'Не в сети';
  }
  
  let onlineDate;
  
  // Обрабатываем разные форматы времени
  if (typeof lastOnline === 'number') {
    // Unix timestamp
    onlineDate = new Date(lastOnline * 1000);
  } else if (typeof lastOnline === 'string') {
    onlineDate = new Date(lastOnline);
  } else {
    onlineDate = new Date(lastOnline);
  }
  
  if (isNaN(onlineDate.getTime())) {
    return 'Не в сети';
  }
  
  const now = new Date();
  const diff = now - onlineDate;
  
  // Онлайн (последние 5 минут)
  if (diff < 300000) { // 5 minutes
    return 'В сети';
  }
  
  // Меньше часа
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} мин назад`;
  }
  
  // Меньше дня
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} час${hours === 1 ? '' : hours < 5 ? 'а' : 'ов'} назад`;
  }
  
  // Меньше недели
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'} назад`;
  }
  
  // Больше недели - показываем дату
  const day = onlineDate.getDate().toString().padStart(2, '0');
  const month = (onlineDate.getMonth() + 1).toString().padStart(2, '0');
  const year = onlineDate.getFullYear();
  
  return `${day}.${month}.${year}`;
}