import { sign, verify } from '@tsndr/cloudflare-worker-jwt'
import bcrypt from 'bcryptjs'

const JWT_SECRET = 'rummikub-game-secret-key-2024'

export interface JWTPayload {
  userId: number
  username: string
  isAdmin: boolean
  iat: number
  exp: number
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function generateToken(userId: number, username: string, isAdmin: boolean = false): Promise<string> {
  const payload: JWTPayload = {
    userId,
    username,
    isAdmin,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  }
  
  return await sign(payload, JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const isValid = await verify(token, JWT_SECRET)
    if (!isValid) return null
    
    // Extract payload manually since cloudflare-worker-jwt doesn't have decode
    const payload = JSON.parse(atob(token.split('.')[1]))
    
    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }
    
    return payload as JWTPayload
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

export async function requireAuth(authHeader: string | undefined): Promise<JWTPayload | null> {
  const token = extractToken(authHeader)
  if (!token) return null
  
  return await verifyToken(token)
}