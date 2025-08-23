import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';

// Компоненты
import AuthGuard from './components/AuthGuard';
import Navigation from './components/Navigation';
import { NotificationProvider } from './contexts/NotificationContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import Ads from './pages/Ads';
import Admin from './pages/Admin';
import Notifications from './pages/Notifications';
import Gifts from './pages/Gifts';
import Clubs from './pages/Clubs';
import Subscriptions from './pages/Subscriptions';
import Ratings from './pages/Ratings';

// Стили и тема
const theme = {
  colors: {
    primary: '#dc3522',
    secondary: '#39354e',
    background: '#fbfbfb',
    surface: '#ffffff',
    text: '#39354e',
    textLight: '#666',
    border: '#e0e0e0',
    success: '#4caf50',
    error: '#f44336',
    warning: '#ff9800'
  },
  fonts: {
    primary: 'Arial, sans-serif',
    sizes: {
      small: '12px',
      medium: '14px',
      large: '16px',
      xlarge: '18px',
      xxlarge: '24px'
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  borderRadius: '8px',
  shadow: '0 2px 8px rgba(0,0,0,0.1)'
};

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ${props => props.theme.fonts.primary};
    background-color: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text};
    font-size: ${props => props.theme.fonts.sizes.large};
    line-height: 1.5;
  }

  a {
    color: ${props => props.theme.colors.primary};
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }

  button {
    cursor: pointer;
    border: none;
    background: none;
    font-family: inherit;
  }

  input, textarea, select {
    font-family: inherit;
    font-size: inherit;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 ${props => props.theme.spacing.md};
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
    border-radius: ${props => props.theme.borderRadius};
    font-weight: 500;
    transition: all 0.2s ease;
    text-decoration: none;
    border: none;
    cursor: pointer;
    
    &.btn-primary {
      background-color: ${props => props.theme.colors.primary};
      color: white;
      
      &:hover {
        background-color: #b8291e;
        text-decoration: none;
      }
    }
    
    &.btn-secondary {
      background-color: transparent;
      color: ${props => props.theme.colors.secondary};
      border: 1px solid ${props => props.theme.colors.border};
      
      &:hover {
        background-color: ${props => props.theme.colors.border};
        text-decoration: none;
      }
    }
  }

  .form-group {
    margin-bottom: ${props => props.theme.spacing.md};
    
    label {
      display: block;
      margin-bottom: ${props => props.theme.spacing.xs};
      font-weight: 500;
      color: ${props => props.theme.colors.secondary};
    }
    
    input, textarea, select {
      width: 100%;
      padding: ${props => props.theme.spacing.sm};
      border: 1px solid ${props => props.theme.colors.border};
      border-radius: ${props => props.theme.borderRadius};
      background-color: white;
      
      &:focus {
        outline: none;
        border-color: ${props => props.theme.colors.primary};
        box-shadow: 0 0 0 2px rgba(220, 53, 34, 0.1);
      }
      
      &::placeholder {
        color: ${props => props.theme.colors.textLight};
      }
    }
    
    textarea {
      min-height: 100px;
      resize: vertical;
    }
  }

  .card {
    background: white;
    border-radius: ${props => props.theme.borderRadius};
    box-shadow: ${props => props.theme.shadow};
    padding: ${props => props.theme.spacing.md};
    margin-bottom: ${props => props.theme.spacing.md};
  }

  .text-center {
    text-align: center;
  }

  .text-error {
    color: ${props => props.theme.colors.error};
    font-size: ${props => props.theme.fonts.sizes.small};
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: ${props => props.theme.spacing.xl};
    
    &::after {
      content: '';
      width: 20px;
      height: 20px;
      border: 2px solid ${props => props.theme.colors.border};
      border-top: 2px solid ${props => props.theme.colors.primary};
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .container {
      padding: 0 ${props => props.theme.spacing.sm};
    }
  }
`;

const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

// React Query клиент
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <AppContainer>
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <NotificationProvider>
              <Routes>
              {/* Публичные роуты */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Защищенные роуты */}
              <Route path="/" element={
                <AuthGuard>
                  <Navigation />
                  <Home />
                </AuthGuard>
              } />
              
              <Route path="/catalog" element={
                <AuthGuard>
                  <Navigation />
                  <Catalog />
                </AuthGuard>
              } />
              
              <Route path="/profile" element={
                <AuthGuard>
                  <Navigation />
                  <Profile />
                </AuthGuard>
              } />
              
              <Route path="/profile/:login" element={
                <AuthGuard>
                  <Navigation />
                  <Profile />
                </AuthGuard>
              } />
              
              <Route path="/chat/:username?" element={
                <AuthGuard>
                  <Navigation />
                  <Chat />
                </AuthGuard>
              } />
              
              <Route path="/notifications" element={
                <AuthGuard>
                  <Navigation />
                  <Notifications />
                </AuthGuard>
              } />
              
              <Route path="/gifts" element={
                <AuthGuard>
                  <Navigation />
                  <Gifts />
                </AuthGuard>
              } />
              
              <Route path="/clubs" element={
                <AuthGuard>
                  <Navigation />
                  <Clubs />
                </AuthGuard>
              } />
              
              <Route path="/subscriptions" element={
                <AuthGuard>
                  <Navigation />
                  <Subscriptions />
                </AuthGuard>
              } />
              
              <Route path="/ratings" element={
                <AuthGuard>
                  <Navigation />
                  <Ratings />
                </AuthGuard>
              } />
              
              <Route path="/ads" element={
                <AuthGuard>
                  <Navigation />
                  <Ads />
                </AuthGuard>
              } />
              
              <Route path="/admin/*" element={
                <AuthGuard>
                  <Admin />
                </AuthGuard>
              } />
              
              {/* Редирект на главную */}
              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </NotificationProvider>
          </Router>
        </AppContainer>
        
        {/* Уведомления */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: theme.colors.surface,
              color: theme.colors.text,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius,
            },
            success: {
              iconTheme: {
                primary: theme.colors.success,
                secondary: 'white',
              },
            },
            error: {
              iconTheme: {
                primary: theme.colors.error,
                secondary: 'white',
              },
            },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;