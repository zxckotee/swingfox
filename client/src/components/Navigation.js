import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { apiUtils } from '../services/api';
import { Avatar, FlexContainer, IconButton } from './UI';

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
  z-index: 100;
  backdrop-filter: blur(10px);
`;

const NavContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70px;
  
  @media (max-width: 768px) {
    padding: 0 15px;
    height: 60px;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const LogoIcon = styled.div`
  width: 45px;
  height: 45px;
  background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
  border-radius: 12px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  box-shadow: 0 4px 15px rgba(220, 53, 34, 0.3);
  
  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }
`;

const LogoText = styled.div`
  font-size: 24px;
  font-weight: bold;
  background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  
  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 12px;
  color: #4a5568;
  text-decoration: none;
  font-weight: 500;
  font-size: 15px;
  transition: all 0.3s ease;
  position: relative;
  
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
  
  &:hover {
    transform: scale(1.05);
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
  padding: 8px;
  min-width: 220px;
  z-index: 1000;
  backdrop-filter: blur(10px);
  
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
  
  @media (max-width: 768px) {
    display: flex;
  }
`;

const MobileMenu = styled.div`
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e2e8f0;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  padding: 20px;
  
  @media (max-width: 768px) {
    display: ${props => props.$show ? 'block' : 'none'};
  }
`;

const MobileNavLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  color: #4a5568;
  text-decoration: none;
  border-radius: 12px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &.active {
    background: linear-gradient(135deg, #dc3522 0%, #ff6b58 100%);
    color: white;
  }
  
  &:hover:not(.active) {
    background: #f7fafc;
    text-decoration: none;
  }
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: -5px;
  right: -5px;
  background: #f56565;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
`;

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const userMenuRef = useRef(null);
  
  const currentUser = apiUtils.getCurrentUser();

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
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      setShowMobileMenu(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  return (
    <NavContainer>
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
            to="/chat" 
            className={location.pathname.startsWith('/chat') ? 'active' : ''}
          >
            <ChatIcon />
            Чат
            {/* Здесь можно добавить бейдж с количеством непрочитанных сообщений */}
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
                $size="45px"
                $fontSize="18px"
                $clickable
              >
                {!currentUser.ava && currentUser.login.charAt(0).toUpperCase()}
              </Avatar>
            </UserMenuButton>
            
            <DropdownMenu $show={showUserMenu}>
              <DropdownItem onClick={handleProfileClick}>
                <ProfileIcon />
                Мой профиль
              </DropdownItem>
              <DropdownItem onClick={() => navigate('/profile')}>
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
            onClick={() => setShowMobileMenu(!showMobileMenu)}
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
          to="/chat" 
          className={location.pathname.startsWith('/chat') ? 'active' : ''}
          onClick={() => setShowMobileMenu(false)}
        >
          <ChatIcon />
          Чат
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