// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(key: string, maxRequests: number = 60, windowMs: number = 60000): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  
  if (entry.count >= maxRequests) return false
  entry.count++
  return true
}

// Anti-brute-force for login
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>()

export function checkLoginAttempt(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const entry = loginAttempts.get(ip)
  
  if (!entry) return { allowed: true }
  
  if (now < entry.lockedUntil) {
    return { allowed: false, retryAfter: Math.ceil((entry.lockedUntil - now) / 1000) }
  }
  
  if (entry.count >= 5) {
    entry.lockedUntil = now + 300000 // 5 min lockout
    return { allowed: false, retryAfter: 300 }
  }
  
  return { allowed: true }
}

export function recordLoginAttempt(ip: string, success: boolean) {
  if (success) {
    loginAttempts.delete(ip)
    return
  }
  
  const entry = loginAttempts.get(ip)
  if (!entry) {
    loginAttempts.set(ip, { count: 1, lockedUntil: 0 })
  } else {
    entry.count++
  }
}
