import type { RequestHandler } from 'express'
import { sendError } from '../lib/apiResponse.js'

function extractToken(authHeader: string) {
  const parts = authHeader.split(' ').filter(Boolean)
  if (parts.length === 2 && (parts[0] ?? '').toLowerCase() === 'bearer') return parts[1] ?? ''
  return authHeader
}

export const requireAdmin: RequestHandler = (req, res, next) => {
  const expected = process.env.ADMIN_TOKEN || ''
  if (!expected) {
    sendError(res, 'Server misconfigured: missing ADMIN_TOKEN', 500)
    return
  }

  const headerValue =
    (typeof req.headers['x-admin-token'] === 'string' && req.headers['x-admin-token']) ||
    (typeof req.headers.authorization === 'string' && req.headers.authorization) ||
    ''

  const token = headerValue ? extractToken(headerValue) : ''
  if (!token || token !== expected) {
    sendError(res, 'Unauthorized', 401)
    return
  }

  next()
}
