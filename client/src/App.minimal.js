import React from 'react';

export default function App() {
  return React.createElement('div', {
    style: {
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }
  }, [
    React.createElement('h1', {
      key: 'title',
      style: { color: '#dc3522' }
    }, 'SwingFox - Минимальная версия'),
    
    React.createElement('p', {
      key: 'description'
    }, 'Эта версия работает без JSX и дополнительных библиотек'),
    
    React.createElement('div', {
      key: 'status',
      style: {
        backgroundColor: '#e8f5e8',
        padding: '15px',
        borderRadius: '8px',
        marginTop: '20px'
      }
    }, [
      React.createElement('h3', { key: 'status-title' }, 'Статус:'),
      React.createElement('p', { key: 'react-status' }, '✅ React работает'),
      React.createElement('p', { key: 'webpack-status' }, '✅ Webpack работает'),
      React.createElement('p', { key: 'app-status' }, '🎉 Приложение загружено!')
    ])
  ]);
}