import { Hono } from 'hono'
import { upgradeWebSocket } from 'hono/cloudflare-workers'
import { requireAuth } from '../utils/auth'
import { createBotStrategy, calculateBotMove } from '../utils/gameLogic'
import type { WSMessage, BotPlayer } from '../types'

type Bindings = {
  DB: D1Database
}

// Store active WebSocket connections
const activeConnections = new Map<string, WebSocket>()
const roomConnections = new Map<number, Set<string>>()

export const websocketHandler = upgradeWebSocket((c) => {
  let userId: number | null = null
  let roomId: number | null = null
  let connectionId: string | null = null

  return {
    onOpen: async (event, ws) => {
      connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      activeConnections.set(connectionId, ws)
      
      console.log(`WebSocket connection opened: ${connectionId}`)
    },

    onMessage: async (event, ws) => {
      try {
        const message: WSMessage = JSON.parse(event.data.toString())
        
        switch (message.type) {
          case 'join_room':
            await handleJoinRoom(message, ws, c.env.DB)
            break
          
          case 'leave_room':
            await handleLeaveRoom(message, ws, c.env.DB)
            break
          
          case 'game_move':
            await handleGameMove(message, ws, c.env.DB)
            break
          
          default:
            console.log('Unknown message type:', message.type)
        }
      } catch (error) {
        console.error('WebSocket message error:', error)
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: 'שגיאה בעיבוד ההודעה' }
        }))
      }
    },

    onClose: async (event, ws) => {
      if (connectionId) {
        activeConnections.delete(connectionId)
        
        // Remove from room connections
        if (roomId && roomConnections.has(roomId)) {
          const roomConns = roomConnections.get(roomId)!
          roomConns.delete(connectionId)
          
          if (roomConns.size === 0) {
            roomConnections.delete(roomId)
          }
        }
        
        console.log(`WebSocket connection closed: ${connectionId}`)
      }
    },

    onError: (event, ws) => {
      console.error('WebSocket error:', event)
    }
  }
})

async function handleJoinRoom(message: WSMessage, ws: WebSocket, db: D1Database) {
  try {
    const { roomId: msgRoomId, playerId } = message.data
    
    if (!msgRoomId || !playerId) {
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'מזהה חדר ושחקן נדרשים' }
      }))
      return
    }

    // Verify room exists and player is in room
    const player = await db.prepare(`
      SELECT rp.*, gr.status, gr.game_type, gr.max_players
      FROM room_players rp
      JOIN game_rooms gr ON rp.room_id = gr.id
      WHERE rp.room_id = ? AND rp.id = ?
    `).bind(msgRoomId, playerId).first() as any

    if (!player) {
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'שחקן לא נמצא בחדר זה' }
      }))
      return
    }

    // Add connection to room
    if (!roomConnections.has(msgRoomId)) {
      roomConnections.set(msgRoomId, new Set())
    }
    
    const connectionId = Array.from(activeConnections.entries())
      .find(([id, socket]) => socket === ws)?.[0]
    
    if (connectionId) {
      roomConnections.get(msgRoomId)!.add(connectionId)
    }

    // Send current game state
    const gameState = await getGameState(msgRoomId, db)
    ws.send(JSON.stringify({
      type: 'game_state',
      data: gameState
    }))

    // Notify other players in room
    await broadcastToRoom(msgRoomId, {
      type: 'player_joined',
      data: {
        playerId,
        username: player.username
      }
    })

    // Check if we need to add bots for public rooms
    await checkAndAddBots(msgRoomId, db)

  } catch (error) {
    console.error('Join room error:', error)
    ws.send(JSON.stringify({
      type: 'error',
      data: { message: 'שגיאה בהצטרפות לחדר' }
    }))
  }
}

async function handleLeaveRoom(message: WSMessage, ws: WebSocket, db: D1Database) {
  try {
    const { roomId: msgRoomId, playerId } = message.data
    
    // Remove from room connections
    const connectionId = Array.from(activeConnections.entries())
      .find(([id, socket]) => socket === ws)?.[0]
    
    if (connectionId && msgRoomId && roomConnections.has(msgRoomId)) {
      roomConnections.get(msgRoomId)!.delete(connectionId)
    }

    // Notify other players
    await broadcastToRoom(msgRoomId, {
      type: 'player_left',
      data: { playerId }
    })

  } catch (error) {
    console.error('Leave room error:', error)
  }
}

async function handleGameMove(message: WSMessage, ws: WebSocket, db: D1Database) {
  try {
    const { roomId: msgRoomId, move } = message.data
    
    // Validate and process the move
    const isValidMove = await validateMove(msgRoomId, move, db)
    if (!isValidMove) {
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'מהלך לא חוקי' }
      }))
      return
    }

    // Apply the move to game state
    await applyMove(msgRoomId, move, db)

    // Get updated game state
    const gameState = await getGameState(msgRoomId, db)

    // Broadcast updated state to all players in room
    await broadcastToRoom(msgRoomId, {
      type: 'game_state',
      data: gameState
    })

    // Check for game end conditions
    const gameResult = await checkGameEnd(msgRoomId, db)
    if (gameResult.isFinished) {
      await handleGameEnd(msgRoomId, gameResult, db)
    } else {
      // Process bot moves if it's a bot's turn
      await processBotTurn(msgRoomId, db)
    }

  } catch (error) {
    console.error('Game move error:', error)
    ws.send(JSON.stringify({
      type: 'error',
      data: { message: 'שגיאה בביצוע המהלך' }
    }))
  }
}

async function getGameState(roomId: number, db: D1Database): Promise<any> {
  const gameState = await db.prepare(
    'SELECT * FROM game_states WHERE room_id = ?'
  ).bind(roomId).first() as any

  const room = await db.prepare(
    'SELECT * FROM game_rooms WHERE id = ?'
  ).bind(roomId).first() as any

  const players = await db.prepare(
    'SELECT * FROM room_players WHERE room_id = ? ORDER BY position'
  ).bind(roomId).all() as any

  return {
    room,
    gameState,
    players: players.results || []
  }
}

async function broadcastToRoom(roomId: number, message: WSMessage) {
  const roomConns = roomConnections.get(roomId)
  if (!roomConns) return

  const messageStr = JSON.stringify(message)
  
  for (const connectionId of roomConns) {
    const ws = activeConnections.get(connectionId)
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(messageStr)
      } catch (error) {
        console.error('Broadcast error:', error)
        // Remove dead connection
        activeConnections.delete(connectionId)
        roomConns.delete(connectionId)
      }
    }
  }
}

async function checkAndAddBots(roomId: number, db: D1Database) {
  try {
    // Get room info
    const room = await db.prepare(`
      SELECT gr.*, COUNT(rp.id) as current_players
      FROM game_rooms gr
      LEFT JOIN room_players rp ON gr.id = rp.room_id
      WHERE gr.id = ? AND gr.status = 'waiting' AND gr.is_private = 0
      GROUP BY gr.id
    `).bind(roomId).first() as any

    if (!room || room.current_players >= room.max_players) {
      return
    }

    // Add bot after random delay (25-40 seconds for first bot)
    const delay = 25000 + Math.random() * 15000
    
    setTimeout(async () => {
      await addBotPlayer(roomId, db)
      
      // Add additional bots if needed (15-25 seconds delay)
      const updatedRoom = await db.prepare(`
        SELECT COUNT(rp.id) as current_players
        FROM room_players rp
        WHERE rp.room_id = ?
      `).bind(roomId).first() as any

      if (updatedRoom && updatedRoom.current_players < room.max_players) {
        const nextDelay = 15000 + Math.random() * 10000
        setTimeout(() => addBotPlayer(roomId, db), nextDelay)
      }
    }, delay)

  } catch (error) {
    console.error('Check and add bots error:', error)
  }
}

async function addBotPlayer(roomId: number, db: D1Database): Promise<void> {
  try {
    // Get random unused bot nickname
    const botNickname = await db.prepare(`
      SELECT nickname FROM bot_nicknames 
      WHERE used_recently = 0 
      ORDER BY RANDOM() 
      LIMIT 1
    `).first() as any

    if (!botNickname) {
      console.error('No available bot nicknames')
      return
    }

    // Mark nickname as used
    await db.prepare(
      'UPDATE bot_nicknames SET used_recently = 1 WHERE nickname = ?'
    ).bind(botNickname.nickname).run()

    // Get next position
    const playerCount = await db.prepare(
      'SELECT COUNT(*) as count FROM room_players WHERE room_id = ?'
    ).bind(roomId).first() as any

    // Add bot to room
    await db.prepare(`
      INSERT INTO room_players (room_id, user_id, username, is_bot, position, hand)
      VALUES (?, NULL, ?, 1, ?, '[]')
    `).bind(roomId, botNickname.nickname, playerCount.count).run()

    // Update room player count
    await db.prepare(
      'UPDATE game_rooms SET current_players = current_players + 1 WHERE id = ?'
    ).bind(roomId).run()

    // Notify players about new bot
    await broadcastToRoom(roomId, {
      type: 'player_joined',
      data: {
        username: botNickname.nickname,
        isBot: true
      }
    })

    console.log(`Bot ${botNickname.nickname} added to room ${roomId}`)

  } catch (error) {
    console.error('Add bot player error:', error)
  }
}

async function validateMove(roomId: number, move: any, db: D1Database): Promise<boolean> {
  // Basic move validation - can be enhanced
  try {
    const gameState = await db.prepare(
      'SELECT * FROM game_states WHERE room_id = ?'
    ).bind(roomId).first()

    return !!gameState // Simplified validation
  } catch (error) {
    return false
  }
}

async function applyMove(roomId: number, move: any, db: D1Database): Promise<void> {
  // Apply the move to the database
  // This is a simplified implementation - full game logic would be more complex
  try {
    await db.prepare(
      'UPDATE game_states SET updated_at = CURRENT_TIMESTAMP WHERE room_id = ?'
    ).bind(roomId).run()
  } catch (error) {
    console.error('Apply move error:', error)
  }
}

async function checkGameEnd(roomId: number, db: D1Database): Promise<{ isFinished: boolean; winner?: any }> {
  // Check if any player has won
  // Simplified implementation
  return { isFinished: false }
}

async function handleGameEnd(roomId: number, gameResult: any, db: D1Database): Promise<void> {
  try {
    // Update room status to finished
    await db.prepare(
      'UPDATE game_rooms SET status = "finished" WHERE id = ?'
    ).bind(roomId).run()

    // Award points to winner and deduct from losers
    // Implementation would depend on specific game rules

    // Broadcast game end
    await broadcastToRoom(roomId, {
      type: 'game_end',
      data: gameResult
    })

  } catch (error) {
    console.error('Handle game end error:', error)
  }
}

async function processBotTurn(roomId: number, db: D1Database): Promise<void> {
  // Process bot AI moves
  // This would implement the bot AI logic
  try {
    // Get current turn player
    const gameState = await db.prepare(
      'SELECT * FROM game_states WHERE room_id = ?'
    ).bind(roomId).first() as any

    if (!gameState) return

    const players = await db.prepare(
      'SELECT * FROM room_players WHERE room_id = ? ORDER BY position'
    ).bind(roomId).all() as any

    const currentPlayer = players.results?.[gameState.current_turn]
    if (currentPlayer?.is_bot) {
      // Simulate bot thinking time
      setTimeout(async () => {
        // Execute bot move
        const botMove = generateBotMove(currentPlayer)
        if (botMove) {
          await applyMove(roomId, botMove, db)
          
          const updatedGameState = await getGameState(roomId, db)
          await broadcastToRoom(roomId, {
            type: 'bot_move',
            data: {
              player: currentPlayer.username,
              move: botMove,
              gameState: updatedGameState
            }
          })
        }
      }, 1000 + Math.random() * 2000) // Bot reaction time
    }
  } catch (error) {
    console.error('Process bot turn error:', error)
  }
}

function generateBotMove(botPlayer: any): any {
  // Generate a bot move based on difficulty and strategy
  // Simplified implementation
  return {
    type: 'draw',
    playerId: botPlayer.id
  }
}