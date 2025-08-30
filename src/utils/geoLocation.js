const axios = require('axios');

/**
 * Получение геолокации по IP адресу
 * @param {string} ip - IP адрес
 * @returns {string|null} Координаты в формате "lat&&lng" или null
 */
async function getGeoByIP(ip) {
  try {
    // Используем тот же сервис, что и в PHP коде - ip-api.com
    const response = await axios.get(`http://ip-api.com/json/${ip}`, {
      timeout: 5000 // Таймаут 5 секунд
    });
    
    if (response.data && response.data.status === 'success' && response.data.lat && response.data.lon) {
      return `${response.data.lat}&&${response.data.lon}`;
    }
    
    console.warn(`Не удалось получить геолокацию для IP ${ip}:`, response.data);
    return null;
  } catch (error) {
    console.error(`Ошибка получения геолокации для IP ${ip}:`, error.message);
    return null;
  }
}

/**
 * Получение IP адреса из запроса
 * @param {Object} req - Express request объект
 * @returns {string} IP адрес
 */
function getClientIP(req) {
  // Проверяем различные заголовки для получения реального IP
  // X-Forwarded-For используется прокси-серверами
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // Берем первый IP из списка (клиентский IP)
    return forwardedFor.split(',')[0].trim();
  }
  
  // X-Real-IP используется nginx
  if (req.headers['x-real-ip']) {
    return req.headers['x-real-ip'];
  }
  
  // Стандартные поля Express
  if (req.connection && req.connection.remoteAddress) {
    return req.connection.remoteAddress;
  }
  
  if (req.socket && req.socket.remoteAddress) {
    return req.socket.remoteAddress;
  }
  
  // Express 4.x
  if (req.ip) {
    return req.ip;
  }
  
  // Fallback для localhost
  return '127.0.0.1';
}

/**
 * Проверка валидности IP адреса
 * @param {string} ip - IP адрес для проверки
 * @returns {boolean} true если IP валиден
 */
function isValidIP(ip) {
  if (!ip || typeof ip !== 'string') return false;
  
  // Простая проверка на IPv4
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }
  
  // Проверка на IPv6 (упрощенная)
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv6Regex.test(ip);
}

/**
 * Получение геолокации с fallback на дефолтные координаты
 * @param {string} ip - IP адрес
 * @param {string} fallbackGeo - Fallback координаты в формате "lat&&lng"
 * @returns {string} Координаты в формате "lat&&lng"
 */
async function getGeoWithFallback(ip, fallbackGeo = '55.7558&&37.6176') { // Москва по умолчанию
  if (!isValidIP(ip) || ip === '127.0.0.1' || ip === 'localhost') {
    console.log(`Используем fallback геолокацию для IP ${ip}`);
    return fallbackGeo;
  }
  
  const geo = await getGeoByIP(ip);
  if (geo) {
    return geo;
  }
  
  console.log(`Не удалось получить геолокацию для IP ${ip}, используем fallback`);
  return fallbackGeo;
}

module.exports = {
  getGeoByIP,
  getClientIP,
  isValidIP,
  getGeoWithFallback
};
