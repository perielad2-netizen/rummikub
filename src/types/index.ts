// User types
export interface User {
  id: number
  username: string
  phone: string
  points: number
  approved: boolean
  is_admin: boolean
  created_at: string
}

export interface AuthRequest {
  username: string
  phone: string
  password: string
  points?: number
}

export interface LoginRequest {
  username: string
  password: string
}

// Game types
export interface GameRoom {
  id: number
  room_key: string
  owner_id: number
  game_type: 'rummy31' | 'rummyannette' | 'rummy51'
  entry_points: number
  max_players: number
  current_players: number
  is_private: boolean
  status: 'waiting' | 'playing' | 'finished'
  created_at: string
}

export interface RoomPlayer {
  id: number
  room_id: number
  user_id: number | null
  username: string
  is_bot: boolean
  position: number
  hand: Tile[]
  joined_at: string
}

export interface GameState {
  id: number
  room_id: number
  current_turn: number
  deck: Tile[]
  table_sets: TileSet[]
  game_data: any
  updated_at: string
}

// Tile and game logic types
export interface Tile {
  id: string
  color: 'red' | 'blue' | 'black' | 'yellow'
  number: number | 'joker'
  isJoker: boolean
}

export interface TileSet {
  id: string
  tiles: Tile[]
  setType: 'run' | 'group'
  isValid: boolean
}

export interface GameMove {
  type: 'draw' | 'discard' | 'meld' | 'layoff' | 'rearrange'
  playerId: number
  tiles?: Tile[]
  setId?: string
  targetSetId?: string
  newSets?: TileSet[]
}

// WebSocket message types
export interface WSMessage {
  type: 'join_room' | 'leave_room' | 'game_move' | 'game_state' | 'player_joined' | 'player_left' | 'game_start' | 'game_end' | 'turn_change' | 'bot_move'
  roomId?: number
  playerId?: number
  data?: any
  timestamp?: number
}

// Bot types
export interface BotPlayer {
  id: string
  nickname: string
  difficulty: 'easy' | 'medium' | 'hard'
  hand: Tile[]
  strategy: BotStrategy
}

export interface BotStrategy {
  aggressiveness: number // 0-1
  riskTolerance: number // 0-1
  memoryAccuracy: number // 0-1
  reactionTime: number // milliseconds
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Language support
export interface Language {
  code: 'he' | 'en'
  name: string
  direction: 'rtl' | 'ltr'
}

export interface Translations {
  [key: string]: {
    he: string
    en: string
  }
}