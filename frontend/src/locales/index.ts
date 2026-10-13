import { createI18n } from 'vue-i18n'
import zh from './zh'
import ru from './ru'
import en from './en'

export const SUPPORTED_LOCALES = ['zh', 'en', 'ru'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

const LOCALE_STORAGE_KEY = 'OPENEDU_LOCALE'
const HTML_LANG: Record<AppLocale, string> = {
  zh: 'zh-CN',
  en: 'en',
  ru: 'ru',
}
const PAGE_TITLE: Record<AppLocale, string> = {
  zh: 'OpenEdu 新言教育',
  en: 'OpenEdu Learning Platform',
  ru: 'Образовательная платформа OpenEdu',
}

export function normalizeLocale(value: unknown): AppLocale | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase().replace('_', '-')
  if (normalized === 'zh' || normalized.startsWith('zh-')) return 'zh'
  if (normalized === 'en' || normalized.startsWith('en-')) return 'en'
  if (normalized === 'ru' || normalized.startsWith('ru-')) return 'ru'
  return null
}

export function getPreferredLocale(): AppLocale {
  if (typeof window === 'undefined') return 'zh'
  try {
    const stored = normalizeLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY))
    if (stored) return stored
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
  for (const candidate of navigator.languages ?? [navigator.language]) {
    const locale = normalizeLocale(candidate)
    if (locale) return locale
  }
  return 'zh'
}

const initialLocale = getPreferredLocale()

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: 'zh',
  missingWarn: import.meta.env.DEV,
  fallbackWarn: import.meta.env.DEV,
  messages: {
    zh,
    ru,
    en,
  },
})

export function activateLocale(locale: AppLocale, persist = true) {
  i18n.global.locale.value = locale

  if (typeof document !== 'undefined') {
    document.documentElement.lang = HTML_LANG[locale]
    document.documentElement.dir = 'ltr'
    document.title = PAGE_TITLE[locale]
  }

  if (persist && typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
    } catch {
      // The visible language still changes even if persistence is unavailable.
    }
  }
}

activateLocale(initialLocale, false)

export default i18n
