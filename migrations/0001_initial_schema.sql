-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  password TEXT NOT NULL,
  points INTEGER DEFAULT 400,
  approved INTEGER DEFAULT 0,
  is_admin INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Game rooms table
CREATE TABLE IF NOT EXISTS game_rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_key TEXT UNIQUE NOT NULL,
  owner_id INTEGER NOT NULL,
  game_type TEXT NOT NULL, -- 'rummy31' or 'rummyannette'
  entry_points INTEGER NOT NULL,
  max_players INTEGER NOT NULL,
  current_players INTEGER DEFAULT 1,
  is_private INTEGER DEFAULT 1,
  status TEXT DEFAULT 'waiting', -- 'waiting', 'playing', 'finished'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Game players in rooms
CREATE TABLE IF NOT EXISTS room_players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER NOT NULL,
  user_id INTEGER,
  username TEXT NOT NULL,
  is_bot INTEGER DEFAULT 0,
  position INTEGER NOT NULL,
  hand TEXT, -- JSON string of player's tiles
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES game_rooms(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Game state for active games
CREATE TABLE IF NOT EXISTS game_states (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER UNIQUE NOT NULL,
  current_turn INTEGER DEFAULT 0,
  deck TEXT, -- JSON string of remaining deck tiles
  table_sets TEXT DEFAULT '[]', -- JSON string of sets on table
  game_data TEXT, -- JSON string for additional game state
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES game_rooms(id)
);

-- Bot nicknames
CREATE TABLE IF NOT EXISTS bot_nicknames (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT UNIQUE NOT NULL,
  used_recently INTEGER DEFAULT 0
);

-- Admin table
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_approved ON users(approved);
CREATE INDEX IF NOT EXISTS idx_game_rooms_status ON game_rooms(status);
CREATE INDEX IF NOT EXISTS idx_game_rooms_owner ON game_rooms(owner_id);
CREATE INDEX IF NOT EXISTS idx_room_players_room ON room_players(room_id);
CREATE INDEX IF NOT EXISTS idx_room_players_user ON room_players(user_id);