// Утилита для определения статуса мероприятий с учетом длительности

/**
 * Определяет статус мероприятия на основе даты начала и длительности
 * @param {string|Date} startDate - Дата начала мероприятия
 * @param {number} durationHours - Длительность в часах (по умолчанию 2)
 * @param {string|Date} endDate - Точная дата окончания (если указана, приоритет над durationHours)
 * @returns {string} - 'upcoming', 'ongoing', 'completed'
 */
export const getEventStatus = (startDate, durationHours = 2, endDate = null) => {
  const now = new Date();
  const eventStart = new Date(startDate);
  
  // Определяем дату окончания
  let eventEnd;
  if (endDate) {
    eventEnd = new Date(endDate);
  } else {
    eventEnd = new Date(eventStart.getTime() + (durationHours * 60 * 60 * 1000));
  }
  
  if (eventStart > now) {
    return 'upcoming'; // Предстоит
  } else if (now >= eventStart && now <= eventEnd) {
    return 'ongoing'; // Идет
  } else {
    return 'completed'; // Завершено
  }
};

/**
 * Получает отображаемый текст статуса
 * @param {string} status - Статус мероприятия
 * @returns {string} - Отображаемый текст
 */
export const getEventStatusText = (status) => {
  const statusMap = {
    'upcoming': 'Предстоит',
    'ongoing': 'Идет',
    'completed': 'Завершено'
  };
  
  return statusMap[status] || 'Неизвестно';
};

/**
 * Получает CSS класс для статуса
 * @param {string} status - Статус мероприятия
 * @returns {string} - CSS класс
 */
export const getEventStatusClass = (status) => {
  return `status-${status}`;
};

/**
 * Проверяет, можно ли присоединиться к мероприятию
 * @param {string|Date} startDate - Дата начала мероприятия
 * @param {number} durationHours - Длительность в часах
 * @param {string|Date} endDate - Точная дата окончания
 * @returns {boolean} - Можно ли присоединиться
 */
export const canJoinEvent = (startDate, durationHours = 2, endDate = null) => {
  const status = getEventStatus(startDate, durationHours, endDate);
  return status === 'upcoming';
};

/**
 * Получает оставшееся время до начала мероприятия
 * @param {string|Date} startDate - Дата начала мероприятия
 * @returns {string|null} - Оставшееся время или null если мероприятие уже началось
 */
export const getTimeUntilStart = (startDate) => {
  const now = new Date();
  const eventStart = new Date(startDate);
  
  if (eventStart <= now) {
    return null;
  }
  
  const diff = eventStart.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days} дн. ${hours} ч.`;
  } else if (hours > 0) {
    return `${hours} ч. ${minutes} мин.`;
  } else {
    return `${minutes} мин.`;
  }
};

/**
 * Получает оставшееся время до окончания мероприятия
 * @param {string|Date} startDate - Дата начала мероприятия
 * @param {number} durationHours - Длительность в часах
 * @param {string|Date} endDate - Точная дата окончания
 * @returns {string|null} - Оставшееся время или null если мероприятие еще не началось или уже закончилось
 */
export const getTimeUntilEnd = (startDate, durationHours = 2, endDate = null) => {
  const now = new Date();
  const eventStart = new Date(startDate);
  
  // Определяем дату окончания
  let eventEnd;
  if (endDate) {
    eventEnd = new Date(endDate);
  } else {
    eventEnd = new Date(eventStart.getTime() + (durationHours * 60 * 60 * 1000));
  }
  
  if (now < eventStart || now > eventEnd) {
    return null;
  }
  
  const diff = eventEnd.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours} ч. ${minutes} мин.`;
  } else {
    return `${minutes} мин.`;
  }
};
