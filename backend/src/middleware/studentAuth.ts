import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface StudentJwtPayload {
  studentId: string
  email: string
  name: string
}

function getJwtSecret() {
  return process.env.JWT_SECRET || 'dev-jwt-secret-xinyanedu'
}

function verifyStudentToken(token: string): StudentJwtPayload {
  const payload = jwt.verify(token, getJwtSecret())
  if (
    typeof payload === 'string' ||
    typeof payload.studentId !== 'string' ||
    typeof payload.email !== 'string' ||
    typeof payload.name !== 'string'
  ) {
    throw new Error('Invalid student token payload')
  }
  return {
    studentId: payload.studentId,
    email: payload.email,
    name: payload.name,
  }
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
  if (!header || Array.isArray(header)) return null
  const [scheme = '', token] = header.split(' ')
  if (scheme.toLowerCase() === 'bearer' && token) return token
  return header
}

/**
 * 可选认证：如果请求携带有效 JWT 则解析挂载到 req.student，
 * 不携带或无效也不会拦截请求。
 */
export function optionalStudentAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractBearer(req)
  if (!token) return next()

  try {
    req.student = verifyStudentToken(token)
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
    req.student = verifyStudentToken(token)
    next()
  } catch {
    res.status(401).json({ ok: false, error: '登录已过期，请重新登录' })
  }
}
