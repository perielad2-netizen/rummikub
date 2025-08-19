const { useState, useEffect, useContext, createContext, useRef } = React;

// Language and Translation Context
const LanguageContext = createContext();

const translations = {
  // Main navigation
  'app.title': {
    he: 'רמיקוב - משחק הקלפים',
    en: 'Rummikub Game'
  },
  'nav.home': {
    he: 'בית',
    en: 'Home'
  },
  'nav.game': {
    he: 'משחק',
    en: 'Game'
  },
  'nav.profile': {
    he: 'פרופיל',
    en: 'Profile'
  },
  'nav.admin': {
    he: 'ניהול',
    en: 'Admin'
  },
  'nav.logout': {
    he: 'התנתקות',
    en: 'Logout'
  },
  
  // Authentication
  'auth.login': {
    he: 'התחברות',
    en: 'Login'
  },
  'auth.register': {
    he: 'הרשמה',
    en: 'Register'
  },
  'auth.username': {
    he: 'שם משתמש',
    en: 'Username'
  },
  'auth.password': {
    he: 'סיסמה',
    en: 'Password'
  },
  'auth.phone': {
    he: 'מספר טלפון',
    en: 'Phone Number'
  },
  'auth.points': {
    he: 'נקודות מבוקשות',
    en: 'Requested Points'
  },
  'auth.play_game': {
    he: 'שחק עכשיו',
    en: 'Play Game'
  },
  
  // Game types
  'game.rummy31': {
    he: 'רמי 31',
    en: 'Rummy 31'
  },
  'game.rummyannette': {
    he: 'רמי אנט',
    en: 'Rummy Annette'
  },
  'game.rummy51': {
    he: 'רמי 51',
    en: 'Rummy 51'
  },
  'game.coming_soon': {
    he: 'בקרוב',
    en: 'Coming Soon'
  },
  
  // Room actions
  'room.create_private': {
    he: 'צור חדר פרטי',
    en: 'Create Private Room'
  },
  'room.join_private': {
    he: 'הצטרף לחדר פרטי',
    en: 'Join Private Room'
  },
  'room.join_public': {
    he: 'הצטרף לחדר ציבורי',
    en: 'Join Public Room'
  },
  'room.settings': {
    he: 'הגדרות',
    en: 'Settings'
  },
  
  // Game UI
  'game.your_turn': {
    he: 'התור שלך',
    en: 'Your Turn'
  },
  'game.waiting': {
    he: 'ממתין לשחקנים',
    en: 'Waiting for Players'
  },
  'game.points': {
    he: 'נקודות',
    en: 'Points'
  },
  'game.back': {
    he: 'חזור',
    en: 'Back'
  },
  
  // Common buttons
  'btn.submit': {
    he: 'אישור',
    en: 'Submit'
  },
  'btn.cancel': {
    he: 'ביטול',
    en: 'Cancel'
  },
  'btn.close': {
    he: 'סגור',
    en: 'Close'
  },
  'btn.create': {
    he: 'צור',
    en: 'Create'
  },
  'btn.join': {
    he: 'הצטרף',
    en: 'Join'
  }
};

// Language Provider Component
function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('he');
  
  const t = (key) => {
    return translations[key]?.[language] || key;
  };
  
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'he' ? 'en' : 'he');
    document.documentElement.lang = language === 'he' ? 'en' : 'he';
    document.documentElement.dir = language === 'he' ? 'ltr' : 'rtl';
  };
  
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
  }, [language]);
  
  return React.createElement(LanguageContext.Provider, {
    value: { language, setLanguage, t, toggleLanguage }
  }, children);
}

// API utilities
const API_BASE = '/api';

class APIClient {
  static async request(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };
    
    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    
    return data;
  }
  
  static async auth(endpoint, data) {
    return this.request(`/auth${endpoint}`, {
      method: 'POST',
      body: data
    });
  }
  
  static async game(endpoint, data = null, method = 'GET') {
    return this.request(`/game${endpoint}`, {
      method,
      ...(data && { body: data })
    });
  }
  
  static async admin(endpoint, data = null, method = 'GET') {
    return this.request(`/admin${endpoint}`, {
      method,
      ...(data && { body: data })
    });
  }
}

// WebSocket Manager
class WSManager {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.messageHandlers = new Map();
  }
  
  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };
    
    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const handler = this.messageHandlers.get(message.type);
        if (handler) {
          handler(message.data);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.reconnect();
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }
  
  reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }
  
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
  
  on(messageType, handler) {
    this.messageHandlers.set(messageType, handler);
  }
  
  off(messageType) {
    this.messageHandlers.delete(messageType);
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Auth Context
const AuthContext = createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    checkAuthStatus();
  }, []);
  
  const checkAuthStatus = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      const response = await APIClient.auth('/verify');
      if (response.success) {
        const profileResponse = await APIClient.auth('/profile');
        if (profileResponse.success) {
          setUser(profileResponse.data);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('authToken');
    } finally {
      setLoading(false);
    }
  };
  
  const login = async (username, password) => {
    const response = await APIClient.auth('/login', { username, password });
    if (response.success) {
      localStorage.setItem('authToken', response.data.token);
      setUser(response.data.user);
      return true;
    }
    return false;
  };
  
  const register = async (username, phone, password, points) => {
    const response = await APIClient.auth('/register', {
      username, phone, password, points
    });
    return response.success;
  };
  
  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };
  
  return React.createElement(AuthContext.Provider, {
    value: { user, loading, login, register, logout, checkAuthStatus }
  }, children);
}

// Main App Component
function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [gameType, setGameType] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const wsManager = useRef(new WSManager());
  
  const { user, loading } = useContext(AuthContext);
  const { language, toggleLanguage } = useContext(LanguageContext);
  
  useEffect(() => {
    if (user) {
      wsManager.current.connect();
    }
    
    return () => {
      wsManager.current.disconnect();
    };
  }, [user]);
  
  if (loading) {
    return React.createElement('div', {
      className: 'flex items-center justify-center h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900'
    }, 
      React.createElement('div', {
        className: 'animate-spin rounded-full h-32 w-32 border-b-2 border-white'
      })
    );
  }
  
  const renderScreen = () => {
    if (!user) {
      return React.createElement(AuthScreen, {
        onLogin: () => setCurrentScreen('gameSelection'),
        onRegister: () => setCurrentScreen('gameSelection')
      });
    }
    
    switch (currentScreen) {
      case 'gameSelection':
        return React.createElement(GameSelectionScreen, {
          onSelectGame: (type) => {
            setGameType(type);
            setCurrentScreen('roomSelection');
          }
        });
      
      case 'roomSelection':
        return React.createElement(RoomSelectionScreen, {
          gameType,
          onBack: () => setCurrentScreen('gameSelection'),
          onJoinRoom: (roomData) => {
            setRoomData(roomData);
            setCurrentScreen('waitingRoom');
          }
        });
      
      case 'waitingRoom':
        return React.createElement(WaitingRoomScreen, {
          roomData,
          onBack: () => setCurrentScreen('roomSelection'),
          onGameStart: () => setCurrentScreen('gameBoard')
        });
      
      case 'gameBoard':
        return React.createElement(GameBoardScreen, {
          roomData,
          gameType,
          wsManager: wsManager.current,
          onGameEnd: () => setCurrentScreen('gameSelection')
        });
      
      case 'admin':
        return React.createElement(AdminPanel, {
          onBack: () => setCurrentScreen('gameSelection')
        });
      
      default:
        return React.createElement(GameSelectionScreen, {
          onSelectGame: (type) => {
            setGameType(type);
            setCurrentScreen('roomSelection');
          }
        });
    }
  };
  
  return React.createElement('div', {
    className: 'h-screen overflow-hidden bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900'
  },
    // Language toggle button
    React.createElement('button', {
      onClick: toggleLanguage,
      className: 'fixed top-4 left-4 z-50 bg-white bg-opacity-20 backdrop-blur-sm text-white px-3 py-2 rounded-lg hover:bg-opacity-30 transition-all'
    }, language === 'he' ? 'English' : 'עברית'),
    
    // Main content
    renderScreen()
  );
}

// Authentication Screen Component - Mobile First Landscape
function AuthScreen({ onLogin, onRegister }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    phone: '',
    points: 400
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, register } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isLogin) {
        const success = await login(formData.username, formData.password);
        if (success) {
          onLogin();
        } else {
          setError('שם משתמש או סיסמה לא נכונים');
        }
      } else {
        const success = await register(
          formData.username,
          formData.phone,
          formData.password,
          formData.points
        );
        if (success) {
          setError('');
          alert('ההרשמה בוצעה בהצלחה! ממתין לאישור מנהל');
          setIsLogin(true);
        }
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return React.createElement('div', {
    className: 'h-screen overflow-hidden flex items-center justify-center p-2 sm:p-4'
  },
    React.createElement('div', {
      className: 'bg-white bg-opacity-10 backdrop-blur-lg rounded-xl w-full max-w-6xl h-full max-h-[600px] flex flex-col sm:flex-row shadow-2xl overflow-hidden'
    },
      // Left side - Branding (hidden on very small screens)
      React.createElement('div', {
        className: 'hidden sm:flex sm:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-6 flex-col justify-center items-center text-white'
      },
        React.createElement('div', { className: 'text-center' },
          React.createElement('div', { className: 'text-6xl mb-4' }, '🎲'),
          React.createElement('h1', {
            className: 'text-3xl md:text-4xl font-bold mb-4'
          }, t('app.title')),
          React.createElement('p', {
            className: 'text-blue-100 text-lg opacity-90'
          }, 'משחק הקלפים המותאם לנייד'),
          React.createElement('div', { className: 'mt-8 grid grid-cols-2 gap-4 text-sm' },
            React.createElement('div', { className: 'bg-white bg-opacity-20 rounded-lg p-3' },
              React.createElement('div', { className: 'font-semibold' }, 'מולטיפלייר'),
              React.createElement('div', { className: 'opacity-75' }, 'בזמן אמת')
            ),
            React.createElement('div', { className: 'bg-white bg-opacity-20 rounded-lg p-3' },
              React.createElement('div', { className: 'font-semibold' }, 'בוטים חכמים'),
              React.createElement('div', { className: 'opacity-75' }, '800+ שמות')
            ),
            React.createElement('div', { className: 'bg-white bg-opacity-20 rounded-lg p-3' },
              React.createElement('div', { className: 'font-semibold' }, 'נייד'),
              React.createElement('div', { className: 'opacity-75' }, 'אופטימיזציה מלאה')
            ),
            React.createElement('div', { className: 'bg-white bg-opacity-20 rounded-lg p-3' },
              React.createElement('div', { className: 'font-semibold' }, 'עברית'),
              React.createElement('div', { className: 'opacity-75' }, 'תמיכה מלאה')
            )
          )
        )
      ),
      
      // Right side - Form (full width on mobile)
      React.createElement('div', {
        className: 'flex-1 flex flex-col justify-center p-4 sm:p-6 lg:p-8'
      },
        // Mobile header (visible only on small screens)
        React.createElement('div', { className: 'sm:hidden text-center mb-4' },
          React.createElement('h1', {
            className: 'text-2xl font-bold text-white mb-1'
          }, t('app.title')),
          React.createElement('p', {
            className: 'text-blue-200 text-sm'
          }, isLogin ? t('auth.login') : t('auth.register'))
        ),
        
        // Desktop header
        React.createElement('div', { className: 'hidden sm:block text-center mb-6' },
          React.createElement('h2', {
            className: 'text-2xl md:text-3xl font-bold text-white mb-2'
          }, isLogin ? t('auth.login') : t('auth.register')),
          React.createElement('p', {
            className: 'text-blue-200'
          }, isLogin ? 'ברוכים השבים!' : 'הצטרפו למשחק')
        ),
        
        // Form
        React.createElement('form', { 
          onSubmit: handleSubmit,
          className: 'space-y-3 sm:space-y-4 flex-1 flex flex-col justify-center'
        },
          // Input fields container
          React.createElement('div', { 
            className: isLogin ? 'space-y-3 sm:space-y-4' : 'grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'
          },
            // Username
            React.createElement('div', null,
              React.createElement('input', {
                type: 'text',
                placeholder: t('auth.username'),
                value: formData.username,
                onChange: (e) => setFormData(prev => ({ ...prev, username: e.target.value })),
                className: 'w-full px-3 py-2 sm:px-4 sm:py-3 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base',
                required: true
              })
            ),
            
            // Password
            React.createElement('div', null,
              React.createElement('input', {
                type: 'password',
                placeholder: t('auth.password'),
                value: formData.password,
                onChange: (e) => setFormData(prev => ({ ...prev, password: e.target.value })),
                className: 'w-full px-3 py-2 sm:px-4 sm:py-3 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base',
                required: true,
                minLength: 4
              })
            ),
            
            // Phone (registration only)
            !isLogin && React.createElement('div', null,
              React.createElement('input', {
                type: 'tel',
                placeholder: t('auth.phone'),
                value: formData.phone,
                onChange: (e) => setFormData(prev => ({ ...prev, phone: e.target.value })),
                className: 'w-full px-3 py-2 sm:px-4 sm:py-3 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base',
                required: true
              })
            ),
            
            // Points (registration only)
            !isLogin && React.createElement('div', null,
              React.createElement('input', {
                type: 'number',
                placeholder: t('auth.points'),
                value: formData.points,
                onChange: (e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) })),
                className: 'w-full px-3 py-2 sm:px-4 sm:py-3 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base',
                min: 100,
                max: 1000,
                required: true
              })
            )
          ),
          
          // Error message
          error && React.createElement('div', {
            className: 'p-2 sm:p-3 bg-red-500 bg-opacity-20 border border-red-400 rounded-lg text-red-200 text-xs sm:text-sm'
          }, error),
          
          // Action buttons
          React.createElement('div', { className: 'flex flex-col sm:flex-row gap-2 sm:gap-4' },
            // Submit button
            React.createElement('button', {
              type: 'submit',
              disabled: loading,
              className: 'flex-1 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base'
            }, loading ? 'מעבד...' : (isLogin ? t('auth.login') : t('auth.register'))),
            
            // Toggle button
            React.createElement('button', {
              type: 'button',
              onClick: () => {
                setIsLogin(!isLogin);
                setError('');
              },
              className: 'py-2 sm:py-3 px-4 bg-white bg-opacity-10 text-blue-200 hover:text-white hover:bg-opacity-20 rounded-lg transition-all text-sm sm:text-base'
            }, isLogin ? 'הרשמה' : 'התחברות')
          )
        )
      )
    )
  );
}

// Continue with other components...
// Game Selection Screen Component
function GameSelectionScreen({ onSelectGame }) {
  const { user, logout } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  
  const gameTypes = [
    {
      id: 'rummy31',
      name: t('game.rummy31'),
      icon: '🎯',
      enabled: true,
      description: 'המשחק הקלאסי - מטרה של 31 נקודות'
    },
    {
      id: 'rummyannette',
      name: t('game.rummyannette'),
      icon: '🎲',
      enabled: true,
      description: 'משחק מהיר - 15 קלפים ורצף אחד'
    },
    {
      id: 'rummy51',
      name: t('game.rummy51'),
      icon: '🃏',
      enabled: false,
      description: 'בקרוב - גרסה מתקדמת'
    }
  ];
  
  return React.createElement('div', {
    className: 'h-screen overflow-hidden flex flex-col'
  },
    // Header - Compact mobile design
    React.createElement('div', {
      className: 'flex-shrink-0 flex justify-between items-center p-3 sm:p-4 bg-white bg-opacity-10 backdrop-blur-lg border-b border-white border-opacity-20'
    },
      React.createElement('div', { className: 'text-white' },
        React.createElement('h2', { className: 'text-lg sm:text-xl font-bold' }, `שלום, ${user.username}`),
        React.createElement('p', { className: 'text-blue-200 text-sm' }, `נקודות: ${user.points}`)
      ),
      React.createElement('button', {
        onClick: logout,
        className: 'px-3 py-1 sm:px-4 sm:py-2 bg-red-500 bg-opacity-20 border border-red-400 text-red-200 rounded-lg hover:bg-opacity-30 transition-all text-sm'
      }, t('nav.logout'))
    ),
    
    // Main content area - Flexible layout for mobile landscape
    React.createElement('div', { 
      className: 'flex-1 flex flex-col justify-center p-4 overflow-hidden'
    },
      // Title
      React.createElement('div', { className: 'text-center mb-4 sm:mb-6' },
        React.createElement('h1', {
          className: 'text-2xl sm:text-3xl md:text-4xl font-bold text-white'
        }, 'בחר סוג משחק')
      ),
      
      // Game selection - Optimized for mobile landscape
      React.createElement('div', { 
        className: 'flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full'
      },
        React.createElement('div', { 
          className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4'
        },
          gameTypes.map(game => 
            React.createElement('button', {
              key: game.id,
              onClick: () => game.enabled && onSelectGame(game.id),
              disabled: !game.enabled,
              className: `p-4 sm:p-6 bg-white bg-opacity-10 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-xl hover:bg-opacity-20 transition-all transform hover:scale-105 ${game.enabled ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`
            },
              React.createElement('div', { className: 'flex flex-col sm:flex-row items-center text-center sm:text-right' },
                // Icon
                React.createElement('div', {
                  className: 'text-3xl sm:text-4xl mb-2 sm:mb-0 sm:ml-4'
                }, game.icon),
                
                // Content
                React.createElement('div', { className: 'flex-1' },
                  React.createElement('h3', {
                    className: 'text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2'
                  }, game.name),
                  React.createElement('p', {
                    className: 'text-blue-200 text-xs sm:text-sm leading-tight'
                  }, game.description),
                  !game.enabled && React.createElement('span', {
                    className: 'inline-block mt-2 px-2 py-1 bg-yellow-500 bg-opacity-20 border border-yellow-400 text-yellow-200 rounded-full text-xs'
                  }, t('game.coming_soon'))
                )
              )
            )
          )
        )
      ),
      
      // Footer info (compact)
      React.createElement('div', { 
        className: 'text-center mt-4 text-white text-opacity-60 text-xs sm:text-sm'
      },
        React.createElement('p', null, 'בחר משחק והתחל לשחק נגד שחקנים אמיתיים ובוטים חכמים')
      )
    )
  );
}

// Initialize and render the app
function initApp() {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  
  root.render(
    React.createElement(LanguageProvider, null,
      React.createElement(AuthProvider, null,
        React.createElement(App)
      )
    )
  );
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}