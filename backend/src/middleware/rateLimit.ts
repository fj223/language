import rateLimit from 'express-rate-limit'

export const apiRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: '请求过于频繁，请稍后再试' },
  skip: (req) => req.path === '/health' || req.path === '/ready',
})

export const authRateLimit = rateLimit({
  windowMs: 15 * 60_000,
  limit: 12,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: '登录尝试次数过多，请稍后再试' },
})

export const chatRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: 'AI 请求过于频繁，请稍后再试' },
})

