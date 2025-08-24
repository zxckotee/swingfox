// Маппинг статусов пользователей из базы данных в отображаемые названия
export const STATUS_MAPPING = {
  // Маппинг из базы данных в отображаемые названия
  'single_man': 'Мужчина',
  'single_woman': 'Женщина',
  'couple_married': 'Семейная пара(М+Ж)',
  'couple_unmarried': 'Несемейная пара(М+Ж)',
  
  // Обратный маппинг для фильтров
  'Мужчина': 'single_man',
  'Женщина': 'single_woman',
  'Семейная пара(М+Ж)': 'couple_married',
  'Несемейная пара(М+Ж)': 'couple_unmarried'
};

// Функция для получения отображаемого названия статуса
export const getStatusDisplayName = (dbStatus) => {
  return STATUS_MAPPING[dbStatus] || dbStatus;
};

// Функция для получения значения базы данных из отображаемого названия
export const getStatusDbValue = (displayName) => {
  return STATUS_MAPPING[displayName] || displayName;
};

// Функция для получения всех доступных отображаемых статусов
export const getAvailableStatuses = () => {
  return [
    'Семейная пара(М+Ж)',
    'Несемейная пара(М+Ж)',
    'Мужчина',
    'Женщина'
  ];
};
