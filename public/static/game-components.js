// Room Selection Screen Component
function RoomSelectionScreen({ gameType, onBack, onJoinRoom }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showPublicRoomsModal, setShowPublicRoomsModal] = useState(false);
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
  
  const quickPlayJoin = async () => {
    // Find first available public room
    const availableRoom = publicRooms.find(room => room.current_players < room.max_players);
    if (availableRoom) {
      joinPublicRoom(availableRoom.room_key);
    } else {
      alert('אין חדרים ציבוריים זמינים כרגע');
    }
  };
  
  const gameTypeNames = {
    'rummy31': 'רמי 31',
    'rummyannette': 'רמי אנט',
    'rummy51': 'רמי 51'
  };
  
  return React.createElement('div', {
    className: 'h-screen overflow-hidden flex flex-col'
  },
    // Header - Compact for mobile landscape
    React.createElement('div', {
      className: 'flex-shrink-0 flex items-center justify-between p-2 sm:p-3 bg-white bg-opacity-10 backdrop-blur-lg border-b border-white border-opacity-20'
    },
      React.createElement('button', {
        onClick: onBack,
        className: 'flex items-center text-white hover:text-blue-200 transition-colors text-sm'
      },
        React.createElement('i', { className: 'fas fa-arrow-right mr-1' }),
        'חזור'
      ),
      React.createElement('h1', {
        className: 'text-lg sm:text-xl font-bold text-white'
      }, gameTypeNames[gameType]),
      React.createElement('div', {
        className: 'text-white text-sm'
      }, `${user.points} נק'`)
    ),
    
    // Main Content - Optimized for mobile landscape
    React.createElement('div', { 
      className: 'flex-1 flex flex-col justify-center p-3 overflow-hidden'
    },
      React.createElement('div', { 
        className: 'max-w-md mx-auto w-full space-y-3'
      },
        // 1. Create Room Button
        React.createElement('button', {
          onClick: () => setShowCreateModal(true),
          className: 'w-full p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg hover:from-green-600 hover:to-green-700 transition-all touch-button'
        },
          React.createElement('div', { className: 'flex items-center justify-center text-white' },
            React.createElement('i', { className: 'fas fa-plus-circle text-lg ml-2' }),
            React.createElement('span', { className: 'text-sm sm:text-base font-bold' }, 'צור חדר פרטי')
          )
        ),
        
        // 2. Join Private Room Button  
        React.createElement('button', {
          onClick: () => setShowJoinModal(true),
          className: 'w-full p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all touch-button'
        },
          React.createElement('div', { className: 'flex items-center justify-center text-white' },
            React.createElement('i', { className: 'fas fa-key text-lg ml-2' }),
            React.createElement('span', { className: 'text-sm sm:text-base font-bold' }, 'הצטרף לחדר פרטי')
          )
        ),
        
        // 3. Quick Play Button
        React.createElement('button', {
          onClick: quickPlayJoin,
          disabled: loading || publicRooms.length === 0,
          className: 'w-full p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg hover:from-purple-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all touch-button'
        },
          React.createElement('div', { className: 'flex items-center justify-center text-white' },
            React.createElement('i', { className: 'fas fa-bolt text-lg ml-2' }),
            React.createElement('span', { className: 'text-sm sm:text-base font-bold' }, 'משחק מהיר')
          )
        ),
        
        // 4. Browse Public Rooms Button
        React.createElement('button', {
          onClick: () => setShowPublicRoomsModal(true),
          className: 'w-full p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all touch-button'
        },
          React.createElement('div', { className: 'flex items-center justify-between text-white px-2' },
            React.createElement('div', { className: 'flex items-center' },
              React.createElement('i', { className: 'fas fa-users text-lg ml-2' }),
              React.createElement('span', { className: 'text-sm sm:text-base font-bold' }, 'רשימת החדרים הציבוריים')
            ),
            React.createElement('span', { 
              className: 'bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs font-bold' 
            }, publicRooms.length)
          )
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
    }),
    
    showPublicRoomsModal && React.createElement(PublicRoomsModal, {
      publicRooms,
      gameTypeNames,
      loading,
      onClose: () => setShowPublicRoomsModal(false),
      onJoinRoom: joinPublicRoom,
      onRefresh: loadPublicRooms
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
}

// Create Room Modal Component
function CreateRoomModal({ gameType, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    entryPoints: 100,
    maxPlayers: 2,
    isPrivate: true
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
          React.createElement('div', { className: 'flex space-x-2' },
            [2, 3, 4].map(num =>
              React.createElement('button', {
                key: num,
                type: 'button',
                onClick: () => setFormData(prev => ({ ...prev, maxPlayers: num })),
                className: `px-4 py-2 rounded-lg border transition-colors ${formData.maxPlayers === num ? 'bg-blue-500 border-blue-400 text-white' : 'bg-white bg-opacity-20 border-white border-opacity-30 text-blue-200'}`
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

// Public Rooms Modal Component
function PublicRoomsModal({ publicRooms, gameTypeNames, loading, onClose, onJoinRoom, onRefresh }) {
  return React.createElement('div', {
    className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'
  },
    React.createElement('div', {
      className: 'bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden'
    },
      // Header
      React.createElement('div', {
        className: 'flex items-center justify-between p-4 border-b border-white border-opacity-20'
      },
        React.createElement('h3', {
          className: 'text-lg font-bold text-white'
        }, 'חדרים ציבוריים זמינים'),
        React.createElement('div', { className: 'flex items-center space-x-2' },
          React.createElement('button', {
            onClick: onRefresh,
            className: 'p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors'
          },
            React.createElement('i', { className: 'fas fa-sync-alt' })
          ),
          React.createElement('button', {
            onClick: onClose,
            className: 'p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors'
          },
            React.createElement('i', { className: 'fas fa-times' })
          )
        )
      ),
      
      // Content
      React.createElement('div', { className: 'p-4 overflow-y-auto max-h-96' },
        loading ? 
          React.createElement('div', { className: 'text-center py-8' },
            React.createElement('div', {
              className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto'
            })
          ) :
          publicRooms.length === 0 ?
            React.createElement('div', { className: 'text-center py-8' },
              React.createElement('i', { className: 'fas fa-inbox text-4xl text-blue-200 mb-4' }),
              React.createElement('p', {
                className: 'text-blue-200'
              }, 'אין חדרים ציבוריים זמינים כרגע')
            ) :
            React.createElement('div', { className: 'space-y-3' },
              publicRooms.map((room, index) =>
                React.createElement('div', {
                  key: room.id || index,
                  className: 'bg-white bg-opacity-10 rounded-xl p-3 hover:bg-opacity-20 transition-colors'
                },
                  React.createElement('div', { className: 'flex items-center justify-between' },
                    React.createElement('div', { className: 'flex-1' },
                      React.createElement('div', { className: 'flex items-center mb-1' },
                        React.createElement('span', { className: 'font-semibold text-white' }, `חדר #${room.room_key || (index + 1)}`),
                        React.createElement('span', { 
                          className: `ml-2 px-2 py-1 rounded-full text-xs font-bold ${
                            room.current_players >= room.max_players ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                          }`
                        }, room.current_players >= room.max_players ? 'מלא' : 'פתוח')
                      ),
                      React.createElement('div', { className: 'text-sm text-blue-200' },
                        `${room.owner_name} • ${gameTypeNames[room.game_type]} • ${room.entry_points} נק' • ${room.current_players}/${room.max_players} שחקנים`
                      )
                    ),
                    React.createElement('button', {
                      onClick: () => onJoinRoom(room.room_key),
                      disabled: room.current_players >= room.max_players,
                      className: 'px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-bold'
                    }, room.current_players >= room.max_players ? 'מלא' : 'הצטרף')
                  )
                )
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
      className: 'flex items-center justify-center h-screen'
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
    className: 'h-screen overflow-hidden flex flex-col p-4'
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
    
    // Waiting area - scrollable content
    React.createElement('div', { className: 'flex-1 overflow-auto' },
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
    )
  );
}

// Make components available globally
window.RoomSelectionScreen = RoomSelectionScreen;
window.CreateRoomModal = CreateRoomModal;
window.JoinRoomModal = JoinRoomModal;
window.WaitingRoomScreen = WaitingRoomScreen;