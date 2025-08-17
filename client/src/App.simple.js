import React from 'react';

function App() {
  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#dc3522' }}>SwingFox - Тест</h1>
      <p>Если вы видите эту страницу, React работает корректно!</p>
      
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        margin: '20px 0'
      }}>
        <h2>Простая форма авторизации</h2>
        <form>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Логин:</label>
            <input 
              type="text" 
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Пароль:</label>
            <input 
              type="password"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
          <button 
            type="submit"
            style={{
              backgroundColor: '#dc3522',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Войти
          </button>
        </form>
      </div>
      
      <div style={{
        backgroundColor: '#e8f5e8',
        padding: '15px',
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h3>Статус:</h3>
        <ul>
          <li>✅ React загружен</li>
          <li>✅ Webpack работает</li>
          <li>✅ Стили применяются</li>
          <li>🔄 Готов к подключению к API</li>
        </ul>
      </div>
    </div>
  );
}

export default App;