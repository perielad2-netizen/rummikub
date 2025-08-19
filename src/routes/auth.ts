import { Hono } from 'hono'
import { hashPassword, comparePassword, generateToken, requireAuth } from '../utils/auth'
import type { User, AuthRequest, LoginRequest, ApiResponse } from '../types'

type Bindings = {
  DB: D1Database
}

export const authRoutes = new Hono<{ Bindings: Bindings }>()

// Register new user
authRoutes.post('/register', async (c) => {
  try {
    const body: AuthRequest = await c.req.json()
    const { username, phone, password, points = 400 } = body

    // Validate input
    if (!username || !phone || !password) {
      return c.json<ApiResponse>({
        success: false,
        error: 'שם משתמש, טלפון וסיסמה נדרשים'
      }, 400)
    }

    if (password.length < 4) {
      return c.json<ApiResponse>({
        success: false,
        error: 'הסיסמה חייבת להיות באורך של לפחות 4 תווים'
      }, 400)
    }

    if (points < 100 || points > 1000) {
      return c.json<ApiResponse>({
        success: false,
        error: 'מספר הנקודות חייב להיות בין 100 ל-1000'
      }, 400)
    }

    // Validate phone number (Israeli format)
    const phoneRegex = /^05\d{8}$/
    if (!phoneRegex.test(phone.replace(/[-\s]/g, ''))) {
      return c.json<ApiResponse>({
        success: false,
        error: 'מספר הטלפון לא תקין. השתמש בפורמט: 05xxxxxxxx'
      }, 400)
    }

    // Check if username already exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE username = ?'
    ).bind(username).first()

    if (existingUser) {
      return c.json<ApiResponse>({
        success: false,
        error: 'שם המשתמש כבר קיים במערכת'
      }, 409)
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password)
    
    const result = await c.env.DB.prepare(
      'INSERT INTO users (username, phone, password, points) VALUES (?, ?, ?, ?)'
    ).bind(username, phone, hashedPassword, points).run()

    if (!result.success) {
      throw new Error('Failed to create user')
    }

    // TODO: Send WhatsApp notification (webhook simulation)
    console.log('WhatsApp notification:', {
      type: 'new_registration',
      username,
      phone,
      points,
      timestamp: new Date().toISOString()
    })

    return c.json<ApiResponse>({
      success: true,
      message: 'ההרשמה בוצעה בהצלחה. ממתין לאישור מנהל',
      data: { username, points }
    })

  } catch (error) {
    console.error('Registration error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'שגיאה במהלך ההרשמה'
    }, 500)
  }
})

// Login user
authRoutes.post('/login', async (c) => {
  try {
    const body: LoginRequest = await c.req.json()
    const { username, password } = body

    if (!username || !password) {
      return c.json<ApiResponse>({
        success: false,
        error: 'שם משתמש וסיסמה נדרשים'
      }, 400)
    }

    // Find user
    const user = await c.env.DB.prepare(
      'SELECT id, username, password, points, approved, is_admin FROM users WHERE username = ?'
    ).bind(username).first() as any

    if (!user) {
      return c.json<ApiResponse>({
        success: false,
        error: 'שם משתמש או סיסמה לא נכונים'
      }, 401)
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password)
    if (!isValidPassword) {
      return c.json<ApiResponse>({
        success: false,
        error: 'שם משתמש או סיסמה לא נכונים'
      }, 401)
    }

    // Check if user is approved
    if (!user.approved && !user.is_admin) {
      return c.json<ApiResponse>({
        success: false,
        error: 'החשבון שלך עדיין לא אושר על ידי המנהל'
      }, 403)
    }

    // Generate JWT token
    const token = await generateToken(user.id, user.username, user.is_admin)

    return c.json<ApiResponse>({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          points: user.points,
          approved: user.approved,
          is_admin: user.is_admin
        }
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'שגיאה במהלך ההתחברות'
    }, 500)
  }
})

// Get current user profile
authRoutes.get('/profile', async (c) => {
  try {
    const authUser = await requireAuth(c.req.header('Authorization'))
    if (!authUser) {
      return c.json<ApiResponse>({
        success: false,
        error: 'נדרש אישור זהות'
      }, 401)
    }

    // Get user details
    const user = await c.env.DB.prepare(
      'SELECT id, username, phone, points, approved, is_admin, created_at FROM users WHERE id = ?'
    ).bind(authUser.userId).first() as any

    if (!user) {
      return c.json<ApiResponse>({
        success: false,
        error: 'משתמש לא נמצא'
      }, 404)
    }

    return c.json<ApiResponse>({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        points: user.points,
        approved: user.approved,
        is_admin: user.is_admin,
        created_at: user.created_at
      }
    })

  } catch (error) {
    console.error('Profile error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'שגיאה בקבלת פרופיל המשתמש'
    }, 500)
  }
})

// Verify token endpoint
authRoutes.post('/verify', async (c) => {
  try {
    const authUser = await requireAuth(c.req.header('Authorization'))
    if (!authUser) {
      return c.json<ApiResponse>({
        success: false,
        error: 'טוקן לא תקין'
      }, 401)
    }

    return c.json<ApiResponse>({
      success: true,
      data: {
        userId: authUser.userId,
        username: authUser.username,
        isAdmin: authUser.isAdmin
      }
    })

  } catch (error) {
    console.error('Token verification error:', error)
    return c.json<ApiResponse>({
      success: false,
      error: 'שגיאה באימות הטוקן'
    }, 500)
  }
})