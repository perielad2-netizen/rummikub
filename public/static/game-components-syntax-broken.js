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
      alert(t('room.no_public_rooms_alert'));
    }
  };
  
  return React.createElement('div', {
    className: 'min-h-screen p-4 relative'
  },
    // Universal Controls at bottom-left - consistent position
    React.createElement(UniversalControls, {
      className: 'fixed bottom-2 left-2 z-50'
    }),
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
            React.createElement('span', { className: 'text-lg font-bold' }, t('room.create_private'))
          )
        ),
        
        // Join Private Room
        React.createElement('button', {
          onClick: () => setShowJoinModal(true),
          className: 'w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105'
        },
          React.createElement('div', { className: 'flex items-center justify-center text-white' },
            React.createElement('i', { className: 'fas fa-key text-xl ml-3' }),
            React.createElement('span', { className: 'text-lg font-bold' }, t('room.join_private'))
          )
        ),
        
        // Quick Play
        React.createElement('button', {
          onClick: () => handleQuickPlay(),
          className: 'w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-lg hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105'
        },
          React.createElement('div', { className: 'flex items-center justify-center text-white' },
            React.createElement('i', { className: 'fas fa-flash text-xl ml-3' }),
            React.createElement('span', { className: 'text-lg font-bold' }, t('room.quick_game'))
          )
        ),
        
        // Available Rooms
        React.createElement('button', {
          onClick: () => setShowRoomsModal(true),
          className: 'w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 relative'
        },
          React.createElement('div', { className: 'flex items-center justify-center text-white' },
            React.createElement('i', { className: 'fas fa-users text-xl ml-3' }),
            React.createElement('span', { className: 'text-lg font-bold' }, t('room.public_rooms_list'))
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
}

// Create Room Modal Component
function CreateRoomModal({ gameType, onClose, onSuccess }) {
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
            React.createElement('span', { className: 'text-lg font-bold' }, t('room.create_private'))
          )
        ),
        
        // Join Private Room
        React.createElement('button', {
          onClick: () => setShowJoinModal(true),
          className: 'w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105'
        },
          React.createElement('div', { className: 'flex items-center justify-center text-white' },
            React.createElement('i', { className: 'fas fa-key text-xl ml-3' }),
            React.createElement('span', { className: 'text-lg font-bold' }, t('room.join_private'))
          )
        ),
        
        // Quick Play
        React.createElement('button', {
          onClick: () => handleQuickPlay(),
          className: 'w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-lg hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105'
        },
          React.createElement('div', { className: 'flex items-center justify-center text-white' },
            React.createElement('i', { className: 'fas fa-bolt text-xl ml-3' }),
            React.createElement('span', { className: 'text-lg font-bold' }, t('room.quick_game'))
          )
        ),
        
        // Available Rooms
        React.createElement('button', {
          onClick: () => setShowRoomsModal(true),
          className: 'w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 relative'
        },
          React.createElement('div', { className: 'flex items-center justify-center text-white' },
            React.createElement('i', { className: 'fas fa-users text-xl ml-3' }),
            React.createElement('span', { className: 'text-lg font-bold' }, t('room.public_rooms_list'))
          ),
          publicRooms.length > 0 && React.createElement('div', {
            className: 'absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold'
          }, publicRooms.length)
        )
      )
    ),
    
    // English and Fullscreen toggles (bottom-left of SCREEN, side-by-side, smaller)
    React.createElement('div', { className: 'fixed bottom-4 left-4 flex flex-row gap-1 z-40' },
      // English toggle with language functionality (needs to be passed from parent)
      React.createElement('button', {
        onClick: () => {
          // This will need the toggleLanguage function passed from parent
          console.log('Language toggle clicked');
        },
        className: 'bg-white bg-opacity-20 text-white text-xs px-1 py-0.5 rounded-sm transition-all hover:bg-opacity-30'
      }, 'EN'),
      
      // Fullscreen toggle
      React.createElement('button', {
        onClick: () => window.toggleFullscreen && window.toggleFullscreen(),
        className: 'bg-white bg-opacity-20 text-white text-xs px-1 py-0.5 rounded-sm transition-all hover:bg-opacity-30'
      },
        React.createElement('i', { className: 'fas fa-expand text-xs' })
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
      className: 'bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-4 w-full max-w-2xl landscape:max-w-4xl'
    },
      React.createElement('h3', {
        className: 'text-lg landscape:text-xl font-bold text-white mb-3 landscape:mb-4 text-center'
      }, t('room.create_private')),
      
      React.createElement('form', { 
        onSubmit: handleSubmit,
        className: 'landscape:grid landscape:grid-cols-2 landscape:gap-4 space-y-3 landscape:space-y-0'
      },
        // Room Name
        React.createElement('div', { className: 'mb-3' },
          React.createElement('label', {
            className: 'block text-white mb-1 text-sm landscape:text-base'
          }, t('room.room_name')),
          React.createElement('input', {
            type: 'text',
            value: formData.roomName,
            onChange: (e) => setFormData(prev => ({ ...prev, roomName: e.target.value })),
            placeholder: t('room.room_name_placeholder'),
            className: 'w-full px-3 py-2 landscape:px-4 landscape:py-3 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm landscape:text-base',
            maxLength: 30
          })
        ),
        
        // Entry Points
        React.createElement('div', { className: 'mb-3' },
          React.createElement('label', {
            className: 'block text-white mb-1 text-sm landscape:text-base'
          }, t('room.entry_points')),
          React.createElement('input', {
            type: 'number',
            min: 50,
            max: 1000,
            step: 50,
            value: formData.entryPoints,
            onChange: (e) => setFormData(prev => ({ ...prev, entryPoints: parseInt(e.target.value) })),
            className: 'w-full px-3 py-2 landscape:px-4 landscape:py-3 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm landscape:text-base'
          })
        ),
        
        // Max Players
        React.createElement('div', { className: 'mb-3 landscape:col-span-2' },
          React.createElement('label', {
            className: 'block text-white mb-1 text-sm landscape:text-base'
          }, t('room.max_players')),
          React.createElement('div', { className: 'flex gap-2 landscape:gap-3' },
            [2, 3, 4].map(num =>
              React.createElement('button', {
                key: num,
                type: 'button',
                onClick: () => setFormData(prev => ({ ...prev, maxPlayers: num })),
                className: `flex-1 px-3 py-2 landscape:px-4 landscape:py-3 rounded-lg border transition-colors text-sm landscape:text-base ${formData.maxPlayers === num ? 'bg-blue-500 border-blue-400 text-white' : 'bg-white bg-opacity-20 border-white border-opacity-30 text-blue-200'}`
              }, num)
            )
          )
        ),
        
        // Private/Public toggle
        React.createElement('div', { className: 'mb-4 landscape:col-span-2' },
          React.createElement('label', { className: 'flex items-center text-white text-sm landscape:text-base' },
            React.createElement('input', {
              type: 'checkbox',
              checked: formData.isPrivate,
              onChange: (e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked })),
              className: 'ml-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
            }),
            t('room.private_room')
          )
        ),
        
        // Buttons
        React.createElement('div', { className: 'flex gap-2 landscape:gap-3 landscape:col-span-2' },
          React.createElement('button', {
            type: 'button',
            onClick: onClose,
            className: 'flex-1 py-2 px-3 landscape:py-3 landscape:px-4 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm landscape:text-base'
          }, t('btn.cancel')),
          
          React.createElement('button', {
            type: 'submit',
            disabled: loading,
            className: 'flex-1 py-2 px-3 landscape:py-3 landscape:px-4 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg transition-colors text-sm landscape:text-base'
          }, loading ? t('room.creating') : t('btn.create'))
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
          }, t('room.join_private')),
          React.createElement('input', {
            type: 'text',
            value: roomKey,
            onChange: (e) => setRoomKey(e.target.value.toUpperCase()),
            placeholder: 'הכנס מפתח חדר (6 תווים)',
            maxLength: 6,
            className: 'w-full px-4 py-3 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-center text-2xl font-mono tracking-widest'
          })
        ),
        
        React.createElement('div', { className: 'flex gap-4' },
          React.createElement('button', {
            type: 'button',
            onClick: onClose,
            className: 'flex-1 py-2 px-4 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors'
          }, t('btn.cancel')),
          
          React.createElement('button', {
            type: 'submit',
            disabled: loading || roomKey.length !== 6,
            className: 'flex-1 py-2 px-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg transition-colors'
          }, loading ? t('btn.connecting') : t('btn.join'))
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
          }, t('room.no_public_rooms')) :
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
  const [botTimeout, setBotTimeout] = useState(null);
  
  const { user } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  
  useEffect(() => {
    loadRoomData();
    const interval = setInterval(loadRoomData, 2000); // Poll every 2 seconds
    
    return () => {
      clearInterval(interval);
      if (botTimeout) {
        clearTimeout(botTimeout);
      }
    };
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
        } else if (response.data.room.owner_id === user.id) {
          // Handle bot auto-join for room owner based on room size and current players
          scheduleNextBot(response.data.room, response.data.players);
        }
      }
    } catch (error) {
      console.error('Failed to load room data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const addBot = async () => {
    try {
      const response = await APIClient.game(`/room/${roomData.roomId}/add-bot`, {}, 'POST');
      if (response.success) {
        console.log('Bot added:', response.data.botName);
        // loadRoomData will be called by the interval and update the UI
      }
    } catch (error) {
      console.error('Failed to add bot:', error);
    }
  };
  
  const scheduleNextBot = (room, currentPlayers) => {
    const playerCount = currentPlayers.length;
    const maxPlayers = room.max_players;
    
    // Clear existing timeout
    if (botTimeout) {
      clearTimeout(botTimeout);
    }
    
    // Don't schedule bots if room is full or if there are already non-owner players
    if (playerCount >= maxPlayers) {
      return;
    }
    
    // Check if we have real players (not just owner)
    const realPlayers = currentPlayers.filter(p => !p.is_bot);
    if (realPlayers.length > 1) {
      return; // Real players joined, stop bot scheduling
    }
    
    let delay;
    
    if (maxPlayers === 2) {
      // 2-player room: Random 20-35 seconds for first (and only) bot
      if (playerCount === 1) {
        delay = Math.floor(Math.random() * (35000 - 20000 + 1)) + 20000; // 20-35 seconds
      }
    } else {
      // 3-4 player rooms: 10-20 seconds intervals for additional bots
      if (playerCount === 1) {
        // First bot: Random 20-35 seconds (same as 2-player)
        delay = Math.floor(Math.random() * (35000 - 20000 + 1)) + 20000; // 20-35 seconds
      } else if (playerCount < maxPlayers) {
        // Subsequent bots: Random 10-20 seconds
        delay = Math.floor(Math.random() * (20000 - 10000 + 1)) + 10000; // 10-20 seconds
      }
    }
    
    if (delay) {
      const timeout = setTimeout(() => {
        addBot();
      }, delay);
      setBotTimeout(timeout);
      
      console.log(`Next bot scheduled in ${Math.round(delay/1000)} seconds for ${maxPlayers}-player room (current: ${playerCount})`);
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
    className: 'min-h-screen p-3 landscape:p-4 relative'
  },
    // Universal Controls at bottom-left - consistent position
    React.createElement(UniversalControls, {
      className: 'fixed bottom-2 left-2 z-50'
    }),
    
    // Header - more compact
    React.createElement('div', {
      className: 'flex items-center justify-between mb-4 landscape:mb-6 bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-3 landscape:p-4'
    },
      React.createElement('button', {
        onClick: onBack,
        className: 'flex items-center text-white hover:text-blue-200 transition-colors text-sm landscape:text-base'
      },
        React.createElement('i', { className: 'fas fa-arrow-right mr-2' }),
        t('game.back')
      ),
      React.createElement('div', { className: 'text-center text-white' },
        React.createElement('h1', { className: 'text-lg landscape:text-xl font-bold' }, gameTypeNames[room?.game_type]),
        room?.is_private && React.createElement('p', { className: 'text-blue-200 text-xs landscape:text-sm' }, `מפתח: ${roomData.roomKey}`)
      ),
      React.createElement('div', {
        className: 'text-white text-sm landscape:text-base'
      }, `${room?.entry_points} ${t('game.points')}`)
    ),
    
    // Waiting area - more compact and nicer design
    React.createElement('div', { className: 'max-w-lg landscape:max-w-2xl mx-auto' },
      React.createElement('div', {
        className: 'bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-4 landscape:p-6 text-center'
      },
        React.createElement('h2', {
          className: 'text-lg landscape:text-xl font-bold text-white mb-4'
        }, t('game.waiting')),
        
        // Player count with proper styling - fix black text issue
        React.createElement('div', {
          className: 'text-2xl landscape:text-3xl font-bold text-white mb-4 landscape:mb-6'
        }, `${players.length}/${room?.max_players}`),
        
        // Players list - more compact
        React.createElement('div', { className: 'space-y-2 landscape:space-y-3 mb-6' },
          Array.from({ length: room?.max_players || 0 }, (_, index) => {
            const player = players[index];
            return React.createElement('div', {
              key: index,
              className: `p-3 landscape:p-4 rounded-lg ${player ? 'bg-green-500 bg-opacity-20 border border-green-400' : 'bg-gray-500 bg-opacity-20 border border-gray-400 border-dashed'}`
            },
              player ? 
                React.createElement('div', { className: 'flex items-center justify-center' },
                  React.createElement('span', { className: 'text-white font-medium text-sm landscape:text-base' }, player.username),
                  player.user_id === user.id && React.createElement('span', { className: 'text-green-300 mr-2 text-xs landscape:text-sm' }, '(אתה)')
                ) :
                React.createElement('span', { className: 'text-gray-400 text-sm landscape:text-base' }, 'מחכה לשחקן...')
            );
          })
        ),
        
        // Start game button (for room owner) - more compact
        room?.owner_id === user.id && players.length === room?.max_players &&
        React.createElement('button', {
          onClick: startGame,
          className: 'px-6 py-2 landscape:px-8 landscape:py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-green-700 transition-all text-sm landscape:text-base'
        }, 'התחל משחק'),
        
        // Waiting animation
        players.length < (room?.max_players || 0) &&
        React.createElement('div', { className: 'flex justify-center' },
          React.createElement('div', {
            className: 'animate-spin rounded-full h-6 w-6 landscape:h-8 landscape:w-8 border-b-2 border-white'
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