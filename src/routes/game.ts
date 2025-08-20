import { Hono } from 'hono'
import { v4 as uuidv4 } from 'uuid'
import { requireAuth } from '../utils/auth'
import { generateRoomKey, generateDeck, dealInitialHands, sortTiles } from '../utils/gameLogic'
import type { GameRoom, RoomPlayer, GameState, ApiResponse, Tile } from '../types'

type Bindings = {
  DB: D1Database
}

export const gameRoutes = new Hono<{ Bindings: Bindings }>()

// Create a new game room
gameRoutes.post('/room/create', async (c) => {
  try {
    const authUser = await requireAuth(c.req.header('Authorization'))
    if (!authUser) {
      return c.json<ApiResponse>({
        success: false,
        error: 'נדרש אישור זהות'
      }, 401)
    }

    const body = await c.req.json()
    const { gameType, entryPoints, maxPlayers, isPrivate, roomName } = body

    // Validate input
    if (!['rummy31', 'rummyannette'].includes(gameType)) {
      return c.json<ApiResponse>({
        success: false,
        error: 'סוג משחק לא תקין'
      }, 400)
    }

    if (entryPoints < 50 || entryPoints > 1000) {
      return c.json<ApiResponse>({
        success: false,
        error: 'נקודות הכניסה חייבות להיות בין 50 ל-1000'
      }, 400)
    }

    if (![2, 3, 4].includes(maxPlayers)) {
      return c.json<ApiResponse>({
        success: false,
        error: 'מספר השחקנים חייב להיות בין 2 ל-4'
      }, 400)
    }

    // Check if user has enough points
    const user = await c.env.DB.prepare(
      'SELECT points FROM users WHERE id = ?'
    ).bind(authUser.userId).first() as any

    if (!user || user.points < entryPoints) {
      return c.json<ApiResponse>({
        success: false,
        error: 'אין לך מספיק נקודות להצטרף למשחק זה'
      }, 400)
    }

    // Generate room key
    const roomKey = generateRoomKey()

    // Create room
    const roomResult = await c.env.DB.prepare(`
      INSERT INTO game_rooms (room_key, owner_id, game_type, entry_points, max_players, is_private, room_name, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'waiting')
    `).bind(roomKey, authUser.userId, gameType, entryPoints, maxPlayers, isPrivate ? 1 : 0, roomName || null).run()

    if (!roomResult.success) {
      throw new Error('Failed to create room')
    }

    const roomId = roomResult.meta.last_row_id

    // Add owner as first player
    await c.env.DB.prepare(`
      INSERT INTO room_players (room_id, user_id, username, is_bot, position, hand)
      VALUES (?, ?, ?, 0, 0, '[]')
    `).bind(roomId, authUser.userId, authUser.username, '[]').run()

    return c.json<ApiResponse>({
      success: true,
      data: {
        roomId,
        roomKey,
        gameType,
        entryPoints,
        maxPlayers,
        isPrivate,
        roomName
      }
    })

  } catch (error) {
    console.error('Create room error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'שגיאה ביצירת החדר'
    }, 500)
  }
})

// Join a game room
gameRoutes.post('/room/join', async (c) => {
  try {
    const authUser = await requireAuth(c.req.header('Authorization'))
    if (!authUser) {
      return c.json<ApiResponse>({
        success: false,
        error: 'נדרש אישור זהות'
      }, 401)
    }

    const body = await c.req.json()
    const { roomKey } = body

    if (!roomKey) {
      return c.json<ApiResponse>({
        success: false,
        error: 'מפתח חדר נדרש'
      }, 400)
    }

    // Find room
    const room = await c.env.DB.prepare(
      'SELECT * FROM game_rooms WHERE room_key = ? AND status = "waiting"'
    ).bind(roomKey).first() as any

    if (!room) {
      return c.json<ApiResponse>({
        success: false,
        error: 'חדר לא נמצא או שהמשחק כבר התחיל'
      }, 404)
    }

    // Check if room is full
    const currentPlayers = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM room_players WHERE room_id = ?'
    ).bind(room.id).first() as any

    if (currentPlayers.count >= room.max_players) {
      return c.json<ApiResponse>({
        success: false,
        error: 'החדר מלא'
      }, 400)
    }

    // Check if user already in room
    const existingPlayer = await c.env.DB.prepare(
      'SELECT id FROM room_players WHERE room_id = ? AND user_id = ?'
    ).bind(room.id, authUser.userId).first()

    if (existingPlayer) {
      return c.json<ApiResponse>({
        success: false,
        error: 'אתה כבר בחדר זה'
      }, 400)
    }

    // Check if user has enough points
    const user = await c.env.DB.prepare(
      'SELECT points FROM users WHERE id = ?'
    ).bind(authUser.userId).first() as any

    if (!user || user.points < room.entry_points) {
      return c.json<ApiResponse>({
        success: false,
        error: 'אין לך מספיק נקודות להצטרף למשחק זה'
      }, 400)
    }

    // Add player to room
    await c.env.DB.prepare(`
      INSERT INTO room_players (room_id, user_id, username, is_bot, position, hand)
      VALUES (?, ?, ?, 0, ?, '[]')
    `).bind(room.id, authUser.userId, authUser.username, currentPlayers.count).run()

    // Update room player count
    await c.env.DB.prepare(
      'UPDATE game_rooms SET current_players = ? WHERE id = ?'
    ).bind(currentPlayers.count + 1, room.id).run()

    return c.json<ApiResponse>({
      success: true,
      data: {
        roomId: room.id,
        roomKey: room.room_key,
        position: currentPlayers.count
      }
    })

  } catch (error) {
    console.error('Join room error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'שגיאה בהצטרפות לחדר'
    }, 500)
  }
})

// Get public rooms list
gameRoutes.get('/rooms/public', async (c) => {
  try {
    const authUser = await requireAuth(c.req.header('Authorization'))
    if (!authUser) {
      return c.json<ApiResponse>({
        success: false,
        error: 'נדרש אישור זהות'
      }, 401)
    }

    const rooms = await c.env.DB.prepare(`
      SELECT 
        gr.*,
        u.username as owner_name,
        COUNT(rp.id) as current_players
      FROM game_rooms gr
      JOIN users u ON gr.owner_id = u.id
      LEFT JOIN room_players rp ON gr.id = rp.room_id
      WHERE gr.is_private = 0 AND gr.status = 'waiting'
      GROUP BY gr.id
      ORDER BY gr.created_at DESC
    `).all() as any

    return c.json<ApiResponse>({
      success: true,
      data: rooms.results || []
    })

  } catch (error) {
    console.error('Get public rooms error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'שגיאה בקבלת רשימת החדרים'
    }, 500)
  }
})

// Get room details
gameRoutes.get('/room/:roomId', async (c) => {
  try {
    const authUser = await requireAuth(c.req.header('Authorization'))
    if (!authUser) {
      return c.json<ApiResponse>({
        success: false,
        error: 'נדרש אישור זהות'
      }, 401)
    }

    const roomId = c.req.param('roomId')

    // Get room details
    const room = await c.env.DB.prepare(
      'SELECT * FROM game_rooms WHERE id = ?'
    ).bind(roomId).first() as any

    if (!room) {
      return c.json<ApiResponse>({
        success: false,
        error: 'חדר לא נמצא'
      }, 404)
    }

    // Get players in room
    const players = await c.env.DB.prepare(`
      SELECT rp.*, u.username as user_name
      FROM room_players rp
      LEFT JOIN users u ON rp.user_id = u.id
      WHERE rp.room_id = ?
      ORDER BY rp.position
    `).bind(roomId).all() as any

    return c.json<ApiResponse>({
      success: true,
      data: {
        room,
        players: players.results || []
      }
    })

  } catch (error) {
    console.error('Get room details error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'שגיאה בקבלת פרטי החדר'
    }, 500)
  }
})

// Start game (when room is full)
gameRoutes.post('/room/:roomId/start', async (c) => {
  try {
    const authUser = await requireAuth(c.req.header('Authorization'))
    if (!authUser) {
      return c.json<ApiResponse>({
        success: false,
        error: 'נדרש אישור זהות'
      }, 401)
    }

    const roomId = c.req.param('roomId')

    // Get room details
    const room = await c.env.DB.prepare(
      'SELECT * FROM game_rooms WHERE id = ? AND owner_id = ? AND status = "waiting"'
    ).bind(roomId, authUser.userId).first() as any

    if (!room) {
      return c.json<ApiResponse>({
        success: false,
        error: 'חדר לא נמצא או שאין לך הרשאה להתחיל את המשחק'
      }, 404)
    }

    // Check if room is full
    const players = await c.env.DB.prepare(
      'SELECT * FROM room_players WHERE room_id = ? ORDER BY position'
    ).bind(roomId).all() as any

    const playersList = players.results || []
    if (playersList.length !== room.max_players) {
      return c.json<ApiResponse>({
        success: false,
        error: 'החדר לא מלא - לא ניתן להתחיל את המשחק'
      }, 400)
    }

    // Generate deck and deal initial hands
    const deck = generateDeck()
    const { hands, remainingDeck } = dealInitialHands(deck, playersList.length, room.game_type)

    // Update players with their hands
    for (let i = 0; i < playersList.length; i++) {
      const sortedHand = sortTiles(hands[i])
      await c.env.DB.prepare(
        'UPDATE room_players SET hand = ? WHERE id = ?'
      ).bind(JSON.stringify(sortedHand), playersList[i].id).run()
    }

    // Create initial game state
    await c.env.DB.prepare(`
      INSERT INTO game_states (room_id, current_turn, deck, table_sets, game_data)
      VALUES (?, 0, ?, '[]', '{}')
    `).bind(roomId, JSON.stringify(remainingDeck)).run()

    // Update room status
    await c.env.DB.prepare(
      'UPDATE game_rooms SET status = "playing" WHERE id = ?'
    ).bind(roomId).run()

    // Deduct entry points from all players
    for (const player of playersList) {
      if (player.user_id) {
        await c.env.DB.prepare(
          'UPDATE users SET points = points - ? WHERE id = ?'
        ).bind(room.entry_points, player.user_id).run()
      }
    }

    return c.json<ApiResponse>({
      success: true,
      data: {
        message: 'המשחק התחיל בהצלחה',
        gameState: {
          roomId,
          currentTurn: 0,
          players: playersList.map((p, i) => ({
            id: p.id,
            username: p.username,
            position: p.position,
            handSize: hands[i].length,
            isBot: p.is_bot
          }))
        }
      }
    })

  } catch (error) {
    console.error('Start game error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'שגיאה בהתחלת המשחק'
    }, 500)
  }
})

// Get game state
gameRoutes.get('/state/:roomId', async (c) => {
  try {
    const authUser = await requireAuth(c.req.header('Authorization'))
    if (!authUser) {
      return c.json<ApiResponse>({
        success: false,
        error: 'נדרש אישור זהות'
      }, 401)
    }

    const roomId = c.req.param('roomId')

    // Get game state
    const gameState = await c.env.DB.prepare(
      'SELECT * FROM game_states WHERE room_id = ?'
    ).bind(roomId).first() as any

    if (!gameState) {
      return c.json<ApiResponse>({
        success: false,
        error: 'מצב המשחק לא נמצא'
      }, 404)
    }

    // Get room and players
    const room = await c.env.DB.prepare(
      'SELECT * FROM game_rooms WHERE id = ?'
    ).bind(roomId).first() as any

    const players = await c.env.DB.prepare(
      'SELECT * FROM room_players WHERE room_id = ? ORDER BY position'
    ).bind(roomId).all() as any

    // Get current player's hand
    const currentPlayer = (players.results || []).find((p: any) => p.user_id === authUser.userId)
    const playerHand = currentPlayer ? JSON.parse(currentPlayer.hand || '[]') : []

    return c.json<ApiResponse>({
      success: true,
      data: {
        room,
        currentTurn: gameState.current_turn,
        tableSets: JSON.parse(gameState.table_sets || '[]'),
        deckSize: JSON.parse(gameState.deck || '[]').length,
        players: (players.results || []).map((p: any) => ({
          id: p.id,
          username: p.username,
          position: p.position,
          handSize: JSON.parse(p.hand || '[]').length,
          isBot: p.is_bot
        })),
        playerHand: sortTiles(playerHand),
        gameData: JSON.parse(gameState.game_data || '{}')
      }
    })

  } catch (error) {
    console.error('Get game state error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'שגיאה בקבלת מצב המשחק'
    }, 500)
  }
})