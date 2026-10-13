import type { Response } from 'express'

export type OkResponse<T> = {
  ok: true
  data: T
}

export type ErrorResponse = {
  ok: false
  error: string
}

export function sendOk<T>(res: Response, data: T, status = 200) {
  const payload: OkResponse<T> = { ok: true, data }
  res.status(status).json(payload)
}

export function sendError(res: Response, error: string, status = 500) {
  if (status >= 500) {
    console.error(`[api:error] status=${status} message=${error}`)
  }
  const safeError = status >= 500 && process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : error
  const payload: ErrorResponse = { ok: false, error: safeError }
  res.status(status).json(payload)
}

