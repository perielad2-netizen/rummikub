// Room Selection Screen Component
function RoomSelectionScreen({ gameType, onBack, onJoinRoom }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showRoomsModal, setShowRoomsModal] = useState(false);
  const [publicRooms, setPublicRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const { t } = useContext(LanguageContext);
  const { user } = useContext(AuthContext);
  
  useEffect(() => {
    loadPublicRooms();
  }, []);
  
  const loadPublicRooms = async () => {
    try {
      setLoading(true);
      const response = await APIClient.game('/rooms/public');
      if (response.success) {
        setPublicRooms(response.data);
      }
    } catch (error) {
      console.error('Failed to load public rooms:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const gameTypeNames = {
    'rummy31': t('game.rummy31'),
    'rummyannette': t('game.rummyannette'),
    'rummy51': t('game.rummy51')
  };
  
  return React.createElement('div', {
    className: 'min-h-screen p-4'
  },
    // Header
    React.createElement('div', {
      className: 'flex items-center justify-between mb-6 bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-4'
    },
      React.createElement('button', {
        onClick: onBack,
        className: 'flex items-center text-white hover:text-blue-200 transition-colors'
      },
        React.createElement('i', { className: 'fas fa-arrow-right mr-2' }),
        t('game.back')
      ),
      React.createElement('h1', {
        className: 'text-2xl font-bold text-white'
      }, gameTypeNames[gameType]),
      React.createElement('div', {
        className: 'text-white text-lg'
      }, `${user.points} ${t('game.points')}`)
    ),
    
    // Room options - Mobile-first 4 buttons layout
    React.createElement('div', { className: 'flex-1 flex flex-col items-center justify-center px-4' },
      React.createElement('div', { className: 'w-full max-w-md space-y-4' },
        // Create Private Room
        React.createElement('button', {
          onClick: () => setShowCreateModal(true),
          className: 'w-full py-4 px-6 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105'
        },
          React.createElement('div', { className: 'flex items-center justify-center text-white' },
            React.createElement('i', { className: 'fas fa-plus-circle text-xl ml-3' }),
            React.createElement('span', { className: 'text-lg font-bold' }, 'צור חדר פרטי')
          )
        ),
        
        // Join Private Room
        React.createElement('button', {
          onClick: () => setShowJoinModal(true),
          className: 'w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105'
        },
          React.createElement('div', { className: 'flex items-center justify-center text-white' },
            React.createElement('i', { className: 'fas fa-key text-xl ml-3' }),
            React.createElement('span', { className: 'text-lg font-bold' }, 'הצטרף לחדר פרטי')
          )
        ),
        
        // Quick Play
        React.createElement('button', {
          onClick: () => handleQuickPlay(),
          className: 'w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-lg hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105'
        },
          React.createElement('div', { className: 'flex items-center justify-center text-white' },
            React.createElement('i', { className: 'fas fa-flash text-xl ml-3' }),
            React.createElement('span', { className: 'text-lg font-bold' }, 'משחק מהיר')
          )
        ),
        
        // Available Rooms
        React.createElement('button', {
          onClick: () => setShowRoomsModal(true),
          className: 'w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 relative'
        },
          React.createElement('div', { className: 'flex items-center justify-center text-white' },
            React.createElement('i', { className: 'fas fa-users text-xl ml-3' }),
            React.createElement('span', { className: 'text-lg font-bold' }, 'רשימת החדרים הציבוריים')
          ),
          publicRooms.length > 0 && React.createElement('div', {
            className: 'absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold'
          }, publicRooms.length)
        )
      )
    ),
    
    // Modals
    showCreateModal && React.createElement(CreateRoomModal, {
      gameType,
      onClose: () => setShowCreateModal(false),
      onSuccess: onJoinRoom
    }),
    
    showJoinModal && React.createElement(JoinRoomModal, {
      onClose: () => setShowJoinModal(false),
      onSuccess: onJoinRoom
    })
  );
  
  const joinPublicRoom = async (roomKey) => {
    try {
      const response = await APIClient.game('/room/join', { roomKey }, 'POST');
      if (response.success) {
        onJoinRoom(response.data);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleQuickPlay = async () => {
    if (publicRooms.length > 0) {
      // Join the first available room
      const availableRoom = publicRooms.find(room => room.current_players < room.max_players);
      if (availableRoom) {
        joinPublicRoom(availableRoom.room_key);
      } else {
        alert('אין חדרים זמינים כרגע');
      }
    } else {
      alert('אין חדרים ציבוריים זמינים');
    }
  };

  return React.createElement('div', {
    className: 'min-h-screen flex flex-col'
  },
    // Header
    React.createElement('div', {
      className: 'flex items-center justify-between p-4 bg-white bg-opacity-10 backdrop-blur-lg'
    },
      React.createElement('button', {
        onClick: onBack,
        className: 'flex items-center text-white hover:text-blue-200 transition-colors'
      },
        React.createElement('i', { className: 'fas fa-arrow-right mr-2' }),
        'חזור'
      ),
      React.createElement('h1', {
        className: 'text-xl font-bold text-white'
      }, gameType === 'rummy31' ? 'רמי 31' : 'רמי אנט'),
      React.createElement('div', {
        className: 'text-white text-sm'
      }, `${user.points} נק'`)
    ),
    
    // Room options - Mobile-first 4 buttons layout
    React.createElement('div', { className: 'flex-1 flex flex-col items-center justify-center px-4' },
      React.createElement('div', { className: 'w-full max-w-md space-y-4' },
        // Create Private Room
        React.createElement('button', {
          onClick: () => setShowCreateModal(true),
          className: 'w-full py-4 px-6 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105'
        },
          React.createElement('div', { className: 'flex items-center justify-center text-white' },
            React.createElement('i', { className: 'fas fa-plus-circle text-xl ml-3' }),
            React.createElement('span', { className: 'text-lg font-bold' }, 'צור חדר פרטי')
          )
        ),
        
        // Join Private Room
        React.createElement('button', {
          onClick: () => setShowJoinModal(true),
          className: 'w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105'
        },
          React.createElement('div', { className: 'flex items-center justify-center text-white' },
            React.createElement('i', { className: 'fas fa-key text-xl ml-3' }),
            React.createElement('span', { className: 'text-lg font-bold' }, 'הצטרף לחדר פרטי')
          )
        ),
        
        // Quick Play
        React.createElement('button', {
          onClick: () => handleQuickPlay(),
          className: 'w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-lg hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105'
        },
          React.createElement('div', { className: 'flex items-center justify-center text-white' },
            React.createElement('i', { className: 'fas fa-bolt text-xl ml-3' }),
            React.createElement('span', { className: 'text-lg font-bold' }, 'משחק מהיר')
          )
        ),
        
        // Available Rooms
        React.createElement('button', {
          onClick: () => setShowRoomsModal(true),
          className: 'w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 relative'
        },
          React.createElement('div', { className: 'flex items-center justify-center text-white' },
            React.createElement('i', { className: 'fas fa-users text-xl ml-3' }),
            React.createElement('span', { className: 'text-lg font-bold' }, 'רשימת החדרים הציבוריים')
          ),
          publicRooms.length > 0 && React.createElement('div', {
            className: 'absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold'
          }, publicRooms.length)
        )
      )
    ),
    
    // English and Fullscreen toggles (bottom-left, small and nice)
    React.createElement('div', { className: 'absolute bottom-4 left-4 flex flex-col gap-2' },
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
    
    // Modals
    showCreateModal && React.createElement(CreateRoomModal, {
      gameType,
      onClose: () => setShowCreateModal(false),
      onSuccess: onJoinRoom
    }),
    
    showJoinModal && React.createElement(JoinRoomModal, {
      onClose: () => setShowJoinModal(false),
      onSuccess: onJoinRoom
    }),
    
    showRoomsModal && React.createElement(AvailableRoomsModal, {
      rooms: publicRooms,
      loading,
      onClose: () => setShowRoomsModal(false),
      onJoinRoom: joinPublicRoom
    })
  );
}

// Create Room Modal Component
function CreateRoomModal({ gameType, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    roomName: '',
    entryPoints: 100,
    maxPlayers: 2,
    isPrivate: false
  });
  const [loading, setLoading] = useState(false);
  
  const { t } = useContext(LanguageContext);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await APIClient.game('/room/create', {
        gameType,
        ...formData
      }, 'POST');
      
      if (response.success) {
        onSuccess(response.data);
        onClose();
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'
  },
    React.createElement('div', {
      className: 'bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 w-full max-w-md'
    },
      React.createElement('h3', {
        className: 'text-xl font-bold text-white mb-4'
      }, t('room.create_private')),
      
      React.createElement('form', { onSubmit: handleSubmit },
        // Room Name
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', {
            className: 'block text-white mb-2'
          }, 'שם החדר'),
          React.createElement('input', {
            type: 'text',
            value: formData.roomName,
            onChange: (e) => setFormData(prev => ({ ...prev, roomName: e.target.value })),
            placeholder: 'הכנס שם לחדר (אופציונלי)',
            className: 'w-full px-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400',
            maxLength: 30
          })
        ),
        
        // Entry Points
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', {
            className: 'block text-white mb-2'
          }, 'נקודות כניסה'),
          React.createElement('input', {
            type: 'number',
            min: 50,
            max: 1000,
            step: 50,
            value: formData.entryPoints,
            onChange: (e) => setFormData(prev => ({ ...prev, entryPoints: parseInt(e.target.value) })),
            className: 'w-full px-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400'
          })
        ),
        
        // Max Players
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', {
            className: 'block text-white mb-2'
          }, 'מספר שחקנים'),
          React.createElement('div', { className: 'flex gap-3' },
            [2, 3, 4].map(num =>
              React.createElement('button', {
                key: num,
                type: 'button',
                onClick: () => setFormData(prev => ({ ...prev, maxPlayers: num })),
                className: `flex-1 px-4 py-2 rounded-lg border transition-colors ${formData.maxPlayers === num ? 'bg-blue-500 border-blue-400 text-white' : 'bg-white bg-opacity-20 border-white border-opacity-30 text-blue-200'}`
              }, num)
            )
          )
        ),
        
        // Private/Public toggle
        React.createElement('div', { className: 'mb-6' },
          React.createElement('label', { className: 'flex items-center text-white' },
            React.createElement('input', {
              type: 'checkbox',
              checked: formData.isPrivate,
              onChange: (e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked })),
              className: 'ml-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
            }),
            'חדר פרטי'
          )
        ),
        
        // Buttons
        React.createElement('div', { className: 'flex space-x-3' },
          React.createElement('button', {
            type: 'button',
            onClick: onClose,
            className: 'flex-1 py-2 px-4 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors'
          }, t('btn.cancel')),
          
          React.createElement('button', {
            type: 'submit',
            disabled: loading,
            className: 'flex-1 py-2 px-4 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg transition-colors'
          }, loading ? 'יוצר...' : t('btn.create'))
        )
      )
    )
  );
}

// Join Room Modal Component
function JoinRoomModal({ onClose, onSuccess }) {
  const [roomKey, setRoomKey] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { t } = useContext(LanguageContext);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roomKey.trim()) return;
    
    setLoading(true);
    
    try {
      const response = await APIClient.game('/room/join', {
        roomKey: roomKey.trim().toUpperCase()
      }, 'POST');
      
      if (response.success) {
        onSuccess(response.data);
        onClose();
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'
  },
    React.createElement('div', {
      className: 'bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 w-full max-w-md'
    },
      React.createElement('h3', {
        className: 'text-xl font-bold text-white mb-4'
      }, t('room.join_private')),
      
      React.createElement('form', { onSubmit: handleSubmit },
        React.createElement('div', { className: 'mb-6' },
          React.createElement('label', {
            className: 'block text-white mb-2'
          }, 'מפתח החדר'),
          React.createElement('input', {
            type: 'text',
            value: roomKey,
            onChange: (e) => setRoomKey(e.target.value.toUpperCase()),
            placeholder: 'הכנס מפתח חדר (6 תווים)',
            maxLength: 6,
            className: 'w-full px-4 py-3 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-center text-2xl font-mono tracking-widest'
          })
        ),
        
        React.createElement('div', { className: 'flex space-x-3' },
          React.createElement('button', {
            type: 'button',
            onClick: onClose,
            className: 'flex-1 py-2 px-4 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors'
          }, t('btn.cancel')),
          
          React.createElement('button', {
            type: 'submit',
            disabled: loading || roomKey.length !== 6,
            className: 'flex-1 py-2 px-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg transition-colors'
          }, loading ? 'מתחבר...' : t('btn.join'))
        )
      )
    )
  );
}

// Available Rooms Modal Component
function AvailableRoomsModal({ rooms, loading, onClose, onJoinRoom }) {
  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'
  },
    React.createElement('div', {
      className: 'bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto'
    },
      React.createElement('h3', {
        className: 'text-xl font-bold text-white mb-4 flex items-center justify-between'
      }, 
        'חדרים זמינים',
        React.createElement('button', {
          onClick: onClose,
          className: 'text-white hover:text-red-300 transition-colors'
        },
          React.createElement('i', { className: 'fas fa-times' })
        )
      ),
      
      loading ? 
        React.createElement('div', { className: 'text-center py-8' },
          React.createElement('div', {
            className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto'
          })
        ) :
        rooms.length === 0 ?
          React.createElement('p', {
            className: 'text-blue-200 text-center py-8'
          }, 'אין חדרים ציבוריים זמינים כרגע') :
          React.createElement('div', { className: 'space-y-3' },
            rooms.map(room =>
              React.createElement('div', {
                key: room.id,
                className: 'bg-white bg-opacity-10 rounded-xl p-4 flex items-center justify-between'
              },
                React.createElement('div', { className: 'text-white' },
                  React.createElement('div', { className: 'font-semibold' }, room.room_name || room.owner_name),
                  React.createElement('div', { className: 'text-sm text-blue-200' },
                    `${room.entry_points} נקודות • ${room.current_players}/${room.max_players} שחקנים`
                  )
                ),
                React.createElement('button', {
                  onClick: () => {
                    onJoinRoom(room.room_key);
                    onClose();
                  },
                  disabled: room.current_players >= room.max_players,
                  className: 'px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors'
                }, room.current_players >= room.max_players ? 'מלא' : 'הצטרף')
              )
            )
          )
    )
  );
}

// Waiting Room Screen Component
function WaitingRoomScreen({ roomData, onBack, onGameStart }) {
  const [players, setPlayers] = useState([]);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { user } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  
  useEffect(() => {
    loadRoomData();
    const interval = setInterval(loadRoomData, 2000); // Poll every 2 seconds
    
    return () => clearInterval(interval);
  }, [roomData.roomId]);
  
  const loadRoomData = async () => {
    try {
      const response = await APIClient.game(`/room/${roomData.roomId}`);
      if (response.success) {
        setRoom(response.data.room);
        setPlayers(response.data.players);
        
        // Check if game should start
        if (response.data.players.length === response.data.room.max_players) {
          // Auto-start if room is full (for room owner)
          if (response.data.room.owner_id === user.id) {
            startGame();
          }
        }
      }
    } catch (error) {
      console.error('Failed to load room data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const startGame = async () => {
    try {
      const response = await APIClient.game(`/room/${roomData.roomId}/start`, {}, 'POST');
      if (response.success) {
        onGameStart();
      }
    } catch (error) {
      alert(error.message);
    }
  };
  
  if (loading) {
    return React.createElement('div', {
      className: 'flex items-center justify-center min-h-screen'
    },
      React.createElement('div', {
        className: 'animate-spin rounded-full h-32 w-32 border-b-2 border-white'
      })
    );
  }
  
  const gameTypeNames = {
    'rummy31': t('game.rummy31'),
    'rummyannette': t('game.rummyannette'),
    'rummy51': t('game.rummy51')
  };
  
  return React.createElement('div', {
    className: 'min-h-screen p-4'
  },
    // Header
    React.createElement('div', {
      className: 'flex items-center justify-between mb-6 bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-4'
    },
      React.createElement('button', {
        onClick: onBack,
        className: 'flex items-center text-white hover:text-blue-200 transition-colors'
      },
        React.createElement('i', { className: 'fas fa-arrow-right mr-2' }),
        t('game.back')
      ),
      React.createElement('div', { className: 'text-center text-white' },
        React.createElement('h1', { className: 'text-xl font-bold' }, gameTypeNames[room?.game_type]),
        room?.is_private && React.createElement('p', { className: 'text-blue-200' }, `מפתח: ${roomData.roomKey}`)
      ),
      React.createElement('div', {
        className: 'text-white text-lg'
      }, `${room?.entry_points} ${t('game.points')}`)
    ),
    
    // Waiting area
    React.createElement('div', { className: 'max-w-2xl mx-auto' },
      React.createElement('div', {
        className: 'bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 text-center'
      },
        React.createElement('h2', {
          className: 'text-2xl font-bold text-white mb-6'
        }, t('game.waiting')),
        
        React.createElement('div', {
          className: 'text-4xl mb-6'
        }, `${players.length}/${room?.max_players}`),
        
        // Players list
        React.createElement('div', { className: 'space-y-3 mb-8' },
          Array.from({ length: room?.max_players || 0 }, (_, index) => {
            const player = players[index];
            return React.createElement('div', {
              key: index,
              className: `p-4 rounded-xl ${player ? 'bg-green-500 bg-opacity-20 border border-green-400' : 'bg-gray-500 bg-opacity-20 border border-gray-400 border-dashed'}`
            },
              player ? 
                React.createElement('div', { className: 'flex items-center justify-center' },
                  player.is_bot && React.createElement('i', { className: 'fas fa-robot ml-2 text-blue-300' }),
                  React.createElement('span', { className: 'text-white font-medium' }, player.username),
                  player.user_id === user.id && React.createElement('span', { className: 'text-green-300 mr-2' }, '(אתה)')
                ) :
                React.createElement('span', { className: 'text-gray-400' }, 'מחכה לשחקן...')
            );
          })
        ),
        
        // Start game button (for room owner)
        room?.owner_id === user.id && players.length === room?.max_players &&
        React.createElement('button', {
          onClick: startGame,
          className: 'px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-green-700 transition-all'
        }, 'התחל משחק'),
        
        // Waiting animation
        players.length < (room?.max_players || 0) &&
        React.createElement('div', { className: 'flex justify-center' },
          React.createElement('div', {
            className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-white'
          })
        )
      )
    )
  );
}

// Make components available globally
window.RoomSelectionScreen = RoomSelectionScreen;
window.CreateRoomModal = CreateRoomModal;
window.JoinRoomModal = JoinRoomModal;
window.WaitingRoomScreen = WaitingRoomScreen;