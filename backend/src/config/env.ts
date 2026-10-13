type EnvSpec = {
  PORT: string
  NODE_ENV: string
  DATABASE_URL: string
  CORS_ORIGIN: string
  ADMIN_JWT_SECRET: string
  ADMIN_BOOTSTRAP_EMAIL: string
  ADMIN_BOOTSTRAP_PASSWORD: string
  ADMIN_BOOTSTRAP_NAME: string
  JWT_SECRET: string
  AI_API_KEY: string
  AI_ENABLED: string
  OPENAI_API_KEY: string
  AI_BASE_URL: string
  AI_MODEL: string
  EDU_DATA_PROVIDER: string
  EDU_API_BASE_URL: string
  EDU_API_KEY: string
  EDU_API_TIMEOUT_MS: string
  EDU_API_RETRY_COUNT: string
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
  const isProduction = (process.env.NODE_ENV || 'development') === 'production'
  const educationProvider = (process.env.EDU_DATA_PROVIDER || 'mock').trim().toLowerCase()

  if (educationProvider !== 'mock' && educationProvider !== 'external') {
    throw new Error('EDU_DATA_PROVIDER must be "mock" or "external"')
  }
  process.env.EDU_DATA_PROVIDER = educationProvider

  if (educationProvider === 'external' && !process.env.EDU_API_BASE_URL?.trim()) {
    throw new Error('Missing required env: EDU_API_BASE_URL')
  }

  const educationTimeout = Number(process.env.EDU_API_TIMEOUT_MS || '8000')
  if (!Number.isFinite(educationTimeout) || educationTimeout <= 0) {
    throw new Error('EDU_API_TIMEOUT_MS must be a positive number')
  }

  const educationRetryCount = Number(process.env.EDU_API_RETRY_COUNT || '1')
  if (!Number.isInteger(educationRetryCount) || educationRetryCount < 0 || educationRetryCount > 3) {
    throw new Error('EDU_API_RETRY_COUNT must be an integer between 0 and 3')
  }

  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret || !jwtSecret.trim()) {
    if (!isProduction) {
      process.env.JWT_SECRET = 'dev-jwt-secret-xinyanedu'
    } else {
      throw new Error('Missing required env: JWT_SECRET')
    }
  }

  if (isProduction) {
    if (educationProvider === 'mock') {
      console.warn('[config] education data provider is mock; portal data is for demonstration only')
    }
    if (process.env.ADMIN_BOOTSTRAP_PASSWORD?.startsWith('change-me')) {
      console.warn('[config] ADMIN_BOOTSTRAP_PASSWORD is using an insecure placeholder')
    }
    if (process.env.JWT_SECRET?.startsWith('change-me')) {
      console.warn('[config] JWT_SECRET is using an insecure placeholder')
    }
  }
}
