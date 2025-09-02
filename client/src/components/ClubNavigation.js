import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clubAuth } from '../services/clubApi';
import '../styles/ClubNavigation.css';

// Иконки
const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9,22 9,12 15,12 15,22"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const ChartBarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 20V10"/>
    <path d="M12 20V4"/>
    <path d="M6 20v-6"/>
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

const CogIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const UserGroupIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const RobotIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="10" rx="2" ry="2"/>
    <circle cx="12" cy="5" r="2"/>
    <path d="M12 7v4"/>
    <line x1="8" y1="16" x2="8" y2="16"/>
    <line x1="16" y1="16" x2="16" y2="16"/>
  </svg>
);

const Bars3Icon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const XMarkIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const ClubNavigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    {
      name: 'Дашборд',
      href: '/club/dashboard',
      icon: HomeIcon,
      description: 'Главная страница клуба'
    },
    {
      name: 'Мероприятия',
      href: '/club/events',
      icon: CalendarIcon,
      description: 'Управление мероприятиями'
    },
    {
      name: 'Объявления',
      href: '/club/ads',
      icon: BellIcon,
      description: 'Управление объявлениями'
    },
    {
      name: 'Аналитика',
      href: '/club/analytics',
      icon: ChartBarIcon,
      description: 'Статистика и отчеты'
    },
    {
      name: 'Заявки',
      href: '/club/applications',
      icon: UsersIcon,
      description: 'Заявки на вступление'
    },
    {
      name: 'Боты',
      href: '/club/bots',
      icon: RobotIcon,
      description: 'Автоматизация и боты'
    },
    {
      name: 'Участники',
      href: '/club/participants',
      icon: UserGroupIcon,
      description: 'Управление участниками'
    },
    {
      name: 'Настройки',
      href: '/club/settings',
      icon: CogIcon,
      description: 'Настройки клуба'
    }
  ];

  const handleLogout = async () => {
    try {
      await clubAuth.removeToken();
      navigate('/club/login');
    } catch (error) {
      console.error('Ошибка выхода:', error);
    }
  };

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="club-navigation">
        <div className="nav-header">
          <div className="nav-logo">
            <img src="/images/club-logo.png" alt="Club Logo" />
            <span className="logo-text">SwingFox Club</span>
          </div>
        </div>

        <div className="nav-menu">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
                title={item.description}
              >
                <Icon className="nav-icon" />
                <span className="nav-text">{item.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="nav-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <CogIcon className="nav-icon" />
            <span className="nav-text">Выйти</span>
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Toggle */}
      <button
        className="mobile-nav-toggle"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? (
          <XMarkIcon className="toggle-icon" />
        ) : (
          <Bars3Icon className="toggle-icon" />
        )}
      </button>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="mobile-nav-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <nav className="mobile-navigation" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-nav-header">
              <div className="nav-logo">
                <img src="/images/club-logo.png" alt="Club Logo" />
                <span className="logo-text">SwingFox Club</span>
              </div>
              <button
                className="mobile-close-btn"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <XMarkIcon className="close-icon" />
              </button>
            </div>

            <div className="mobile-nav-menu">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`mobile-nav-item ${isActive(item.href) ? 'active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="nav-icon" />
                    <div className="mobile-nav-content">
                      <span className="nav-text">{item.name}</span>
                      <span className="nav-description">{item.description}</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mobile-nav-footer">
              <button className="mobile-logout-btn" onClick={handleLogout}>
                <CogIcon className="nav-icon" />
                <span className="nav-text">Выйти</span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
};

export default ClubNavigation;
