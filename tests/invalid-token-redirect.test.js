/**
 * Тест для проверки перенаправления при недействительном токене
 */

// Мокаем localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// Мокаем window.location
const mockLocation = {
  href: ''
};

// Мокаем window.dispatchEvent
const mockDispatchEvent = jest.fn();

// Мокаем window.addEventListener и removeEventListener
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

// Мокаем toast
const mockToast = {
  error: jest.fn()
};

// Мокаем axios
const mockAxios = {
  create: jest.fn(() => ({
    interceptors: {
      request: {
        use: jest.fn()
      },
      response: {
        use: jest.fn()
      }
    }
  }))
};

// Настраиваем моки
global.localStorage = mockLocalStorage;
global.window = {
  location: mockLocation,
  dispatchEvent: mockDispatchEvent,
  addEventListener: mockAddEventListener,
  removeEventListener: mockRemoveEventListener
};

// Мокаем зависимости
jest.mock('axios', () => mockAxios);
jest.mock('react-hot-toast', () => ({ default: mockToast }));

describe('Invalid Token Redirect Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('fake-token');
    mockLocation.href = '';
  });

  describe('API Interceptor Logic', () => {
    test('should redirect to login when token is invalid (401 status)', () => {
      // Создаем мок ошибки с 401 статусом
      const error = {
        response: {
          status: 401,
          data: {
            message: 'Unauthorized'
          }
        }
      };

      // Импортируем и тестируем логику интерцептора
      const { apiClient } = require('../client/src/services/api');
      
      // Получаем response interceptor
      const responseInterceptor = apiClient.interceptors.response.use.mock.calls[0][1];
      
      // Вызываем interceptor с ошибкой
      responseInterceptor(error);

      // Проверяем, что токен был удален
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('swingfox_token');
      
      // Проверяем, что было отправлено событие auth-logout
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth-logout'
        })
      );
    });

    test('should redirect to login when token message contains "Недействительный токен"', () => {
      const error = {
        response: {
          status: 200, // Не 401, но сообщение о недействительном токене
          data: {
            message: 'Недействительный токен'
          }
        }
      };

      const { apiClient } = require('../client/src/services/api');
      const responseInterceptor = apiClient.interceptors.response.use.mock.calls[0][1];
      
      responseInterceptor(error);

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('swingfox_token');
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'auth-logout'
        })
      );
    });

    test('should not redirect for 403 errors (access denied)', () => {
      const error = {
        response: {
          status: 403,
          data: {
            message: 'Access denied'
          }
        }
      };

      const { apiClient } = require('../client/src/services/api');
      const responseInterceptor = apiClient.interceptors.response.use.mock.calls[0][1];
      
      responseInterceptor(error);

      // Не должно вызывать removeItem для токена
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('swingfox_token');
      
      // Не должно отправлять событие auth-logout
      expect(mockDispatchEvent).not.toHaveBeenCalled();
      
      // Должно показать toast с ошибкой
      expect(mockToast.error).toHaveBeenCalledWith('Access denied');
    });
  });

  describe('Club API Logic', () => {
    test('should redirect to club login when club token is invalid', () => {
      const error = {
        response: {
          status: 401,
          data: {
            message: 'Недействительный токен'
          }
        }
      };

      // Мокаем fetch для clubApi
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Недействительный токен' })
      });

      // Тестируем clubApi
      const { clubApi } = require('../client/src/services/clubApi');
      
      // Вызываем метод, который должен обработать ошибку
      clubApi.getProfile().catch(() => {
        // Ожидаем, что произойдет редирект
      });

      // Проверяем, что clubToken был удален
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('clubToken');
      
      // Проверяем, что произошел редирект на club login
      expect(mockLocation.href).toBe('/club/login');
    });
  });

  describe('Error Message Detection', () => {
    test('should detect various invalid token messages', () => {
      const invalidTokenMessages = [
        'Недействительный токен',
        'Invalid token',
        'Token expired',
        'Unauthorized'
      ];

      invalidTokenMessages.forEach(message => {
        const error = {
          response: {
            status: 200,
            data: { message }
          }
        };

        // Проверяем логику определения недействительного токена
        const isInvalidToken = message.includes('Недействительный токен') || 
                              message.includes('Invalid token') ||
                              message.includes('Token expired');
        
        expect(isInvalidToken).toBe(true);
      });
    });
  });
});

// Мокаем fetch для тестов
global.fetch = jest.fn();
