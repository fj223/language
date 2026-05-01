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
  const payload: ErrorResponse = { ok: false, error }
  res.status(status).json(payload)
}

