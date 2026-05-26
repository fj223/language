import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-xinyanedu'

export interface StudentJwtPayload {
  studentId: string
  email: string
  name: string
}

declare global {
  namespace Express {
    interface Request {
      student?: StudentJwtPayload
    }
  }
}

function extractBearer(req: Request): string | null {
  const header = req.headers.authorization
  if (!header) return null
  const parts = header.split(' ')
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') return parts[1]
  return parts[0] // bare token fallback
}

/**
 * 可选认证：如果请求携带有效 JWT 则解析挂载到 req.student，
 * 不携带或无效也不会拦截请求。
 */
export function optionalStudentAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractBearer(req)
  if (!token) return next()

  try {
    req.student = jwt.verify(token, JWT_SECRET) as StudentJwtPayload
  } catch {
    // token 无效，静默忽略
  }
  next()
}

/**
 * 强制认证：未携带有效 JWT 时返回 401。
 */
export function requireStudentAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractBearer(req)
  if (!token) {
    res.status(401).json({ ok: false, error: '请先登录' })
    return
  }

  try {
    req.student = jwt.verify(token, JWT_SECRET) as StudentJwtPayload
    next()
  } catch {
    res.status(401).json({ ok: false, error: '登录已过期，请重新登录' })
  }
}
