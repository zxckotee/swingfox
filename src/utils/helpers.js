/**
 * Утилиты для SwingFox приложения
 */

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
  debounce
};