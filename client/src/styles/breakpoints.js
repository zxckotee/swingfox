// Единая система брейкпоинтов для SwingFox
export const BREAKPOINTS = {
  // Мобильные устройства
  TINY: '320px',        // Самые маленькие устройства
  MOBILE: '480px',      // Стандартные мобильные
  MOBILE_LARGE: '576px', // Большие мобильные
  
  // Планшеты
  TABLET: '768px',      // Планшеты портретные
  TABLET_LARGE: '992px', // Планшеты альбомные
  
  // Десктопы (мобильное меню до 1170px)
  DESKTOP_MOBILE: '1170px', // Граница мобильного меню
  DESKTOP: '1200px',    // Стандартные десктопы
  DESKTOP_LARGE: '1440px', // Большие мониторы
  DESKTOP_XL: '1920px'  // Ultra wide/4K мониторы
};

// Медиа-запросы для styled-components
export const MEDIA = {
  // Mobile first подход
  mobile: `@media (min-width: ${BREAKPOINTS.MOBILE})`,
  mobileLarge: `@media (min-width: ${BREAKPOINTS.MOBILE_LARGE})`,
  tablet: `@media (min-width: ${BREAKPOINTS.TABLET})`,
  tabletLarge: `@media (min-width: ${BREAKPOINTS.TABLET_LARGE})`,
  desktopMobile: `@media (min-width: ${BREAKPOINTS.DESKTOP_MOBILE})`,
  desktop: `@media (min-width: ${BREAKPOINTS.DESKTOP})`,
  desktopLarge: `@media (min-width: ${BREAKPOINTS.DESKTOP_LARGE})`,
  desktopXL: `@media (min-width: ${BREAKPOINTS.DESKTOP_XL})`,
  
  // Max-width медиа-запросы для edge cases
  maxMobile: `@media (max-width: ${parseInt(BREAKPOINTS.MOBILE) - 1}px)`,
  maxMobileLarge: `@media (max-width: ${parseInt(BREAKPOINTS.MOBILE_LARGE) - 1}px)`,
  maxTablet: `@media (max-width: ${parseInt(BREAKPOINTS.TABLET) - 1}px)`,
  maxTabletLarge: `@media (max-width: ${parseInt(BREAKPOINTS.TABLET_LARGE) - 1}px)`,
  maxDesktopMobile: `@media (max-width: ${parseInt(BREAKPOINTS.DESKTOP_MOBILE) - 1}px)`,
  maxDesktop: `@media (max-width: ${parseInt(BREAKPOINTS.DESKTOP) - 1}px)`,
  maxDesktopLarge: `@media (max-width: ${parseInt(BREAKPOINTS.DESKTOP_LARGE) - 1}px)`,
  
  // Комбинированные диапазоны
  mobileOnly: `@media (max-width: ${parseInt(BREAKPOINTS.TABLET) - 1}px)`,
  tabletOnly: `@media (min-width: ${BREAKPOINTS.TABLET}) and (max-width: ${parseInt(BREAKPOINTS.DESKTOP_MOBILE) - 1}px)`,
  desktopOnly: `@media (min-width: ${BREAKPOINTS.DESKTOP_MOBILE})`,
  
  // Ориентация
  landscape: '@media (orientation: landscape)',
  portrait: '@media (orientation: portrait)',
  
  // Высокое разрешение
  retina: '@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)'
};

// Функция для получения значения брейкпоинта без 'px'
export const getBreakpointValue = (breakpoint) => {
  return parseInt(BREAKPOINTS[breakpoint]) || parseInt(breakpoint);
};

// Вспомогательная функция для создания кастомных медиа-запросов
export const createMediaQuery = (minWidth, maxWidth = null) => {
  if (maxWidth) {
    return `@media (min-width: ${minWidth}) and (max-width: ${maxWidth})`;
  }
  return `@media (min-width: ${minWidth})`;
};