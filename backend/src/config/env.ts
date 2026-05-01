type EnvSpec = {
  PORT: string
  NODE_ENV: string
  DATABASE_URL: string
  CORS_ORIGIN: string
  ADMIN_TOKEN: string
  AI_API_KEY: string
  OPENAI_API_KEY: string
  AI_BASE_URL: string
  AI_MODEL: string
}

export function requireEnv<K extends keyof EnvSpec>(key: K) {
  const value = process.env[key]
  if (!value || !value.trim()) {
    throw new Error(`Missing required env: ${key}`)
  }
  return value.trim()
}

export function optionalEnv<K extends keyof EnvSpec>(key: K, fallback = '') {
  const value = process.env[key]
  return value && value.trim() ? value.trim() : fallback
}

export function validateEnv() {
  requireEnv('DATABASE_URL')
  const adminToken = process.env.ADMIN_TOKEN
  if (!adminToken || !adminToken.trim()) {
    if ((process.env.NODE_ENV || 'development') !== 'production') {
      process.env.ADMIN_TOKEN = 'dev-admin-token'
    } else {
      throw new Error('Missing required env: ADMIN_TOKEN')
    }
  }
}
