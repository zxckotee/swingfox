
// Уровни логирования
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

// Текущий уровень логирования (можно настроить через переменную окружения или конфиг)
let CURRENT_LOG_LEVEL = LOG_LEVELS.DEBUG;
let MAX_ARRAY_SIZE = 10;
let TRUNCATE_LARGE_DATA = true;

// Загружаем настройки логирования из конфига
try {
  const config = require('../../config/config.json');
  const env = process.env.NODE_ENV || 'development';
  const loggingConfig = config[env]?.logging_config;
  
  if (loggingConfig) {
    if (loggingConfig.level && LOG_LEVELS[loggingConfig.level.toUpperCase()] !== undefined) {
      CURRENT_LOG_LEVEL = LOG_LEVELS[loggingConfig.level.toUpperCase()];
    }
    if (loggingConfig.max_array_size !== undefined) {
      MAX_ARRAY_SIZE = loggingConfig.max_array_size;
    }
    if (loggingConfig.truncate_large_data !== undefined) {
      TRUNCATE_LARGE_DATA = loggingConfig.truncate_large_data;
    }
  }
} catch (error) {
  // Если конфиг не загружен, используем значения по умолчанию
  console.log('⚠️  Не удалось загрузить конфигурацию логирования, используются значения по умолчанию');
}

// Также можно переопределить через переменную окружения
if (process.env.LOG_LEVEL && LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] !== undefined) {
  CURRENT_LOG_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()];
}

// Утилиты для форматирования
const formatTimestamp = () => {
  return new Date().toISOString();
};

const formatUserId = (req) => {
  return req.user?.login || req.user?.id || 'anonymous';
};

const formatIP = (req) => {
  return req.ip || req.connection?.remoteAddress || 'unknown';
};

// Функция для безопасного логирования (удаляет пароли, токены и ограничивает размер массивов)
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  const sensitiveFields = ['password', 'auth_token', 'token', 'mail_code', 'images_password'];
  
  // Удаляем чувствительные поля
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[HIDDEN]';
    }
  });
  
  // Ограничиваем размер массивов в data поле
  if (sanitized.data && Array.isArray(sanitized.data)) {
    if (sanitized.data.length > MAX_ARRAY_SIZE) {
      sanitized.data = `[Array with ${sanitized.data.length} items - truncated for logging]`;
    }
  }
  
  // Ограничиваем размер других массивов
  Object.keys(sanitized).forEach(key => {
    if (Array.isArray(sanitized[key]) && sanitized[key].length > MAX_ARRAY_SIZE) {
      sanitized[key] = `[Array with ${sanitized[key].length} items - truncated for logging]`;
    }
  });
  
  return sanitized;
};

// Основная функция логирования
const log = (level, message, data = null, req = null) => {
  if (LOG_LEVELS[level] > CURRENT_LOG_LEVEL) return;
  
  const timestamp = formatTimestamp();
  const userId = req ? formatUserId(req) : null;
  const ip = req ? formatIP(req) : null;
  const sanitizedData = data ? sanitizeData(data) : null;
    
  let levelPrefix;
  switch (level) {
    case 'ERROR':
      levelPrefix = '[ERROR]';
      break;
    case 'WARN':
      levelPrefix = '[WARN] ';
      break;
    case 'INFO':
      levelPrefix = '[INFO] ';
      break;
    case 'DEBUG':
      levelPrefix = '[DEBUG]';
      break;
    case 'TRACE':
      levelPrefix = '[TRACE]';
      break;
    default:
      levelPrefix = '[LOG]  ';
  }
  
  let logMessage = `${timestamp} ${levelPrefix} ${message}`;
  
  if (userId) logMessage += ` | User: ${userId}`;
  if (ip) logMessage += ` | IP: ${ip}`;
  
  console.log(logMessage);
  
  if (sanitizedData) {
    console.log('📄 Data:', JSON.stringify(sanitizedData, null, 2));
  }
};

// API-специфичные функции логирования
class APILogger {
  constructor(routeName) {
    this.routeName = routeName;
    this.requestId = null;
  }
  
  // Логирование входящего запроса
  logRequest(req, endpoint) {
    this.requestId = Date.now() + Math.random().toString(36).substr(2, 9);
    
    log('INFO', `🚀 [${this.routeName}] ${endpoint} - REQUEST START`, {
      method: req.method,
      url: req.originalUrl,
      headers: sanitizeData(req.headers),
      body: sanitizeData(req.body),
      query: req.query,
      params: req.params,
      requestId: this.requestId
    }, req);
  }
  
  // Логирование процесса поиска/сравнения
  logProcess(message, data, req = null) {
    log('DEBUG', `🔍 [${this.routeName}] ${message}`, {
      ...sanitizeData(data),
      requestId: this.requestId
    }, req);
  }
  
  // Логирование операций с базой данных
  logDatabase(operation, table, data, req = null) {
    log('DEBUG', `💾 [${this.routeName}] DB ${operation} - ${table}`, {
      operation,
      table,
      data: sanitizeData(data),
      requestId: this.requestId
    }, req);
  }
  
  // Логирование сравнений и проверок
  logComparison(description, expected, actual, result, req = null) {
    log('TRACE', `⚖️ [${this.routeName}] COMPARISON: ${description}`, {
      expected: sanitizeData(expected),
      actual: sanitizeData(actual),
      result,
      match: expected === actual,
      requestId: this.requestId
    }, req);
  }
  
  // Логирование валидации
  logValidation(field, value, rules, isValid, req = null) {
    log('TRACE', `✅ [${this.routeName}] VALIDATION: ${field}`, {
      field,
      value: sanitizeData({ [field]: value })[field],
      rules,
      isValid,
      requestId: this.requestId
    }, req);
  }
  
  // Логирование успешного ответа
  logSuccess(req, statusCode, responseData) {
    log('INFO', `✅ [${this.routeName}] REQUEST SUCCESS`, {
      statusCode,
      responseData: sanitizeData(responseData),
      requestId: this.requestId
    }, req);
  }
  
  // Логирование ошибки
  logError(req, error, statusCode = 500) {
    log('ERROR', `❌ [${this.routeName}] REQUEST ERROR`, {
      error: error.message,
      stack: error.stack,
      statusCode,
      requestId: this.requestId
    }, req);
  }
  
  // Логирование предупреждения
  logWarning(message, data, req = null) {
    log('WARN', `⚠️ [${this.routeName}] ${message}`, {
      ...sanitizeData(data),
      requestId: this.requestId
    }, req);
  }
  
  // Логирование бизнес-логики
  logBusinessLogic(step, description, data, req = null) {
    log('DEBUG', `🧮 [${this.routeName}] STEP ${step}: ${description}`, {
      step,
      data: sanitizeData(data),
      requestId: this.requestId
    }, req);
  }
  
  // Логирование результата операции
  logResult(operation, success, data, req = null) {
    const emoji = success ? '✅' : '❌';
    const level = success ? 'INFO' : 'WARN';
    
    log(level, `${emoji} [${this.routeName}] RESULT: ${operation}`, {
      operation,
      success,
      data: sanitizeData(data),
      requestId: this.requestId
    }, req);
  }
}

// Middleware для автоматического логирования запросов
const loggerMiddleware = (routeName) => {
  return (req, res, next) => {
    const logger = new APILogger(routeName);
    req.apiLogger = logger;
    
    // Логируем входящий запрос
    logger.logRequest(req, `${req.method} ${req.route?.path || req.path}`);
    
    // Перехватываем ответ для логирования
    const originalSend = res.send;
    res.send = function(data) {
      try {
        const responseData = typeof data === 'string' ? JSON.parse(data) : data;
        logger.logSuccess(req, res.statusCode, responseData);
      } catch (e) {
        logger.logSuccess(req, res.statusCode, { response: 'non-json data' });
      }
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Экспорт функций
module.exports = {
  APILogger,
  loggerMiddleware,
  log,
  LOG_LEVELS,
  sanitizeData,
  CURRENT_LOG_LEVEL,
  MAX_ARRAY_SIZE,
  TRUNCATE_LARGE_DATA
};