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
  'nav.hello': {
    he: 'שלום',
    en: 'Hello'
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
  'auth.install_app': {
    he: 'התקן אפליקציה',
    en: 'Install App'
  },
  'auth.error_login': {
    he: 'שם משתמש או סיסמה לא נכונים',
    en: 'Username or password incorrect'
  },
  'auth.success_register': {
    he: 'ההרשמה בוצעה בהצלחה! ממתין לאישור מנהל',
    en: 'Registration successful! Waiting for admin approval'
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
  
  // Game selection screen
  'game.choose_type': {
    he: 'בחר סוג משחק',
    en: 'Choose Game Type'
  },
  'game.rummy31_desc': {
    he: 'המשחק הקלאסי - מטרה של 31 נקודות',
    en: 'Classic game - Target of 31 points'
  },
  'game.rummyannette_desc': {
    he: 'משחק מהיר - 15 קלפים ורצף אחד',
    en: 'Fast game - 15 cards and one sequence'
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
  'room.quick_game': {
    he: 'משחק מהיר',
    en: 'Quick Game'
  },
  'room.public_rooms_list': {
    he: 'רשימת חדרים ציבוריים',
    en: 'Public Rooms List'
  },
  'room.no_public_rooms': {
    he: 'אין חדרים ציבוריים זמינים כרגע',
    en: 'No public rooms available right now'
  },
  'room.no_public_rooms_alert': {
    he: 'אין חדרים ציבוריים זמינים',
    en: 'No public rooms available'
  },
  'room.room_name': {
    he: 'שם החדר',
    en: 'Room Name'
  },
  'room.room_name_placeholder': {
    he: 'הכנס שם לחדר (אופציונלי)',
    en: 'Enter room name (optional)'
  },
  'room.entry_points': {
    he: 'נקודות כניסה',
    en: 'Entry Points'
  },
  'room.max_players': {
    he: 'מספר שחקנים',
    en: 'Max Players'
  },
  'room.private_room': {
    he: 'חדר פרטי',
    en: 'Private Room'
  },
  'room.creating': {
    he: 'יוצר...',
    en: 'Creating...'
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
  'btn.create': {
    he: 'צור',
    en: 'Create'
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
    setLanguage(prev => {
      const newLang = prev === 'he' ? 'en' : 'he';
      // Update DOM with the new language immediately
      document.documentElement.lang = newLang;
      document.documentElement.dir = newLang === 'he' ? 'rtl' : 'ltr';
      return newLang;
    });
  };
  
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
  }, [language]);
  
  return React.createElement(LanguageContext.Provider, {
    value: { language, setLanguage, t, toggleLanguage }
  }, children);
}

// Universal Controls Component - Language and Fullscreen toggles for all screens
function UniversalControls({ className = '' }) {
  const { language, toggleLanguage, t } = useContext(LanguageContext);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.log('Fullscreen not supported or failed:', error);
    }
  };
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  
  return React.createElement('div', {
    className: `flex items-center gap-2 ${className}`
  },
    // Language Toggle
    React.createElement('button', {
      onClick: toggleLanguage,
      className: 'px-2 py-1 bg-white bg-opacity-20 backdrop-blur-sm rounded-md border border-white border-opacity-30 text-white text-xs font-medium hover:bg-opacity-30 transition-all',
      title: language === 'he' ? 'Switch to English' : 'עבור לעברית'
    }, language === 'he' ? 'EN' : 'עב'),
    
    // Fullscreen Toggle
    React.createElement('button', {
      onClick: toggleFullscreen,
      className: 'px-2 py-1 bg-white bg-opacity-20 backdrop-blur-sm rounded-md border border-white border-opacity-30 text-white text-xs hover:bg-opacity-30 transition-all',
      title: isFullscreen ? (language === 'he' ? 'צא ממסך מלא' : 'Exit Fullscreen') : (language === 'he' ? 'מסך מלא' : 'Fullscreen')
    }, isFullscreen ? '🗗' : '🗖')
  );
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
        const profileResponse = await APIClient.request('/auth/profile');
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
  const { language } = useContext(LanguageContext);
  
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
  const { t, language } = useContext(LanguageContext);
  
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
          setError(t('auth.error_login'));
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
          alert(t('auth.success_register'));
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
    className: 'min-h-screen flex items-center justify-center p-4 landscape:p-6 relative'
  },
    // Universal Controls at bottom-left - consistent position
    React.createElement(UniversalControls, {
      className: 'fixed bottom-2 left-2 z-50'
    }),
    
    React.createElement('div', {
      className: 'bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl w-full max-w-md landscape:max-w-4xl landscape:h-3/5 p-6 landscape:p-8 shadow-2xl landscape:flex landscape:items-stretch landscape:gap-8'
    },
      // PWA Install Button (positioned based on language direction)
      React.createElement('div', { 
        className: `absolute top-4 ${language === 'he' ? 'right-4' : 'left-4'}` 
      },
        React.createElement('button', {
          onClick: () => setShowInstallModal(true),
          className: 'bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded-lg shadow-md transition-all text-sm'
        },
          t('auth.install_app')
        )
      ),
      
      // Right side - Empty space for RTL balance (NO TEXT)
      React.createElement('div', { 
        className: 'text-center landscape:text-right landscape:flex-shrink-0 landscape:w-32 landscape:flex landscape:flex-col landscape:justify-center mb-6 landscape:mb-0' 
      }),
      
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
              className: 'w-full px-5 py-4 landscape:px-6 landscape:py-4 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg landscape:text-xl',
              required: true
            }),
            
            // Password  
            React.createElement('input', {
              type: 'password',
              placeholder: t('auth.password'),
              value: formData.password,
              onChange: (e) => setFormData(prev => ({ ...prev, password: e.target.value })),
              className: 'w-full px-5 py-4 landscape:px-6 landscape:py-4 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg landscape:text-xl',
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
              className: 'w-full px-5 py-4 landscape:px-6 landscape:py-4 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg landscape:text-xl',
              required: true
            }),
            
            // Points
            React.createElement('input', {
              type: 'number',
              placeholder: t('auth.points'),
              value: formData.points,
              onChange: (e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) })),
              className: 'w-full px-5 py-4 landscape:px-6 landscape:py-4 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg landscape:text-xl',
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
              className: 'flex-1 py-4 landscape:py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg landscape:text-xl'
            }, loading ? (language === 'he' ? 'מעבד...' : 'Processing...') : (isLogin ? t('auth.login') : t('auth.register'))),
            
            // Toggle form type button
            React.createElement('button', {
              type: 'button',
              onClick: () => {
                setIsLogin(!isLogin);
                setError('');
              },
              className: 'flex-1 py-4 landscape:py-4 bg-white bg-opacity-20 text-blue-200 rounded-lg hover:bg-opacity-30 hover:text-white transition-all text-lg landscape:text-xl'
            }, isLogin ? t('auth.register') : t('auth.login'))
          )
        )
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
      name: t('game.rummy31'),
      icon: '🎯',
      enabled: true,
      description: t('game.rummy31_desc')
    },
    {
      id: 'rummyannette',
      name: t('game.rummyannette'),
      icon: '🎲',
      enabled: true,
      description: t('game.rummyannette_desc')
    }
  ];
  
  return React.createElement('div', {
    className: 'h-screen flex flex-col overflow-hidden relative'
  },
    // Universal Controls at bottom-left - consistent position
    React.createElement(UniversalControls, {
      className: 'fixed bottom-2 left-2 z-50'
    }),
    // Compact header optimized for landscape
    React.createElement('div', {
      className: 'flex justify-between items-center px-6 py-3 bg-white bg-opacity-10 backdrop-blur-lg border-b border-white border-opacity-20'
    },
      React.createElement('div', { className: 'text-white flex items-center gap-4' },
        React.createElement('span', { className: 'text-lg font-bold' }, `${t('nav.hello')}, ${user.username}`),
        React.createElement('span', { className: 'text-blue-200 text-sm' }, `${t('game.points')}: ${user.points}`)
      ),
      React.createElement('button', {
        onClick: logout,
        className: 'px-3 py-1.5 bg-red-500 bg-opacity-20 border border-red-400 text-red-200 rounded-lg hover:bg-opacity-30 transition-all text-sm'
      }, t('nav.logout'))
    ),
    
    // Main content area - optimized for landscape
    React.createElement('div', { className: 'flex-1 flex flex-col justify-center items-center px-6 py-4' },
      React.createElement('h1', {
        className: 'text-2xl landscape:text-xl font-bold text-white text-center mb-6 landscape:mb-4'
      }, t('game.choose_type')),
      
      // Horizontal layout for landscape - native app feel with smaller cards
      React.createElement('div', { 
        className: 'w-full max-w-3xl landscape:flex landscape:gap-6 landscape:justify-center portrait:grid portrait:grid-cols-1 portrait:gap-4'
      },
        gameTypes.map(game => 
          React.createElement('button', {
            key: game.id,
            onClick: () => game.enabled && onSelectGame(game.id),
            disabled: !game.enabled,
            className: `
              landscape:flex-1 landscape:max-w-xs landscape:h-24
              portrait:aspect-[3/2] portrait:h-32
              p-4 bg-white bg-opacity-15 backdrop-blur-lg rounded-xl 
              border border-white border-opacity-30 
              hover:bg-opacity-25 active:bg-opacity-30
              transition-all duration-200 transform active:scale-95
              flex landscape:flex-row portrait:flex-col items-center justify-center 
              text-center landscape:text-right gap-3
              shadow-lg hover:shadow-xl
            `
          },
            React.createElement('div', { 
              className: 'text-3xl landscape:text-2xl portrait:text-4xl landscape:flex-shrink-0' 
            }, game.icon),
            React.createElement('div', { className: 'landscape:text-right portrait:text-center flex-1' },
              React.createElement('h3', { 
                className: 'text-lg landscape:text-base font-bold text-white mb-0.5' 
              }, game.name),
              React.createElement('p', { 
                className: 'text-blue-200 text-xs landscape:text-xs leading-tight' 
              }, game.description)
            )
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