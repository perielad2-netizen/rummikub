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
      className: 'flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900'
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
    className: 'min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900'
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

// Authentication Screen Component
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
  const [showInstallModal, setShowInstallModal] = useState(false);
  
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
    className: 'min-h-screen flex items-center justify-center p-4 landscape:p-2'
  },
    React.createElement('div', {
      className: 'bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl w-full h-full max-w-none max-h-none landscape:max-w-5xl landscape:max-h-80 landscape:w-auto landscape:h-auto p-8 landscape:p-6 shadow-2xl landscape:flex landscape:items-stretch landscape:gap-8'
    },
      // PWA Install Button (positioned at top-right, smaller)
      React.createElement('div', { className: 'absolute top-4 right-4' },
        React.createElement('button', {
          onClick: () => setShowInstallModal(true),
          className: 'bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded-lg shadow-md transition-all text-sm'
        },
          'התקן אפליקציה'
        )
      ),
      
      // Right side - Header (RTL layout) - REMOVED TITLE
      React.createElement('div', { 
        className: 'text-center landscape:text-right landscape:flex-shrink-0 landscape:w-60 landscape:flex landscape:flex-col landscape:justify-center mb-6 landscape:mb-0' 
      },
        React.createElement('p', {
          className: 'text-blue-200 text-lg landscape:text-xl font-medium'
        }, isLogin ? t('auth.login') : t('auth.register'))
      ),
      
      // Left side - Form (RTL layout)
      React.createElement('div', { 
        className: 'landscape:flex-1 landscape:flex landscape:flex-col landscape:justify-center' 
      },
        React.createElement('form', { 
          onSubmit: handleSubmit,
          className: 'space-y-3 landscape:space-y-2' 
        },
          // Form fields in grid for landscape optimization
          React.createElement('div', { 
            className: 'grid grid-cols-1 landscape:grid-cols-2 gap-2 landscape:gap-3' 
          },
            // Username
            React.createElement('input', {
              type: 'text',
              placeholder: t('auth.username'),
              value: formData.username,
              onChange: (e) => setFormData(prev => ({ ...prev, username: e.target.value })),
              className: 'w-full px-4 py-3 landscape:px-5 landscape:py-3 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base landscape:text-lg',
              required: true
            }),
            
            // Password  
            React.createElement('input', {
              type: 'password',
              placeholder: t('auth.password'),
              value: formData.password,
              onChange: (e) => setFormData(prev => ({ ...prev, password: e.target.value })),
              className: 'w-full px-4 py-3 landscape:px-5 landscape:py-3 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base landscape:text-lg',
              required: true,
              minLength: 4
            })
          ),
          
          // Registration fields (only when not login)
          !isLogin && React.createElement('div', { 
            className: 'grid grid-cols-1 landscape:grid-cols-2 gap-2 landscape:gap-3' 
          },
            // Phone
            React.createElement('input', {
              type: 'tel',
              placeholder: t('auth.phone'),
              value: formData.phone,
              onChange: (e) => setFormData(prev => ({ ...prev, phone: e.target.value })),
              className: 'w-full px-4 py-3 landscape:px-5 landscape:py-3 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base landscape:text-lg',
              required: true
            }),
            
            // Points
            React.createElement('input', {
              type: 'number',
              placeholder: t('auth.points'),
              value: formData.points,
              onChange: (e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) })),
              className: 'w-full px-4 py-3 landscape:px-5 landscape:py-3 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base landscape:text-lg',
              min: 100,
              max: 1000,
              required: true
            })
          ),
          
          // Error message
          error && React.createElement('div', {
            className: 'p-2 bg-red-500 bg-opacity-20 border border-red-400 rounded-lg text-red-200 text-xs landscape:text-sm'
          }, error),
          
          // Buttons row
          React.createElement('div', { 
            className: 'flex gap-2 landscape:gap-3' 
          },
            // Submit button
            React.createElement('button', {
              type: 'submit',
              disabled: loading,
              className: 'flex-1 py-3 landscape:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-base landscape:text-lg'
            }, loading ? 'מעבד...' : (isLogin ? t('auth.login') : t('auth.register'))),
            
            // Toggle form type button
            React.createElement('button', {
              type: 'button',
              onClick: () => {
                setIsLogin(!isLogin);
                setError('');
              },
              className: 'flex-1 py-3 landscape:py-3 bg-white bg-opacity-20 text-blue-200 rounded-lg hover:bg-opacity-30 hover:text-white transition-all text-base landscape:text-lg'
            }, isLogin ? 'הירשם' : 'התחבר')
          )
        )
      )
    ),

    // English and Fullscreen toggles (bottom-left of SCREEN, not form)
    React.createElement('div', { className: 'fixed bottom-4 left-4 flex flex-col gap-2 z-40' },
      // English toggle
      React.createElement('button', {
        className: 'bg-white bg-opacity-20 text-white text-xs px-2 py-1 rounded-md transition-all hover:bg-opacity-30'
      }, 'English'),
      
      // Fullscreen toggle
      React.createElement('button', {
        onClick: () => window.toggleFullscreen && window.toggleFullscreen(),
        className: 'bg-white bg-opacity-20 text-white text-xs px-2 py-1 rounded-md transition-all hover:bg-opacity-30'
      },
        React.createElement('i', { className: 'fas fa-expand' })
      )
    ),

    // Install Modal
    showInstallModal && React.createElement('div', {
      className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50',
      onClick: () => setShowInstallModal(false)
    },
      React.createElement('div', {
        className: 'bg-green-500 rounded-3xl p-8 max-w-md w-full text-white text-center relative',
        onClick: (e) => e.stopPropagation()
      },
        // Download Icon
        React.createElement('div', { className: 'flex justify-center mb-4' },
          React.createElement('div', { className: 'bg-gray-600 rounded-xl p-4 inline-block' },
            React.createElement('i', { 
              className: 'fas fa-download text-white text-3xl'
            })
          )
        ),

        // Title
        React.createElement('h2', {
          className: 'text-2xl font-bold mb-2'
        }, 'התקן אפליקציה'),

        // Description
        React.createElement('p', {
          className: 'text-green-100 mb-6 text-sm'
        }, 'לחוויית משחק מלאה במצב מסך מלא'),

        // Features with checkmarks
        React.createElement('div', { className: 'space-y-2 mb-8 text-right' },
          React.createElement('div', { className: 'flex items-center justify-end gap-2' },
            React.createElement('span', { className: 'text-sm' }, 'הסטרת UI של המערכת'),
            React.createElement('i', { className: 'fas fa-check-circle text-green-200' })
          ),
          React.createElement('div', { className: 'flex items-center justify-end gap-2' },
            React.createElement('span', { className: 'text-sm' }, 'מצב אופקי אוטומטי'),
            React.createElement('i', { className: 'fas fa-check-circle text-green-200' })
          ),
          React.createElement('div', { className: 'flex items-center justify-end gap-2' },
            React.createElement('span', { className: 'text-sm' }, 'עבודה במצב offline'),
            React.createElement('i', { className: 'fas fa-check-circle text-green-200' })
          )
        ),

        // Install Buttons
        React.createElement('div', { className: 'space-y-3' },
          // Primary install button
          React.createElement('button', {
            onClick: () => {
              if (window.deferredPrompt) {
                window.deferredPrompt.prompt();
                window.deferredPrompt.userChoice.then((choiceResult) => {
                  if (choiceResult.outcome === 'accepted') {
                    setShowInstallModal(false);
                  }
                });
              } else {
                // Show manual installation instructions
                alert('להתקנה ידנית:\n\niOS (Safari): גש לתפריט שיתוף > הוסף למסך הבית\nAndroid (Chrome): תפריט דפדפן > הוסף למסך הבית\nDesktop: חפש כפתור התקנה בשורת הכתובת');
                setShowInstallModal(false);
              }
            },
            className: 'w-full bg-white text-green-600 font-bold py-3 px-6 rounded-xl hover:bg-green-50 transition-all'
          }, 'התקן עכשיו'),

          // Cancel button
          React.createElement('button', {
            onClick: () => setShowInstallModal(false),
            className: 'w-full bg-transparent border border-white border-opacity-30 text-white font-medium py-3 px-6 rounded-xl hover:bg-white hover:bg-opacity-10 transition-all'
          }, 'אולי מאוחר יותר')
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
      name: 'רמי 31',
      icon: '🎯',
      enabled: true,
      description: 'המשחק הקלאסי - מטרה של 31 נקודות'
    },
    {
      id: 'rummyannette',
      name: 'רמי אנט',
      icon: '🎲',
      enabled: true,
      description: 'משחק מהיר - 15 קלפים ורצף אחד'
    }
  ];
  
  return React.createElement('div', {
    className: 'min-h-screen p-4'
  },
    // Header
    React.createElement('div', {
      className: 'flex justify-between items-center mb-8 bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-4'
    },
      React.createElement('div', { className: 'text-white' },
        React.createElement('h2', { className: 'text-xl font-bold' }, `שלום, ${user.username}`),
        React.createElement('p', { className: 'text-blue-200' }, `נקודות: ${user.points}`)
      ),
      React.createElement('button', {
        onClick: logout,
        className: 'px-4 py-2 bg-red-500 bg-opacity-20 border border-red-400 text-red-200 rounded-lg hover:bg-opacity-30 transition-all'
      }, t('nav.logout'))
    ),
    
    // Game selection - Mobile-first landscape layout
    React.createElement('div', { className: 'flex-1 flex flex-col items-center justify-center' },
      React.createElement('h1', {
        className: 'text-3xl font-bold text-white text-center mb-6'
      }, 'בחר סוג משחק'),
      
      React.createElement('div', { className: 'grid grid-cols-2 gap-6 w-full max-w-4xl px-4' },
        gameTypes.map(game => 
          React.createElement('button', {
            key: game.id,
            onClick: () => game.enabled && onSelectGame(game.id),
            disabled: !game.enabled,
            className: `aspect-square p-6 bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105 flex flex-col items-center justify-center text-center`
          },
            React.createElement('div', { className: 'text-6xl mb-4' }, game.icon),
            React.createElement('h3', { className: 'text-xl font-bold text-white mb-2' }, game.name),
            React.createElement('p', { className: 'text-blue-200 text-sm' }, game.description)
          )
        )
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