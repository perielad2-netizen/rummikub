// Game Board Screen Component with Drag & Drop
function GameBoardScreen({ roomData, gameType, wsManager, onGameEnd }) {
  const [gameState, setGameState] = useState(null);
  const [playerHand, setPlayerHand] = useState([]);
  const [selectedTiles, setSelectedTiles] = useState([]);
  const [draggedTile, setDraggedTile] = useState(null);
  const [tableSets, setTableSets] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSortOptions, setShowSortOptions] = useState(false);
  
  const { user } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  
  useEffect(() => {
    loadGameState();
    setupWebSocketHandlers();
    
    return () => {
      wsManager.off('game_state');
      wsManager.off('game_move');
      wsManager.off('game_end');
      wsManager.off('bot_move');
    };
  }, []);
  
  const loadGameState = async () => {
    try {
      const response = await APIClient.game(`/state/${roomData.roomId}`);
      if (response.success) {
        setGameState(response.data);
        setPlayerHand(response.data.playerHand || []);
        setTableSets(response.data.tableSets || []);
        setCurrentTurn(response.data.currentTurn || 0);
        setPlayers(response.data.players || []);
        
        // Join WebSocket room
        wsManager.send({
          type: 'join_room',
          data: {
            roomId: roomData.roomId,
            playerId: user.id
          }
        });
      }
    } catch (error) {
      console.error('Failed to load game state:', error);
      alert('שגיאה בטעינת המשחק');
      onGameEnd();
    } finally {
      setLoading(false);
    }
  };
  
  const setupWebSocketHandlers = () => {
    wsManager.on('game_state', (data) => {
      setGameState(data);
      setPlayerHand(data.playerHand || []);
      setTableSets(data.tableSets || []);
      setCurrentTurn(data.currentTurn || 0);
      setPlayers(data.players || []);
    });
    
    wsManager.on('game_move', (data) => {
      // Handle opponent moves
      console.log('Opponent move:', data);
    });
    
    wsManager.on('game_end', (data) => {
      alert(`המשחק הסתיים! הזוכה: ${data.winner?.username}`);
      onGameEnd();
    });
    
    wsManager.on('bot_move', (data) => {
      console.log('Bot move:', data);
    });
  };
  
  // Drag and Drop Functions
  const handleTileDragStart = (e, tile) => {
    setDraggedTile(tile);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tile.id);
    
    // Add visual feedback
    e.target.classList.add('dragging');
  };
  
  const handleTileDragEnd = (e) => {
    setDraggedTile(null);
    e.target.classList.remove('dragging');
  };
  
  const handleDropZoneDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
  };
  
  const handleDropZoneDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
  };
  
  const handleDropZoneDrop = (e, setId) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    if (draggedTile) {
      handleTileMove(draggedTile, setId);
    }
  };
  
  const handleTileMove = async (tile, targetSetId) => {
    try {
      const move = {
        type: 'layoff',
        playerId: user.id,
        tiles: [tile],
        targetSetId
      };
      
      wsManager.send({
        type: 'game_move',
        roomId: roomData.roomId,
        data: { move }
      });
      
    } catch (error) {
      console.error('Move failed:', error);
      alert('מהלך לא חוקי');
    }
  };
  
  // Tile Selection Functions
  const toggleTileSelection = (tile) => {
    setSelectedTiles(prev => {
      const isSelected = prev.some(t => t.id === tile.id);
      if (isSelected) {
        return prev.filter(t => t.id !== tile.id);
      } else {
        return [...prev, tile];
      }
    });
  };
  
  const clearSelection = () => {
    setSelectedTiles([]);
  };
  
  // Sorting Functions
  const sortTilesByRuns = () => {
    const sorted = [...playerHand].sort((a, b) => {
      if (a.color !== b.color) {
        const colorOrder = { red: 1, blue: 2, black: 3, yellow: 4 };
        return colorOrder[a.color] - colorOrder[b.color];
      }
      if (a.isJoker && !b.isJoker) return 1;
      if (!a.isJoker && b.isJoker) return -1;
      return (a.number || 0) - (b.number || 0);
    });
    setPlayerHand(sorted);
  };
  
  const sortTilesByGroups = () => {
    const sorted = [...playerHand].sort((a, b) => {
      if (a.isJoker && !b.isJoker) return 1;
      if (!a.isJoker && b.isJoker) return -1;
      if (a.number !== b.number) {
        return (a.number || 0) - (b.number || 0);
      }
      const colorOrder = { red: 1, blue: 2, black: 3, yellow: 4 };
      return colorOrder[a.color] - colorOrder[b.color];
    });
    setPlayerHand(sorted);
  };
  
  // Game Action Functions
  const drawTile = async () => {
    try {
      wsManager.send({
        type: 'game_move',
        roomId: roomData.roomId,
        data: {
          move: {
            type: 'draw',
            playerId: user.id
          }
        }
      });
    } catch (error) {
      console.error('Draw failed:', error);
    }
  };
  
  const meldTiles = async () => {
    if (selectedTiles.length < 3) {
      alert('יש לבחור לפחות 3 קלפים ליצירת סט');
      return;
    }
    
    try {
      const move = {
        type: 'meld',
        playerId: user.id,
        tiles: selectedTiles
      };
      
      wsManager.send({
        type: 'game_move',
        roomId: roomData.roomId,
        data: { move }
      });
      
      clearSelection();
    } catch (error) {
      console.error('Meld failed:', error);
      alert('לא ניתן ליצור סט עם הקלפים הנבחרים');
    }
  };
  
  const endTurn = async () => {
    try {
      wsManager.send({
        type: 'game_move',
        roomId: roomData.roomId,
        data: {
          move: {
            type: 'end_turn',
            playerId: user.id
          }
        }
      });
    } catch (error) {
      console.error('End turn failed:', error);
    }
  };
  
  // Render Functions
  const renderTile = (tile, index, isSelected = false, isDraggable = true) => {
    const tileColors = {
      red: 'bg-red-500 text-white',
      blue: 'bg-blue-500 text-white',
      black: 'bg-gray-800 text-white',
      yellow: 'bg-yellow-500 text-black'
    };
    
    return React.createElement('div', {
      key: tile.id,
      draggable: isDraggable,
      onDragStart: (e) => isDraggable && handleTileDragStart(e, tile),
      onDragEnd: handleTileDragEnd,
      onClick: () => isDraggable && toggleTileSelection(tile),
      className: `tile w-12 h-16 sm:w-14 sm:h-20 md:w-16 md:h-24 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm md:text-base cursor-pointer border-2 transition-all ${
        isSelected ? 'border-yellow-400 transform -translate-y-2' : 'border-transparent'
      } ${tileColors[tile.color]} ${isDraggable ? 'hover:shadow-lg' : ''}`
    },
      tile.isJoker ? '🃏' : tile.number
    );
  };
  
  const renderTableSet = (set, setIndex) => {
    return React.createElement('div', {
      key: set.id,
      className: 'drop-zone bg-white bg-opacity-10 rounded-lg p-2 min-h-20 sm:min-h-24 md:min-h-28 flex items-center space-x-1 border-2 border-dashed border-gray-400 transition-all',
      onDragOver: handleDropZoneDragOver,
      onDragLeave: handleDropZoneDragLeave,
      onDrop: (e) => handleDropZoneDrop(e, set.id)
    },
      set.tiles.map((tile, index) => renderTile(tile, index, false, false))
    );
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
  
  const currentPlayer = players[currentTurn];
  const isMyTurn = currentPlayer?.user_id === user.id;
  const gameTypeNames = {
    'rummy31': t('game.rummy31'),
    'rummyannette': t('game.rummyannette')
  };
  
  return React.createElement('div', {
    className: 'game-container h-screen overflow-hidden bg-gradient-to-br from-green-800 via-green-700 to-green-900'
  },
    // Game Header (landscape optimized)
    React.createElement('div', {
      className: 'flex items-center justify-between p-2 sm:p-4 bg-black bg-opacity-30 text-white'
    },
      // Back button and game info
      React.createElement('div', { className: 'flex items-center space-x-4' },
        React.createElement('button', {
          onClick: onGameEnd,
          className: 'p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors'
        },
          React.createElement('i', { className: 'fas fa-arrow-right' })
        ),
        React.createElement('div', { className: 'text-sm' },
          React.createElement('div', { className: 'font-bold' }, gameTypeNames[gameType]),
          React.createElement('div', { className: 'text-xs opacity-75' }, `חדר: ${roomData.roomKey}`)
        )
      ),
      
      // Current turn indicator
      React.createElement('div', { className: 'text-center' },
        React.createElement('div', { className: 'text-sm font-bold' },
          isMyTurn ? t('game.your_turn') : `תור: ${currentPlayer?.username}`
        ),
        React.createElement('div', { className: 'text-xs opacity-75' },
          `קלפים: ${playerHand.length}`
        )
      ),
      
      // Players info
      React.createElement('div', { className: 'flex space-x-2 text-xs' },
        players.map((player, index) =>
          React.createElement('div', {
            key: player.id,
            className: `p-1 px-2 rounded ${index === currentTurn ? 'bg-yellow-500 text-black' : 'bg-white bg-opacity-20'}`
          },
            React.createElement('div', null, player.username),
            React.createElement('div', { className: 'text-xs' }, `${player.handSize} קלפים`)
          )
        )
      )
    ),
    
    // Game Board (main playing area)
    React.createElement('div', {
      className: 'flex-1 flex flex-col p-2 sm:p-4 space-y-2 sm:space-y-4 overflow-hidden'
    },
      // Table Sets Area (middle)
      React.createElement('div', {
        className: 'flex-1 bg-green-600 bg-opacity-30 rounded-lg p-2 sm:p-4 overflow-auto'
      },
        React.createElement('div', { className: 'text-white text-sm mb-2' }, 'שולחן המשחק'),
        tableSets.length === 0 ?
          React.createElement('div', {
            className: 'text-center text-white opacity-50 py-8'
          }, 'עדיין לא הונחו סטים על השולחן') :
          React.createElement('div', {
            className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4'
          },
            tableSets.map((set, index) => renderTableSet(set, index))
          )
      ),
      
      // Player Hand Area (bottom)
      React.createElement('div', {
        className: 'bg-brown-600 bg-opacity-30 rounded-lg p-2 sm:p-4'
      },
        // Hand controls
        React.createElement('div', { className: 'flex items-center justify-between mb-2' },
          React.createElement('div', { className: 'text-white text-sm' }, 'הקלפים שלך'),
          React.createElement('div', { className: 'flex space-x-2' },
            // Sort buttons
            React.createElement('div', { className: 'relative' },
              React.createElement('button', {
                onClick: () => setShowSortOptions(!showSortOptions),
                className: 'p-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-colors'
              },
                React.createElement('i', { className: 'fas fa-sort' })
              ),
              
              showSortOptions && React.createElement('div', {
                className: 'absolute bottom-full mb-2 right-0 bg-black bg-opacity-80 rounded-lg p-2 space-y-1 min-w-max z-10'
              },
                React.createElement('button', {
                  onClick: () => {
                    sortTilesByRuns();
                    setShowSortOptions(false);
                  },
                  className: 'block w-full text-left px-3 py-1 text-white hover:bg-white hover:bg-opacity-20 rounded text-sm'
                }, 'מיין לפי רצפים'),
                React.createElement('button', {
                  onClick: () => {
                    sortTilesByGroups();
                    setShowSortOptions(false);
                  },
                  className: 'block w-full text-left px-3 py-1 text-white hover:bg-white hover:bg-opacity-20 rounded text-sm'
                }, 'מיין לפי קבוצות')
              )
            )
          )
        ),
        
        // Player tiles
        React.createElement('div', {
          className: 'flex flex-wrap gap-1 sm:gap-2 mb-4 max-h-32 sm:max-h-40 overflow-y-auto'
        },
          playerHand.map((tile, index) => 
            renderTile(tile, index, selectedTiles.some(t => t.id === tile.id))
          )
        ),
        
        // Game Actions (landscape optimized)
        React.createElement('div', { className: 'flex items-center justify-between' },
          React.createElement('div', { className: 'flex space-x-2' },
            selectedTiles.length > 0 && React.createElement('span', {
              className: 'text-white text-sm'
            }, `נבחרו: ${selectedTiles.length}`),
            
            selectedTiles.length > 0 && React.createElement('button', {
              onClick: clearSelection,
              className: 'px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm transition-colors'
            }, 'בטל בחירה')
          ),
          
          React.createElement('div', { className: 'flex space-x-2' },
            isMyTurn && React.createElement('button', {
              onClick: drawTile,
              className: 'px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors text-sm'
            }, 'משוך קלף'),
            
            selectedTiles.length >= 3 && React.createElement('button', {
              onClick: meldTiles,
              className: 'px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded transition-colors text-sm'
            }, 'הנח סט'),
            
            isMyTurn && React.createElement('button', {
              onClick: endTurn,
              className: 'px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors text-sm'
            }, 'סיים תור')
          )
        )
      )
    )
  );
}

// Admin Panel Component
function AdminPanel({ onBack }) {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  
  const { t } = useContext(LanguageContext);
  
  useEffect(() => {
    loadAdminData();
  }, []);
  
  const loadAdminData = async () => {
    try {
      const [usersRes, statsRes, activitiesRes] = await Promise.all([
        APIClient.admin('/users'),
        APIClient.admin('/stats'),
        APIClient.admin('/activities')
      ]);
      
      if (usersRes.success) setUsers(usersRes.data);
      if (statsRes.success) setStats(statsRes.data);
      if (activitiesRes.success) setActivities(activitiesRes.data);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const toggleUserApproval = async (userId, currentStatus) => {
    try {
      const response = await APIClient.admin(`/users/${userId}/approve`, {
        approved: !currentStatus
      }, 'POST');
      
      if (response.success) {
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, approved: !currentStatus } : user
        ));
      }
    } catch (error) {
      alert(error.message);
    }
  };
  
  const updateUserPoints = async (userId, points, operation) => {
    try {
      const response = await APIClient.admin(`/users/${userId}/points`, {
        points: parseInt(points),
        operation
      }, 'POST');
      
      if (response.success) {
        loadAdminData(); // Reload data
        alert('נקודות המשתמש עודכנו בהצלחה');
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
        'חזור'
      ),
      React.createElement('h1', {
        className: 'text-2xl font-bold text-white'
      }, 'פאנל ניהול'),
      React.createElement('div', {
        className: 'text-white text-sm'
      }, 'מנהל מערכת')
    ),
    
    // Tab navigation
    React.createElement('div', {
      className: 'flex space-x-4 mb-6'
    },
      ['users', 'stats', 'activities'].map(tab =>
        React.createElement('button', {
          key: tab,
          onClick: () => setActiveTab(tab),
          className: `px-6 py-3 rounded-lg transition-colors ${
            activeTab === tab ? 'bg-blue-500 text-white' : 'bg-white bg-opacity-10 text-blue-200 hover:bg-opacity-20'
          }`
        }, tab === 'users' ? 'משתמשים' : tab === 'stats' ? 'סטטיסטיקות' : 'פעילות')
      )
    ),
    
    // Tab content - scrollable area
    React.createElement('div', { className: 'flex-1 overflow-auto' },
      React.createElement('div', {
        className: 'bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-6'
      },
      activeTab === 'users' && React.createElement(UsersTab, {
        users,
        onToggleApproval: toggleUserApproval,
        onUpdatePoints: updateUserPoints
      }),
      
      activeTab === 'stats' && React.createElement(StatsTab, { stats }),
      
      activeTab === 'activities' && React.createElement(ActivitiesTab, { activities })
      )
    )
  );
}

// Users Tab Component
function UsersTab({ users, onToggleApproval, onUpdatePoints }) {
  const handlePointsUpdate = (userId, operation) => {
    const points = prompt(`כמה נקודות ל${operation === 'add' ? 'הוסיף' : operation === 'subtract' ? 'הפחית' : 'הגדיר'}?`);
    if (points) {
      onUpdatePoints(userId, points, operation);
    }
  };
  
  return React.createElement('div', null,
    React.createElement('h3', {
      className: 'text-xl font-bold text-white mb-4'
    }, 'ניהול משתמשים'),
    
    React.createElement('div', { className: 'space-y-3' },
      users.map(user =>
        React.createElement('div', {
          key: user.id,
          className: 'flex items-center justify-between p-4 bg-white bg-opacity-10 rounded-lg'
        },
          React.createElement('div', { className: 'text-white' },
            React.createElement('div', { className: 'font-semibold' }, user.username),
            React.createElement('div', { className: 'text-sm text-blue-200' },
              `${user.phone} • ${user.points} נקודות • ${new Date(user.created_at).toLocaleDateString('he-IL')}`
            )
          ),
          
          React.createElement('div', { className: 'flex items-center space-x-2' },
            // Approval toggle
            React.createElement('button', {
              onClick: () => onToggleApproval(user.id, user.approved),
              className: `px-3 py-1 rounded text-sm transition-colors ${
                user.approved ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
              }`
            }, user.approved ? 'מאושר' : 'ממתין'),
            
            // Points management
            React.createElement('div', { className: 'flex space-x-1' },
              React.createElement('button', {
                onClick: () => handlePointsUpdate(user.id, 'add'),
                className: 'p-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs'
              }, '+'),
              React.createElement('button', {
                onClick: () => handlePointsUpdate(user.id, 'subtract'),
                className: 'p-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs'
              }, '-'),
              React.createElement('button', {
                onClick: () => handlePointsUpdate(user.id, 'set'),
                className: 'p-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs'
              }, '=')
            )
          )
        )
      )
    )
  );
}

// Stats Tab Component
function StatsTab({ stats }) {
  return React.createElement('div', null,
    React.createElement('h3', {
      className: 'text-xl font-bold text-white mb-4'
    }, 'סטטיסטיקות מערכת'),
    
    React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-4 gap-4 mb-6' },
      [
        { label: 'סך משתמשים', value: stats.totalUsers, icon: 'fas fa-users' },
        { label: 'משתמשים מאושרים', value: stats.approvedUsers, icon: 'fas fa-check-circle' },
        { label: 'ממתינים לאישור', value: stats.pendingUsers, icon: 'fas fa-clock' },
        { label: 'חדרים פעילים', value: stats.activeRooms, icon: 'fas fa-gamepad' }
      ].map(stat =>
        React.createElement('div', {
          key: stat.label,
          className: 'bg-white bg-opacity-10 rounded-lg p-4 text-center'
        },
          React.createElement('i', { className: `${stat.icon} text-2xl text-blue-300 mb-2` }),
          React.createElement('div', { className: 'text-2xl font-bold text-white' }, stat.value || 0),
          React.createElement('div', { className: 'text-sm text-blue-200' }, stat.label)
        )
      )
    )
  );
}

// Activities Tab Component
function ActivitiesTab({ activities }) {
  return React.createElement('div', null,
    React.createElement('h3', {
      className: 'text-xl font-bold text-white mb-4'
    }, 'פעילות אחרונה'),
    
    React.createElement('div', { className: 'space-y-3' },
      activities.map(activity =>
        React.createElement('div', {
          key: activity.id,
          className: 'p-4 bg-white bg-opacity-10 rounded-lg'
        },
          React.createElement('div', { className: 'flex justify-between items-start' },
            React.createElement('div', { className: 'text-white' },
              React.createElement('div', { className: 'font-semibold' },
                `חדר ${activity.room_key} - ${activity.owner_name}`
              ),
              React.createElement('div', { className: 'text-sm text-blue-200' },
                `${activity.game_type} • ${activity.entry_points} נקודות • ${activity.player_count} שחקנים`
              )
            ),
            React.createElement('div', { className: 'text-right' },
              React.createElement('div', {
                className: `px-2 py-1 rounded text-xs ${
                  activity.status === 'playing' ? 'bg-green-500' :
                  activity.status === 'waiting' ? 'bg-yellow-500' :
                  'bg-gray-500'
                } text-white`
              }, activity.status),
              React.createElement('div', { className: 'text-xs text-blue-200 mt-1' },
                new Date(activity.created_at).toLocaleString('he-IL')
              )
            )
          )
        )
      )
    )
  );
}

// Make components available globally
window.GameBoardScreen = GameBoardScreen;
window.AdminPanel = AdminPanel;