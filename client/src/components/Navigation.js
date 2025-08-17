import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { apiUtils } from '../services/api';

const NavContainer = styled.nav`
  background: white;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  box-shadow: ${props => props.theme.shadow};
  position: sticky;
  top: 0;
  z-index: 100;
`;

const NavContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 ${props => props.theme.spacing.md};
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
`;

const Logo = styled.div`
  font-size: ${props => props.theme.fonts.sizes.xlarge};
  font-weight: bold;
  color: ${props => props.theme.colors.primary};
  
  a {
    color: inherit;
    text-decoration: none;
    
    &:hover {
      text-decoration: none;
    }
  }
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLink = styled(Link)`
  color: ${props => props.theme.colors.text};
  text-decoration: none;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius};
  transition: all 0.2s ease;
  font-weight: 500;
  position: relative;
  
  &:hover {
    background: ${props => props.theme.colors.background};
    text-decoration: none;
  }
  
  &.active {
    background: ${props => props.theme.colors.primary};
    color: white;
  }
`;

const UserMenu = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-image: url(${props => props.src});
  background-size: cover;
  background-position: center;
  background-color: ${props => props.theme.colors.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  cursor: pointer;
  border: 2px solid ${props => props.theme.colors.border};
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius};
  box-shadow: ${props => props.theme.shadow};
  padding: ${props => props.theme.spacing.sm};
  min-width: 200px;
  z-index: 1000;
  
  ${props => !props.show && 'display: none;'}
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: ${props => props.theme.borderRadius};
  transition: background 0.2s ease;
  font-size: ${props => props.theme.fonts.sizes.medium};
  
  &:hover {
    background: ${props => props.theme.colors.background};
  }
  
  &.danger {
    color: ${props => props.theme.colors.error};
  }
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: -5px;
  right: -5px;
  background: ${props => props.theme.colors.error};
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${props => props.theme.fonts.sizes.small};
  font-weight: bold;
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: ${props => props.theme.spacing.xs};
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileMenu = styled.div`
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid ${props => props.theme.colors.border};
  padding: ${props => props.theme.spacing.md};
  
  @media (max-width: 768px) {
    display: ${props => props.show ? 'block' : 'none'};
  }
`;

const MobileNavLink = styled(Link)`
  display: block;
  padding: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text};
  text-decoration: none;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  
  &:last-child {
    border-bottom: none;
  }
  
  &.active {
    background: ${props => props.theme.colors.primary};
    color: white;
  }
  
  &:hover {
    background: ${props => props.theme.colors.background};
    text-decoration: none;
  }
`;

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);
  
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
  React.useEffect(() => {
    const handleClickOutside = () => {
      setShowUserMenu(false);
      setShowMobileMenu(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  return (
    <NavContainer>
      <NavContent>
        <Logo>
          <Link to="/">SwingFox</Link>
        </Logo>

        <NavLinks>
          <NavLink 
            to="/" 
            className={isActiveRoute('/') ? 'active' : ''}
          >
            Свайп
          </NavLink>
          
          <NavLink 
            to="/chat" 
            className={location.pathname.startsWith('/chat') ? 'active' : ''}
          >
            Чат
            {/* Здесь можно добавить бейдж с количеством непрочитанных сообщений */}
          </NavLink>
          
          <NavLink 
            to="/ads" 
            className={isActiveRoute('/ads') ? 'active' : ''}
          >
            Объявления
          </NavLink>
          
          {currentUser.is_admin && (
            <NavLink 
              to="/admin" 
              className={location.pathname.startsWith('/admin') ? 'active' : ''}
            >
              Админ
            </NavLink>
          )}
        </NavLinks>

        <UserMenu onClick={(e) => e.stopPropagation()}>
          <UserAvatar
            src={currentUser.ava ? `/uploads/${currentUser.ava}` : ''}
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            {!currentUser.ava && currentUser.login.charAt(0).toUpperCase()}
          </UserAvatar>
          
          <DropdownMenu show={showUserMenu}>
            <DropdownItem onClick={handleProfileClick}>
              👤 Мой профиль
            </DropdownItem>
            <DropdownItem onClick={() => navigate('/profile')}>
              ⚙️ Настройки
            </DropdownItem>
            <DropdownItem className="danger" onClick={handleLogout}>
              🚪 Выйти
            </DropdownItem>
          </DropdownMenu>
        </UserMenu>

        <MobileMenuButton onClick={(e) => {
          e.stopPropagation();
          setShowMobileMenu(!showMobileMenu);
        }}>
          ☰
        </MobileMenuButton>
      </NavContent>

      <MobileMenu show={showMobileMenu}>
        <MobileNavLink 
          to="/" 
          className={isActiveRoute('/') ? 'active' : ''}
          onClick={() => setShowMobileMenu(false)}
        >
          Свайп
        </MobileNavLink>
        
        <MobileNavLink 
          to="/chat" 
          className={location.pathname.startsWith('/chat') ? 'active' : ''}
          onClick={() => setShowMobileMenu(false)}
        >
          Чат
        </MobileNavLink>
        
        <MobileNavLink 
          to="/ads" 
          className={isActiveRoute('/ads') ? 'active' : ''}
          onClick={() => setShowMobileMenu(false)}
        >
          Объявления
        </MobileNavLink>
        
        {currentUser.is_admin && (
          <MobileNavLink 
            to="/admin" 
            className={location.pathname.startsWith('/admin') ? 'active' : ''}
            onClick={() => setShowMobileMenu(false)}
          >
            Админ
          </MobileNavLink>
        )}
        
        <MobileNavLink 
          to="/profile" 
          onClick={() => setShowMobileMenu(false)}
        >
          Профиль
        </MobileNavLink>
        
        <DropdownItem className="danger" onClick={handleLogout}>
          Выйти
        </DropdownItem>
      </MobileMenu>
    </NavContainer>
  );
};

export default Navigation;