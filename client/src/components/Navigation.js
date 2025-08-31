import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useQueryClient, useQuery } from 'react-query';
import toast from 'react-hot-toast';
import { apiUtils, notificationsAPI } from '../services/api';
import { Avatar, FlexContainer, IconButton } from './UI';
import { MEDIA } from '../styles/breakpoints';
import { HEADER_SIZES } from '../styles/headerSizes';

// Иконки
const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9,22 9,12 15,12 15,22"/>
  </svg>
);

const ChatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const AdsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
);

const AdminIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 1l3 6 6 3-6 3-3 6-3-6-6-3 6-3z"/>
  </svg>
);

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const GiftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20,12 20,22 4,22 4,12"/>
    <rect x="2" y="7" width="20" height="5"/>
    <line x1="12" y1="22" x2="12" y2="7"/>
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const CrownIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 3h12l4 6-10 13L2 9z"/>
    <path d="M11 3L8 9l4 13 4-13-3-6"/>
    <path d="M2 9l4.5 13L11 9"/>
    <path d="M13 9l4.5 13L22 9"/>
  </svg>
);

const TrophyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
    <path d="M5.7 8H2a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h3.7"/>
    <path d="M18.3 8H22a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-3.7"/>
    <path d="M5.7 8v5.7C5.7 17 8.3 19 12 19s6.3-2 6.3-5.3V8"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="M21 21l-4.35-4.35"/>
  </svg>
);

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const ProfileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16,17 21,12 16,7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const NavContainer = styled.nav`
  background: white;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 1000;
  backdrop-filter: blur(10px);
  
  /* Классы для устранения конфликтов с старым CSS */
  &.react-navigation-container {
    position: sticky !important;
    top: 0 !important;
    z-index: 1000 !important;
    width: 100% !important;
    background: white !important;
    border-bottom: 1px solid #e2e8f0 !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08) !important;
    backdrop-filter: blur(10px) !important;
  }
`;

const NavContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  /* Высота и отступы по новой системе */
  height: ${HEADER_SIZES.height.tiny};
  padding: ${HEADER_SIZES.padding.tiny};
  
  ${MEDIA.mobile} {
    height: ${HEADER_SIZES.height.mobile};
    padding: ${HEADER_SIZES.padding.mobile};
  }
  
  ${MEDIA.mobileLarge} {
    height: ${HEADER_SIZES.height.mobileLarge};
    padding: ${HEADER_SIZES.padding.mobileLarge};
  }
  
  ${MEDIA.tablet} {
    height: ${HEADER_SIZES.height.tablet};
    padding: ${HEADER_SIZES.padding.tablet};
  }
  
  ${MEDIA.tabletLarge} {
    height: ${HEADER_SIZES.height.tabletLarge};
    padding: ${HEADER_SIZES.padding.tabletLarge};
  }
  
  ${MEDIA.desktop} {
    height: ${HEADER_SIZES.height.desktop};
    padding: ${HEADER_SIZES.padding.desktop};
  }
  
  ${MEDIA.desktopLarge} {
    height: ${HEADER_SIZES.height.desktopLarge};
    padding: ${HEADER_SIZES.padding.desktopLarge};
    max-width: 1400px;
  }
  
  ${MEDIA.desktopXL} {
    height: ${HEADER_SIZES.height.desktopXL};
    padding: ${HEADER_SIZES.padding.desktopXL};
    max-width: 1600px;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const LogoIcon = styled.div`
  background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
  border-radius: 12px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  box-shadow: 0 4px 15px rgba(220, 53, 34, 0.3);
  transition: all 0.3s ease;
  
  /* Адаптивные размеры */
  width: ${HEADER_SIZES.logoIcon.tiny};
  height: ${HEADER_SIZES.logoIcon.tiny};
  font-size: ${HEADER_SIZES.logoIconFont.tiny};
  
  ${MEDIA.mobile} {
    width: ${HEADER_SIZES.logoIcon.mobile};
    height: ${HEADER_SIZES.logoIcon.mobile};
    font-size: ${HEADER_SIZES.logoIconFont.mobile};
  }
  
  ${MEDIA.mobileLarge} {
    width: ${HEADER_SIZES.logoIcon.mobileLarge};
    height: ${HEADER_SIZES.logoIcon.mobileLarge};
    font-size: ${HEADER_SIZES.logoIconFont.mobileLarge};
  }
  
  ${MEDIA.tablet} {
    width: ${HEADER_SIZES.logoIcon.tablet};
    height: ${HEADER_SIZES.logoIcon.tablet};
    font-size: ${HEADER_SIZES.logoIconFont.tablet};
  }
  
  ${MEDIA.tabletLarge} {
    width: ${HEADER_SIZES.logoIcon.tabletLarge};
    height: ${HEADER_SIZES.logoIcon.tabletLarge};
    font-size: ${HEADER_SIZES.logoIconFont.tabletLarge};
  }
  
  ${MEDIA.desktop} {
    width: ${HEADER_SIZES.logoIcon.desktop};
    height: ${HEADER_SIZES.logoIcon.desktop};
    font-size: ${HEADER_SIZES.logoIconFont.desktop};
  }
  
  ${MEDIA.desktopLarge} {
    width: ${HEADER_SIZES.logoIcon.desktopLarge};
    height: ${HEADER_SIZES.logoIcon.desktopLarge};
    font-size: ${HEADER_SIZES.logoIconFont.desktopLarge};
  }
  
  ${MEDIA.desktopXL} {
    width: ${HEADER_SIZES.logoIcon.desktopXL};
    height: ${HEADER_SIZES.logoIcon.desktopXL};
    font-size: ${HEADER_SIZES.logoIconFont.desktopXL};
  }
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(220, 53, 34, 0.4);
  }
`;

const LogoText = styled.div`
  font-weight: bold;
  background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  transition: all 0.3s ease;
  user-select: none;
  
  /* Адаптивные размеры шрифта */
  font-size: ${HEADER_SIZES.logoText.tiny};
  
  ${MEDIA.mobile} {
    font-size: ${HEADER_SIZES.logoText.mobile};
  }
  
  ${MEDIA.mobileLarge} {
    font-size: ${HEADER_SIZES.logoText.mobileLarge};
  }
  
  ${MEDIA.tablet} {
    font-size: ${HEADER_SIZES.logoText.tablet};
  }
  
  ${MEDIA.tabletLarge} {
    font-size: ${HEADER_SIZES.logoText.tabletLarge};
  }
  
  ${MEDIA.desktop} {
    font-size: ${HEADER_SIZES.logoText.desktop};
  }
  
  ${MEDIA.desktopLarge} {
    font-size: ${HEADER_SIZES.logoText.desktopLarge};
  }
  
  ${MEDIA.desktopXL} {
    font-size: ${HEADER_SIZES.logoText.desktopXL};
  }
  
  /* Скрываем на самых маленьких экранах */
  ${MEDIA.maxMobile} {
    display: none;
  }
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  
  /* Адаптивный gap */
  gap: ${HEADER_SIZES.navLinks.gap.tiny};
  
  ${MEDIA.mobile} {
    gap: ${HEADER_SIZES.navLinks.gap.mobile};
  }
  
  ${MEDIA.mobileLarge} {
    gap: ${HEADER_SIZES.navLinks.gap.mobileLarge};
  }
  
  ${MEDIA.tablet} {
    gap: ${HEADER_SIZES.navLinks.gap.tablet};
  }
  
  ${MEDIA.tabletLarge} {
    gap: ${HEADER_SIZES.navLinks.gap.tabletLarge};
  }
  
  ${MEDIA.desktop} {
    gap: ${HEADER_SIZES.navLinks.gap.desktop};
  }
  
  ${MEDIA.desktopLarge} {
    gap: ${HEADER_SIZES.navLinks.gap.desktopLarge};
  }
  
  ${MEDIA.desktopXL} {
    gap: ${HEADER_SIZES.navLinks.gap.desktopXL};
  }
  
  /* Скрываем при ширине меньше 1170px */
  ${MEDIA.maxDesktopMobile} {
    display: none;
  }
`;

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  border-radius: 12px;
  color: #4a5568;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
  white-space: nowrap;
  
  /* Адаптивные размеры */
  padding: ${HEADER_SIZES.navLink.padding.tiny};
  font-size: ${HEADER_SIZES.navLink.fontSize.tiny};
  gap: ${HEADER_SIZES.navLink.gap.tiny};
  
  ${MEDIA.mobile} {
    padding: ${HEADER_SIZES.navLink.padding.mobile};
    font-size: ${HEADER_SIZES.navLink.fontSize.mobile};
    gap: ${HEADER_SIZES.navLink.gap.mobile};
  }
  
  ${MEDIA.mobileLarge} {
    padding: ${HEADER_SIZES.navLink.padding.mobileLarge};
    font-size: ${HEADER_SIZES.navLink.fontSize.mobileLarge};
    gap: ${HEADER_SIZES.navLink.gap.mobileLarge};
  }
  
  ${MEDIA.tablet} {
    padding: ${HEADER_SIZES.navLink.padding.tablet};
    font-size: ${HEADER_SIZES.navLink.fontSize.tablet};
    gap: ${HEADER_SIZES.navLink.gap.tablet};
  }
  
  ${MEDIA.tabletLarge} {
    padding: ${HEADER_SIZES.navLink.padding.tabletLarge};
    font-size: ${HEADER_SIZES.navLink.fontSize.tabletLarge};
    gap: ${HEADER_SIZES.navLink.gap.tabletLarge};
  }
  
  ${MEDIA.desktop} {
    padding: ${HEADER_SIZES.navLink.padding.desktop};
    font-size: ${HEADER_SIZES.navLink.fontSize.desktop};
    gap: ${HEADER_SIZES.navLink.gap.desktop};
  }
  
  ${MEDIA.desktopLarge} {
    padding: ${HEADER_SIZES.navLink.padding.desktopLarge};
    font-size: ${HEADER_SIZES.navLink.fontSize.desktopLarge};
    gap: ${HEADER_SIZES.navLink.gap.desktopLarge};
  }
  
  ${MEDIA.desktopXL} {
    padding: ${HEADER_SIZES.navLink.padding.desktopXL};
    font-size: ${HEADER_SIZES.navLink.fontSize.desktopXL};
    gap: ${HEADER_SIZES.navLink.gap.desktopXL};
  }
  
  &:hover {
    background: linear-gradient(135deg, rgba(220, 53, 34, 0.1) 0%, rgba(255, 107, 88, 0.1) 100%);
    color: #dc3522;
    text-decoration: none;
    transform: translateY(-1px);
  }
  
  &.active {
    background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(220, 53, 34, 0.3);
  }
  
  /* Иконки в ссылках */
  svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    
    ${MEDIA.desktopLarge} {
      width: 20px;
      height: 20px;
    }
    
    ${MEDIA.desktopXL} {
      width: 22px;
      height: 22px;
    }
  }
`;

const UserSection = styled.div`
  position: relative;
`;

const UserMenuButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const VipIndicator = styled.div`
  position: absolute;
  bottom: -2px;
  right: -2px;
  border-radius: 50%;
  background: ${props => props.$color};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  
  /* Адаптивные размеры */
  width: ${HEADER_SIZES.vipIndicator.tiny};
  height: ${HEADER_SIZES.vipIndicator.tiny};
  font-size: 8px;
  
  ${MEDIA.mobile} {
    width: ${HEADER_SIZES.vipIndicator.mobile};
    height: ${HEADER_SIZES.vipIndicator.mobile};
    font-size: 9px;
  }
  
  ${MEDIA.mobileLarge} {
    width: ${HEADER_SIZES.vipIndicator.mobileLarge};
    height: ${HEADER_SIZES.vipIndicator.mobileLarge};
    font-size: 9px;
  }
  
  ${MEDIA.tablet} {
    width: ${HEADER_SIZES.vipIndicator.tablet};
    height: ${HEADER_SIZES.vipIndicator.tablet};
    font-size: 10px;
  }
  
  ${MEDIA.tabletLarge} {
    width: ${HEADER_SIZES.vipIndicator.tabletLarge};
    height: ${HEADER_SIZES.vipIndicator.tabletLarge};
    font-size: 10px;
  }
  
  ${MEDIA.desktop} {
    width: ${HEADER_SIZES.vipIndicator.desktop};
    height: ${HEADER_SIZES.vipIndicator.desktop};
    font-size: 10px;
  }
  
  ${MEDIA.desktopLarge} {
    width: ${HEADER_SIZES.vipIndicator.desktopLarge};
    height: ${HEADER_SIZES.vipIndicator.desktopLarge};
    font-size: 11px;
  }
  
  ${MEDIA.desktopXL} {
    width: ${HEADER_SIZES.vipIndicator.desktopXL};
    height: ${HEADER_SIZES.vipIndicator.desktopXL};
    font-size: 12px;
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 15px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  
  /* Адаптивные размеры */
  padding: ${HEADER_SIZES.dropdown.padding.tiny};
  min-width: ${HEADER_SIZES.dropdown.minWidth.tiny};
  
  ${MEDIA.mobile} {
    padding: ${HEADER_SIZES.dropdown.padding.mobile};
    min-width: ${HEADER_SIZES.dropdown.minWidth.mobile};
  }
  
  ${MEDIA.mobileLarge} {
    padding: ${HEADER_SIZES.dropdown.padding.mobileLarge};
    min-width: ${HEADER_SIZES.dropdown.minWidth.mobileLarge};
  }
  
  ${MEDIA.tablet} {
    padding: ${HEADER_SIZES.dropdown.padding.tablet};
    min-width: ${HEADER_SIZES.dropdown.minWidth.tablet};
  }
  
  ${MEDIA.tabletLarge} {
    padding: ${HEADER_SIZES.dropdown.padding.tabletLarge};
    min-width: ${HEADER_SIZES.dropdown.minWidth.tabletLarge};
  }
  
  ${MEDIA.desktop} {
    padding: ${HEADER_SIZES.dropdown.padding.desktop};
    min-width: ${HEADER_SIZES.dropdown.minWidth.desktop};
  }
  
  ${MEDIA.desktopLarge} {
    padding: ${HEADER_SIZES.dropdown.padding.desktopLarge};
    min-width: ${HEADER_SIZES.dropdown.minWidth.desktopLarge};
  }
  
  ${MEDIA.desktopXL} {
    padding: ${HEADER_SIZES.dropdown.padding.desktopXL};
    min-width: ${HEADER_SIZES.dropdown.minWidth.desktopXL};
  }
  
  ${props => !props.$show && 'display: none;'}
  
  &::before {
    content: '';
    position: absolute;
    top: -8px;
    right: 20px;
    width: 16px;
    height: 16px;
    background: white;
    border-left: 1px solid #e2e8f0;
    border-top: 1px solid #e2e8f0;
    transform: rotate(45deg);
  }
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: 12px 16px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.2s ease;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #4a5568;
  
  &:hover {
    background: linear-gradient(135deg, rgba(220, 53, 34, 0.1) 0%, rgba(255, 107, 88, 0.1) 100%);
    color: #dc3522;
  }
  
  &.danger {
    color: #f56565;
    
    &:hover {
      background: rgba(245, 101, 101, 0.1);
    }
  }
`;

const MobileMenuButton = styled(IconButton)`
  display: none;
  transition: all 0.3s ease;
  
  /* Показываем при ширине меньше 1170px */
  ${MEDIA.maxDesktopMobile} {
    display: flex;
  }
  
  /* Адаптивные размеры для иконки меню */
  svg {
    width: 22px;
    height: 22px;
    
    ${MEDIA.mobile} {
      width: 24px;
      height: 24px;
    }
    
    ${MEDIA.tablet} {
      width: 26px;
      height: 26px;
    }
  }
  
  &:hover {
    transform: scale(1.1);
  }
`;

const MobileMenu = styled.div.attrs({
  className: 'react-mobile-menu'
})`
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e2e8f0;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  z-index: 999;
  
  /* Адаптивные отступы */
  padding: ${HEADER_SIZES.mobileMenu.padding.tiny};
  
  ${MEDIA.mobile} {
    padding: ${HEADER_SIZES.mobileMenu.padding.mobile};
  }
  
  ${MEDIA.mobileLarge} {
    padding: ${HEADER_SIZES.mobileMenu.padding.mobileLarge};
  }
  
  ${MEDIA.tablet} {
    padding: ${HEADER_SIZES.mobileMenu.padding.tablet};
  }
  
  ${MEDIA.tabletLarge} {
    padding: ${HEADER_SIZES.mobileMenu.padding.tabletLarge};
  }
  
  ${MEDIA.maxDesktopMobile} {
    display: ${props => props.$show ? 'block' : 'none'};
  }
`;

const MobileNavLink = styled(Link)`
  display: flex;
  align-items: center;
  color: #4a5568;
  text-decoration: none;
  border-radius: 12px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
  font-weight: 500;
  
  /* Адаптивные размеры */
  padding: ${HEADER_SIZES.mobileMenu.linkPadding.tiny};
  gap: 10px;
  font-size: ${HEADER_SIZES.mobileMenu.fontSize.tiny};
  
  ${MEDIA.mobile} {
    padding: ${HEADER_SIZES.mobileMenu.linkPadding.mobile};
    gap: 12px;
    font-size: ${HEADER_SIZES.mobileMenu.fontSize.mobile};
  }
  
  ${MEDIA.mobileLarge} {
    padding: ${HEADER_SIZES.mobileMenu.linkPadding.mobileLarge};
    gap: 12px;
    font-size: ${HEADER_SIZES.mobileMenu.fontSize.mobileLarge};
  }
  
  ${MEDIA.tablet} {
    padding: ${HEADER_SIZES.mobileMenu.linkPadding.tablet};
    gap: 14px;
    font-size: ${HEADER_SIZES.mobileMenu.fontSize.tablet};
  }
  
  ${MEDIA.tabletLarge} {
    padding: ${HEADER_SIZES.mobileMenu.linkPadding.tabletLarge};
    gap: 14px;
    font-size: ${HEADER_SIZES.mobileMenu.fontSize.tabletLarge};
  }
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &.active {
    background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(220, 53, 34, 0.3);
  }
  
  &:hover:not(.active) {
    background: #f7fafc;
    text-decoration: none;
    transform: translateX(4px);
  }
  
  /* Иконки в мобильном меню */
  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    
    ${MEDIA.tablet} {
      width: 22px;
      height: 22px;
    }
  }
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: -5px;
  right: -5px;
  background: #f56565;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(245, 101, 101, 0.4);
  transition: all 0.3s ease;
  
  /* Адаптивные размеры */
  width: ${HEADER_SIZES.notificationBadge.tiny};
  height: ${HEADER_SIZES.notificationBadge.tiny};
  font-size: 10px;
  
  ${MEDIA.mobile} {
    width: ${HEADER_SIZES.notificationBadge.mobile};
    height: ${HEADER_SIZES.notificationBadge.mobile};
    font-size: 11px;
  }
  
  ${MEDIA.mobileLarge} {
    width: ${HEADER_SIZES.notificationBadge.mobileLarge};
    height: ${HEADER_SIZES.notificationBadge.mobileLarge};
    font-size: 11px;
  }
  
  ${MEDIA.tablet} {
    width: ${HEADER_SIZES.notificationBadge.tablet};
    height: ${HEADER_SIZES.notificationBadge.tablet};
    font-size: 12px;
  }
  
  ${MEDIA.tabletLarge} {
    width: ${HEADER_SIZES.notificationBadge.tabletLarge};
    height: ${HEADER_SIZES.notificationBadge.tabletLarge};
    font-size: 12px;
  }
  
  ${MEDIA.desktop} {
    width: ${HEADER_SIZES.notificationBadge.desktop};
    height: ${HEADER_SIZES.notificationBadge.desktop};
    font-size: 12px;
  }
  
  ${MEDIA.desktopLarge} {
    width: ${HEADER_SIZES.notificationBadge.desktopLarge};
    height: ${HEADER_SIZES.notificationBadge.desktopLarge};
    font-size: 13px;
  }
  
  ${MEDIA.desktopXL} {
    width: ${HEADER_SIZES.notificationBadge.desktopXL};
    height: ${HEADER_SIZES.notificationBadge.desktopXL};
    font-size: 14px;
  }
`;

// Компонент счетчика уведомлений
const NotificationCounter = () => {
  const { data: unreadCountData } = useQuery(
    'unread-notifications-count',
    () => notificationsAPI.getUnreadCount(),
    {
      refetchInterval: 30000, // Обновляем каждые 30 секунд
      retry: 1,
      enabled: apiUtils.isAuthenticated(), // Проверяем авторизацию
      onError: (error) => {
        // Тихо игнорируем ошибки для счетчика, но логируем 401
        if (error.response?.status === 401) {
          console.log('Unauthorized in Navigation notification counter');
        }
      }
    }
  );

  const unreadCount = unreadCountData?.total_unread || 0;

  if (!unreadCount || unreadCount === 0) return null;

  return (
    <NotificationBadge>
      {unreadCount > 99 ? '99+' : unreadCount}
    </NotificationBadge>
  );
};

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const userMenuRef = useRef(null);
  
  // Получаем актуальные данные пользователя при монтировании
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = apiUtils.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          
          // Если нет аватарки в кэше, пытаемся обновить данные
          if (!user.ava) {
            const updatedUser = await apiUtils.refreshCurrentUser();
            if (updatedUser) {
              setCurrentUser(updatedUser);
            }
          }
        }
      } catch (error) {
        console.warn('Ошибка получения данных пользователя:', error);
        setCurrentUser(apiUtils.getCurrentUser());
      }
    };

    fetchUserData();
  }, []);

  // Подписываемся на изменения в localStorage для синхронизации между табами
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'swingfox_user_cache' || event.key === 'swingfox_token') {
        const user = apiUtils.getCurrentUser();
        setCurrentUser(user);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Функция для принудительного обновления данных пользователя
  const refreshUserData = async () => {
    try {
      const updatedUser = await apiUtils.refreshCurrentUser();
      if (updatedUser) {
        setCurrentUser(updatedUser);
      }
    } catch (error) {
      console.warn('Ошибка обновления данных пользователя:', error);
    }
  };

  // Добавляем глобальный обработчик для обновления навигации
  useEffect(() => {
    window.refreshNavigation = refreshUserData;
    return () => {
      delete window.refreshNavigation;
    };
  }, []);

  const handleLogout = () => {
    if (window.confirm('Выйти из аккаунта?')) {
      apiUtils.logout();
      queryClient.clear();
      toast.success('Вы вышли из аккаунта');
      navigate('/login');
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setShowUserMenu(false);
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  // Закрытие меню при клике вне
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Закрытие пользовательского меню
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      
      // Закрытие мобильного меню только если клик не по кнопке меню и не внутри самого меню
      const mobileMenuButton = event.target.closest('[data-mobile-menu-button]');
      const mobileMenuContent = event.target.closest('.react-mobile-menu');
      
      if (!mobileMenuButton && !mobileMenuContent && showMobileMenu) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMobileMenu]);

  if (!currentUser) return null;

  return (
    <NavContainer className="react-navigation-container">
      <NavContent>
        <LogoContainer>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LogoIcon>SF</LogoIcon>
            <LogoText>SwingFox</LogoText>
          </Link>
        </LogoContainer>

        <NavLinks>
          <NavLink
            to="/"
            className={isActiveRoute('/') ? 'active' : ''}
          >
            <HomeIcon />
            Свайп
          </NavLink>
          
          <NavLink
            to="/catalog"
            className={isActiveRoute('/catalog') ? 'active' : ''}
          >
            <SearchIcon />
            Каталог
          </NavLink>
          
          <NavLink
            to="/chat"
            className={location.pathname.startsWith('/chat') ? 'active' : ''}
          >
            <ChatIcon />
            Чат
            {/* Здесь можно добавить бейдж с количеством непрочитанных сообщений */}
          </NavLink>
          
          <NavLink
            to="/notifications"
            className={isActiveRoute('/notifications') ? 'active' : ''}
            style={{ position: 'relative' }}
          >
            <BellIcon />
            Уведомления
            <NotificationCounter />
          </NavLink>
          

          
          <NavLink
            to="/clubs"
            className={isActiveRoute('/clubs') ? 'active' : ''}
          >
            <UsersIcon />
            Клубы
          </NavLink>
          
          <NavLink
            to="/subscriptions"
            className={isActiveRoute('/subscriptions') ? 'active' : ''}
          >
            <CrownIcon />
            VIP
          </NavLink>
          
          <NavLink
            to="/ratings"
            className={isActiveRoute('/ratings') ? 'active' : ''}
          >
            <TrophyIcon />
            Рейтинг
          </NavLink>
          
          <NavLink
            to="/ads"
            className={isActiveRoute('/ads') ? 'active' : ''}
          >
            <AdsIcon />
            Объявления
          </NavLink>
          
          {currentUser.is_admin && (
            <NavLink 
              to="/admin" 
              className={location.pathname.startsWith('/admin') ? 'active' : ''}
            >
              <AdminIcon />
              Админ
            </NavLink>
          )}
        </NavLinks>

        <FlexContainer $gap="12px">
          <UserSection ref={userMenuRef}>
            <UserMenuButton onClick={() => setShowUserMenu(!showUserMenu)}>
              <Avatar
                $src={currentUser.ava ? `/uploads/${currentUser.ava}` : ''}
                $size={HEADER_SIZES.userAvatar.desktop}
                $fontSize="18px"
                $clickable
                css={`
                  width: ${HEADER_SIZES.userAvatar.tiny};
                  height: ${HEADER_SIZES.userAvatar.tiny};
                  
                  ${MEDIA.mobile} {
                    width: ${HEADER_SIZES.userAvatar.mobile};
                    height: ${HEADER_SIZES.userAvatar.mobile};
                  }
                  
                  ${MEDIA.mobileLarge} {
                    width: ${HEADER_SIZES.userAvatar.mobileLarge};
                    height: ${HEADER_SIZES.userAvatar.mobileLarge};
                  }
                  
                  ${MEDIA.tablet} {
                    width: ${HEADER_SIZES.userAvatar.tablet};
                    height: ${HEADER_SIZES.userAvatar.tablet};
                  }
                  
                  ${MEDIA.tabletLarge} {
                    width: ${HEADER_SIZES.userAvatar.tabletLarge};
                    height: ${HEADER_SIZES.userAvatar.tabletLarge};
                  }
                  
                  ${MEDIA.desktop} {
                    width: ${HEADER_SIZES.userAvatar.desktop};
                    height: ${HEADER_SIZES.userAvatar.desktop};
                  }
                  
                  ${MEDIA.desktopLarge} {
                    width: ${HEADER_SIZES.userAvatar.desktopLarge};
                    height: ${HEADER_SIZES.userAvatar.desktopLarge};
                  }
                  
                  ${MEDIA.desktopXL} {
                    width: ${HEADER_SIZES.userAvatar.desktopXL};
                    height: ${HEADER_SIZES.userAvatar.desktopXL};
                  }
                `}
              >
                {!currentUser.ava && currentUser.login.charAt(0).toUpperCase()}
              </Avatar>
              {apiUtils.isVip(currentUser) && (
                <VipIndicator $color={apiUtils.getVipBadgeColor(currentUser.vipType)}>
                  {apiUtils.getVipBadgeIcon(currentUser.vipType)}
                </VipIndicator>
              )}
            </UserMenuButton>
            
            <DropdownMenu $show={showUserMenu}>
              <DropdownItem onClick={handleProfileClick}>
                <ProfileIcon />
                Мой профиль
              </DropdownItem>
              <DropdownItem onClick={() => navigate('/profile?tab=settings')}>
                <SettingsIcon />
                Настройки
              </DropdownItem>
              <DropdownItem className="danger" onClick={handleLogout}>
                <LogoutIcon />
                Выйти
              </DropdownItem>
            </DropdownMenu>
          </UserSection>

          <MobileMenuButton
            onClick={(e) => {
              e.stopPropagation();
              setShowMobileMenu(!showMobileMenu);
            }}
            data-mobile-menu-button="true"
            $variant="secondary"
          >
            <MenuIcon />
          </MobileMenuButton>
        </FlexContainer>
      </NavContent>

      <MobileMenu $show={showMobileMenu}>
        <MobileNavLink
          to="/"
          className={isActiveRoute('/') ? 'active' : ''}
          onClick={() => setShowMobileMenu(false)}
        >
          <HomeIcon />
          Свайп
        </MobileNavLink>
        
        <MobileNavLink
          to="/catalog"
          className={isActiveRoute('/catalog') ? 'active' : ''}
          onClick={() => setShowMobileMenu(false)}
        >
          <SearchIcon />
          Каталог
        </MobileNavLink>
        
        <MobileNavLink
          to="/chat"
          className={location.pathname.startsWith('/chat') ? 'active' : ''}
          onClick={() => setShowMobileMenu(false)}
        >
          <ChatIcon />
          Чат
        </MobileNavLink>
        
        <MobileNavLink
          to="/notifications"
          className={isActiveRoute('/notifications') ? 'active' : ''}
          onClick={() => setShowMobileMenu(false)}
          style={{ position: 'relative' }}
        >
          <BellIcon />
          Уведомления
          <NotificationCounter />
        </MobileNavLink>
        

        
        <MobileNavLink
          to="/clubs"
          className={isActiveRoute('/clubs') ? 'active' : ''}
          onClick={() => setShowMobileMenu(false)}
        >
          <UsersIcon />
          Клубы
        </MobileNavLink>
        
        <MobileNavLink
          to="/subscriptions"
          className={isActiveRoute('/subscriptions') ? 'active' : ''}
          onClick={() => setShowMobileMenu(false)}
        >
          <CrownIcon />
          VIP
        </MobileNavLink>
        
        <MobileNavLink
          to="/ratings"
          className={isActiveRoute('/ratings') ? 'active' : ''}
          onClick={() => setShowMobileMenu(false)}
        >
          <TrophyIcon />
          Рейтинг
        </MobileNavLink>
        
        <MobileNavLink
          to="/ads"
          className={isActiveRoute('/ads') ? 'active' : ''}
          onClick={() => setShowMobileMenu(false)}
        >
          <AdsIcon />
          Объявления
        </MobileNavLink>
        
        {currentUser.is_admin && (
          <MobileNavLink 
            to="/admin" 
            className={location.pathname.startsWith('/admin') ? 'active' : ''}
            onClick={() => setShowMobileMenu(false)}
          >
            <AdminIcon />
            Админ
          </MobileNavLink>
        )}
        
        <MobileNavLink 
          to="/profile" 
          onClick={() => setShowMobileMenu(false)}
        >
          <ProfileIcon />
          Профиль
        </MobileNavLink>
        
        <DropdownItem className="danger" onClick={handleLogout}>
          <LogoutIcon />
          Выйти
        </DropdownItem>
      </MobileMenu>
    </NavContainer>
  );
};

export default Navigation;