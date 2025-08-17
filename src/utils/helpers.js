const jwt = require('jsonwebtoken');

// Генерация уникального ID (как в PHP версии)
const generateId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return parseInt(`${timestamp}${random.toString().padStart(3, '0')}`);
};

// Генерация JWT токена
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id,
      login: user.login,
      vipType: user.viptype 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Генерация кода для email
const generateEmailCode = () => {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += Math.floor(Math.random() * 10);
  }
  return code;
};

// Вычисление расстояния между координатами (формула гаверсинусов)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const radiusEarth = 6371; // радиус Земли в км
  
  const lat1Rad = lat1 * Math.PI / 180;
  const lon1Rad = lon1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const lon2Rad = lon2 * Math.PI / 180;
  
  const d = 2 * radiusEarth * Math.asin(
    Math.sqrt(
      Math.sin((lat2Rad - lat1Rad) / 2) ** 2 + 
      Math.cos(lat1Rad) * Math.cos(lat2Rad) * 
      Math.sin((lon2Rad - lon1Rad) / 2) ** 2
    )
  );
  
  return parseFloat(d.toFixed(3));
};

// Форматирование возраста с правильными окончаниями
const formatAge = (birthDate) => {
  if (!birthDate) return '';
  
  const dates = birthDate.split('_');
  const now = new Date();
  
  const getAgeString = (dateStr) => {
    const birth = new Date(dateStr);
    const age = Math.floor((now - birth) / (365.25 * 24 * 60 * 60 * 1000));
    
    const lastDigit = age % 10;
    let metric;
    
    if (lastDigit === 1 && age !== 11) {
      metric = 'год';
    } else if (lastDigit >= 2 && lastDigit <= 4 && (age < 10 || age >= 20)) {
      metric = 'года';
    } else {
      metric = 'лет';
    }
    
    return `${age} ${metric}`;
  };
  
  if (dates.length === 2) {
    // Пара
    const age1 = getAgeString(dates[0]);
    const age2 = getAgeString(dates[1]);
    return `${age1} (М) / ${age2} (Ж)`;
  } else {
    // Один человек
    return getAgeString(dates[0]);
  }
};

// Парсинг координат из строки "lat&&lng"
const parseGeo = (geoString) => {
  if (!geoString) return null;
  const coords = geoString.split('&&');
  if (coords.length !== 2) return null;
  
  return {
    lat: parseFloat(coords[0]),
    lng: parseFloat(coords[1])
  };
};

// Форматирование времени онлайн
const formatOnlineTime = (lastOnline) => {
  if (!lastOnline) return 'никогда не был онлайн';
  
  const now = new Date();
  const diff = now - new Date(lastOnline);
  const minutes = Math.floor(diff / (1000 * 60));
  
  if (minutes < 2) return 'сейчас';
  if (minutes < 60) return `${minutes} мин назад`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} дн назад`;
  
  return lastOnline.toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

module.exports = {
  generateId,
  generateToken,
  generateEmailCode,
  calculateDistance,
  formatAge,
  parseGeo,
  formatOnlineTime
};