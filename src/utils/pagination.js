/**
 * Утилиты для валидации параметров пагинации
 */

/**
 * Валидирует и нормализует параметры пагинации
 * @param {Object} params - Параметры запроса
 * @param {number|string} params.page - Номер страницы
 * @param {number|string} params.limit - Количество записей на странице
 * @param {Object} options - Дополнительные опции
 * @param {number} options.defaultPage - Страница по умолчанию (1)
 * @param {number} options.defaultLimit - Лимит по умолчанию (20)
 * @param {number} options.maxLimit - Максимальный лимит (100)
 * @returns {Object} Нормализованные параметры
 */
function validatePaginationParams(params = {}, options = {}) {
  const {
    defaultPage = 1,
    defaultLimit = 20,
    maxLimit = 100
  } = options;

  // Извлекаем параметры
  const { page, limit } = params;

  // Валидируем page
  let pageNum = parseInt(page);
  if (isNaN(pageNum) || pageNum < 1) {
    pageNum = defaultPage;
  }

  // Валидируем limit
  let limitNum = parseInt(limit);
  if (isNaN(limitNum) || limitNum < 1) {
    limitNum = defaultLimit;
  }
  
  // Ограничиваем максимальный лимит
  limitNum = Math.min(limitNum, maxLimit);

  // Вычисляем offset
  const offset = (pageNum - 1) * limitNum;

  return {
    page: pageNum,
    limit: limitNum,
    offset
  };
}

/**
 * Создает объект пагинации для ответа
 * @param {number} page - Текущая страница
 * @param {number} limit - Лимит на страницу
 * @param {number} total - Общее количество записей
 * @returns {Object} Объект пагинации
 */
function createPaginationResponse(page, limit, total) {
  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  };
}

/**
 * Проверяет, является ли значение числом
 * @param {any} value - Значение для проверки
 * @returns {boolean} true если значение является числом
 */
function isNumeric(value) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

/**
 * Безопасно преобразует строку в число
 * @param {string|number} value - Значение для преобразования
 * @param {number} defaultValue - Значение по умолчанию
 * @param {number} min - Минимальное значение
 * @param {number} max - Максимальное значение
 * @returns {number} Преобразованное число
 */
function safeParseInt(value, defaultValue = 0, min = -Infinity, max = Infinity) {
  const num = parseInt(value);
  if (isNaN(num)) {
    return defaultValue;
  }
  return Math.max(min, Math.min(max, num));
}

module.exports = {
  validatePaginationParams,
  createPaginationResponse,
  isNumeric,
  safeParseInt
};
