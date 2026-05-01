import type { ErrorRequestHandler, RequestHandler } from 'express'
import { sendError } from '../lib/apiResponse.js'

export const notFoundHandler: RequestHandler = (_req, res) => {
  sendError(res, 'Not found', 404)
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const message = err instanceof Error ? err.message : 'Unknown error'
  const safeMessage = process.env.NODE_ENV === 'production' ? 'Internal server error' : message
  sendError(res, safeMessage, 500)
}

