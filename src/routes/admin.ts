import { Hono } from 'hono'
import { hashPassword, comparePassword, generateToken, requireAuth } from '../utils/auth'
import type { ApiResponse } from '../types'

type Bindings = {
  DB: D1Database
}

export const adminRoutes = new Hono<{ Bindings: Bindings }>()

// Admin login
adminRoutes.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    const { email, password } = body

    if (!email || !password) {
      return c.json<ApiResponse>({
        success: false,
        error: 'אימייל וסיסמה נדרשים'
      }, 400)
    }

    // Find admin
    const admin = await c.env.DB.prepare(
      'SELECT id, email, password FROM admins WHERE email = ?'
    ).bind(email).first() as any

    if (!admin) {
      return c.json<ApiResponse>({
        success: false,
        error: 'אימייל או סיסמה לא נכונים'
      }, 401)
    }

    // Verify password
    const isValidPassword = await comparePassword(password, admin.password)
    if (!isValidPassword) {
      return c.json<ApiResponse>({
        success: false,
        error: 'אימייל או סיסמה לא נכונים'
      }, 401)
    }

    // Generate JWT token for admin
    const token = await generateToken(admin.id, admin.email, true)

    return c.json<ApiResponse>({
      success: true,
      data: {
        token,
        admin: {
          id: admin.id,
          email: admin.email
        }
      }
    })

  } catch (error) {
    console.error('Admin login error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'שגיאה במהלך ההתחברות'
    }, 500)
  }
})

// Get all users (pending approval)
adminRoutes.get('/users', async (c) => {
  try {
    const authUser = await requireAuth(c.req.header('Authorization'))
    if (!authUser || !authUser.isAdmin) {
      return c.json<ApiResponse>({
        success: false,
        error: 'נדרשות הרשאות מנהל'
      }, 403)
    }

    const users = await c.env.DB.prepare(`
      SELECT id, username, phone, points, approved, created_at
      FROM users
      WHERE is_admin = 0
      ORDER BY created_at DESC
    `).all() as any

    return c.json<ApiResponse>({
      success: true,
      data: users.results || []
    })

  } catch (error) {
    console.error('Get users error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'שגיאה בקבלת רשימת המשתמשים'
    }, 500)
  }
})

// Approve/disapprove user
adminRoutes.post('/users/:userId/approve', async (c) => {
  try {
    const authUser = await requireAuth(c.req.header('Authorization'))
    if (!authUser || !authUser.isAdmin) {
      return c.json<ApiResponse>({
        success: false,
        error: 'נדרשות הרשאות מנהל'
      }, 403)
    }

    const userId = c.req.param('userId')
    const body = await c.req.json()
    const { approved } = body

    if (typeof approved !== 'boolean') {
      return c.json<ApiResponse>({
        success: false,
        error: 'סטטוס האישור חייב להיות true או false'
      }, 400)
    }

    // Update user approval status
    const result = await c.env.DB.prepare(
      'UPDATE users SET approved = ? WHERE id = ? AND is_admin = 0'
    ).bind(approved ? 1 : 0, userId).run()

    if (!result.success) {
      return c.json<ApiResponse>({
        success: false,
        error: 'שגיאה בעדכון סטטוס המשתמש'
      }, 500)
    }

    // Get updated user info
    const user = await c.env.DB.prepare(
      'SELECT username, phone FROM users WHERE id = ?'
    ).bind(userId).first() as any

    return c.json<ApiResponse>({
      success: true,
      data: {
        message: approved ? 'המשתמש אושר בהצלחה' : 'אישור המשתמש בוטל',
        user: user
      }
    })

  } catch (error) {
    console.error('Approve user error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'שגיאה באישור המשתמש'
    }, 500)
  }
})

// Update user points
adminRoutes.post('/users/:userId/points', async (c) => {
  try {
    const authUser = await requireAuth(c.req.header('Authorization'))
    if (!authUser || !authUser.isAdmin) {
      return c.json<ApiResponse>({
        success: false,
        error: 'נדרשות הרשאות מנהל'
      }, 403)
    }

    const userId = c.req.param('userId')
    const body = await c.req.json()
    const { points, operation } = body // operation: 'set', 'add', 'subtract'

    if (typeof points !== 'number' || points < 0) {
      return c.json<ApiResponse>({
        success: false,
        error: 'מספר הנקודות חייב להיות מספר חיובי'
      }, 400)
    }

    let query = ''
    let queryParams: any[] = []

    switch (operation) {
      case 'set':
        query = 'UPDATE users SET points = ? WHERE id = ? AND is_admin = 0'
        queryParams = [points, userId]
        break
      case 'add':
        query = 'UPDATE users SET points = points + ? WHERE id = ? AND is_admin = 0'
        queryParams = [points, userId]
        break
      case 'subtract':
        query = 'UPDATE users SET points = MAX(0, points - ?) WHERE id = ? AND is_admin = 0'
        queryParams = [points, userId]
        break
      default:
        return c.json<ApiResponse>({
          success: false,
          error: 'פעולה לא תקינה. השתמש ב: set, add, או subtract'
        }, 400)
    }

    const result = await c.env.DB.prepare(query).bind(...queryParams).run()

    if (!result.success) {
      return c.json<ApiResponse>({
        success: false,
        error: 'שגיאה בעדכון נקודות המשתמש'
      }, 500)
    }

    // Get updated user info
    const user = await c.env.DB.prepare(
      'SELECT username, points FROM users WHERE id = ?'
    ).bind(userId).first() as any

    return c.json<ApiResponse>({
      success: true,
      data: {
        message: 'נקודות המשתמש עודכנו בהצלחה',
        user: user
      }
    })

  } catch (error) {
    console.error('Update user points error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'שגיאה בעדכון נקודות המשתמש'
    }, 500)
  }
})

// Get game statistics
adminRoutes.get('/stats', async (c) => {
  try {
    const authUser = await requireAuth(c.req.header('Authorization'))
    if (!authUser || !authUser.isAdmin) {
      return c.json<ApiResponse>({
        success: false,
        error: 'נדרשות הרשאות מנהל'
      }, 403)
    }

    // Get total users
    const totalUsers = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM users WHERE is_admin = 0'
    ).first() as any

    // Get approved users
    const approvedUsers = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM users WHERE approved = 1 AND is_admin = 0'
    ).first() as any

    // Get pending users
    const pendingUsers = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM users WHERE approved = 0 AND is_admin = 0'
    ).first() as any

    // Get active rooms
    const activeRooms = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM game_rooms WHERE status IN ("waiting", "playing")'
    ).first() as any

    // Get completed games today
    const completedToday = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM game_rooms WHERE status = "finished" AND DATE(created_at) = DATE("now")'
    ).first() as any

    // Get most popular game type
    const gameTypes = await c.env.DB.prepare(`
      SELECT game_type, COUNT(*) as count
      FROM game_rooms
      GROUP BY game_type
      ORDER BY count DESC
    `).all() as any

    return c.json<ApiResponse>({
      success: true,
      data: {
        totalUsers: totalUsers?.count || 0,
        approvedUsers: approvedUsers?.count || 0,
        pendingUsers: pendingUsers?.count || 0,
        activeRooms: activeRooms?.count || 0,
        completedToday: completedToday?.count || 0,
        gameTypes: gameTypes.results || []
      }
    })

  } catch (error) {
    console.error('Get stats error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'שגיאה בקבלת הסטטיסטיקות'
    }, 500)
  }
})

// Get recent game activities
adminRoutes.get('/activities', async (c) => {
  try {
    const authUser = await requireAuth(c.req.header('Authorization'))
    if (!authUser || !authUser.isAdmin) {
      return c.json<ApiResponse>({
        success: false,
        error: 'נדרשות הרשאות מנהל'
      }, 403)
    }

    const activities = await c.env.DB.prepare(`
      SELECT 
        gr.id,
        gr.room_key,
        gr.game_type,
        gr.entry_points,
        gr.status,
        gr.created_at,
        u.username as owner_name,
        COUNT(rp.id) as player_count
      FROM game_rooms gr
      JOIN users u ON gr.owner_id = u.id
      LEFT JOIN room_players rp ON gr.id = rp.room_id
      GROUP BY gr.id
      ORDER BY gr.created_at DESC
      LIMIT 20
    `).all() as any

    return c.json<ApiResponse>({
      success: true,
      data: activities.results || []
    })

  } catch (error) {
    console.error('Get activities error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'שגיאה בקבלת הפעילויות האחרונות'
    }, 500)
  }
})