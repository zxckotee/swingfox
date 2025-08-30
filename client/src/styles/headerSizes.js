import { BREAKPOINTS } from './breakpoints';

// Адаптивные размеры для элементов шапки
export const HEADER_SIZES = {
  // Высота шапки
  height: {
    tiny: '50px',
    mobile: '55px',
    mobileLarge: '58px',
    tablet: '62px',
    tabletLarge: '66px',
    desktop: '70px',
    desktopLarge: '75px',
    desktopXL: '80px'
  },
  
  // Отступы контейнера
  padding: {
    tiny: '0 8px',
    mobile: '0 12px',
    mobileLarge: '0 15px',
    tablet: '0 18px',
    tabletLarge: '0 22px',
    desktop: '0 25px',
    desktopLarge: '0 30px',
    desktopXL: '0 35px'
  },
  
  // Логотип иконка
  logoIcon: {
    tiny: '32px',
    mobile: '36px',
    mobileLarge: '38px',
    tablet: '40px',
    tabletLarge: '42px',
    desktop: '45px',
    desktopLarge: '48px',
    desktopXL: '52px'
  },
  
  // Размер шрифта иконки логотипа
  logoIconFont: {
    tiny: '13px',
    mobile: '14px',
    mobileLarge: '15px',
    tablet: '16px',
    tabletLarge: '17px',
    desktop: '18px',
    desktopLarge: '19px',
    desktopXL: '21px'
  },
  
  // Текст логотипа
  logoText: {
    tiny: '16px',
    mobile: '18px',
    mobileLarge: '19px',
    tablet: '20px',
    tabletLarge: '22px',
    desktop: '24px',
    desktopLarge: '26px',
    desktopXL: '28px'
  },
  
  // Навигационные ссылки
  navLink: {
    padding: {
      tiny: '6px 8px',
      mobile: '8px 10px',
      mobileLarge: '8px 12px',
      tablet: '10px 14px',
      tabletLarge: '10px 16px',
      desktop: '12px 16px',
      desktopLarge: '12px 18px',
      desktopXL: '14px 20px'
    },
    fontSize: {
      tiny: '12px',
      mobile: '13px',
      mobileLarge: '13px',
      tablet: '14px',
      tabletLarge: '14px',
      desktop: '15px',
      desktopLarge: '15px',
      desktopXL: '16px'
    },
    gap: {
      tiny: '4px',
      mobile: '5px',
      mobileLarge: '6px',
      tablet: '6px',
      tabletLarge: '7px',
      desktop: '8px',
      desktopLarge: '8px',
      desktopXL: '10px'
    }
  },
  
  // Контейнер навигационных ссылок
  navLinks: {
    gap: {
      tiny: '2px',
      mobile: '4px',
      mobileLarge: '6px',
      tablet: '6px',
      tabletLarge: '8px',
      desktop: '8px',
      desktopLarge: '10px',
      desktopXL: '12px'
    }
  },
  
  // Аватар пользователя
  userAvatar: {
    tiny: '34px',
    mobile: '36px',
    mobileLarge: '38px',
    tablet: '40px',
    tabletLarge: '42px',
    desktop: '45px',
    desktopLarge: '48px',
    desktopXL: '52px'
  },
  
  // VIP индикатор
  vipIndicator: {
    tiny: '14px',
    mobile: '16px',
    mobileLarge: '17px',
    tablet: '18px',
    tabletLarge: '19px',
    desktop: '20px',
    desktopLarge: '22px',
    desktopXL: '24px'
  },
  
  // Бейдж уведомлений
  notificationBadge: {
    tiny: '14px',
    mobile: '16px',
    mobileLarge: '17px',
    tablet: '17px',
    tabletLarge: '18px',
    desktop: '18px',
    desktopLarge: '20px',
    desktopXL: '22px'
  },
  
  // Мобильное меню
  mobileMenu: {
    padding: {
      tiny: '12px',
      mobile: '15px',
      mobileLarge: '18px',
      tablet: '20px',
      tabletLarge: '22px'
    },
    linkPadding: {
      tiny: '12px',
      mobile: '14px',
      mobileLarge: '16px',
      tablet: '16px',
      tabletLarge: '18px'
    },
    fontSize: {
      tiny: '14px',
      mobile: '15px',
      mobileLarge: '15px',
      tablet: '16px',
      tabletLarge: '16px'
    }
  },
  
  // Dropdown меню
  dropdown: {
    minWidth: {
      tiny: '200px',
      mobile: '220px',
      mobileLarge: '240px',
      tablet: '250px',
      tabletLarge: '260px',
      desktop: '280px',
      desktopLarge: '300px',
      desktopXL: '320px'
    },
    padding: {
      tiny: '6px',
      mobile: '8px',
      mobileLarge: '8px',
      tablet: '10px',
      tabletLarge: '10px',
      desktop: '12px',
      desktopLarge: '12px',
      desktopXL: '14px'
    }
  }
};

// Функция для получения размера по брейкпоинту
export const getSize = (sizePath, currentBreakpoint = 'desktop') => {
  const pathArray = sizePath.split('.');
  let value = HEADER_SIZES;
  
  for (const path of pathArray) {
    value = value[path];
    if (!value) return null;
  }
  
  // Проверяем доступные размеры и возвращаем подходящий
  const availableSizes = Object.keys(value);
  
  // Приоритет по убыванию размера экрана
  const priorities = ['desktopXL', 'desktopLarge', 'desktop', 'tabletLarge', 'tablet', 'mobileLarge', 'mobile', 'tiny'];
  
  // Находим индекс текущего брейкпоинта
  const currentIndex = priorities.indexOf(currentBreakpoint);
  
  // Ищем подходящий размер, начиная с текущего и идя вниз по приоритету
  for (let i = currentIndex; i < priorities.length; i++) {
    const priority = priorities[i];
    if (availableSizes.includes(priority)) {
      return value[priority];
    }
  }
  
  // Если ничего не найдено, возвращаем первый доступный
  return value[availableSizes[0]] || null;
};

// Функция для создания адаптивного CSS с размерами
export const createResponsiveCSS = (sizePath, cssProp = 'font-size') => {
  const pathArray = sizePath.split('.');
  let sizeObj = HEADER_SIZES;
  
  for (const path of pathArray) {
    sizeObj = sizeObj[path];
    if (!sizeObj) return '';
  }
  
  let css = '';
  
  // Базовый размер (mobile first)
  if (sizeObj.tiny) {
    css += `${cssProp}: ${sizeObj.tiny};\n`;
  }
  
  // Медиа-запросы по возрастанию
  const breakpointOrder = [
    { key: 'mobile', bp: BREAKPOINTS.MOBILE },
    { key: 'mobileLarge', bp: BREAKPOINTS.MOBILE_LARGE },
    { key: 'tablet', bp: BREAKPOINTS.TABLET },
    { key: 'tabletLarge', bp: BREAKPOINTS.TABLET_LARGE },
    { key: 'desktop', bp: BREAKPOINTS.DESKTOP },
    { key: 'desktopLarge', bp: BREAKPOINTS.DESKTOP_LARGE },
    { key: 'desktopXL', bp: BREAKPOINTS.DESKTOP_XL }
  ];
  
  for (const { key, bp } of breakpointOrder) {
    if (sizeObj[key]) {
      css += `\n@media (min-width: ${bp}) {\n  ${cssProp}: ${sizeObj[key]};\n}`;
    }
  }
  
  return css;
};

// Экспорт утилит для быстрого доступа
export const UTILS = {
  getSize,
  createResponsiveCSS,
  BREAKPOINTS,
  HEADER_SIZES
};