import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  activateLocale,
  getPreferredLocale,
  normalizeLocale,
  type AppLocale,
} from '@/locales'

export type Lang = AppLocale

export const useLangStore = defineStore('lang', () => {
  const lang = ref<Lang>(getPreferredLocale())

  function setLang(l: Lang) {
    lang.value = l
    activateLocale(l)
  }

  function initialize() {
    lang.value = getPreferredLocale()
    activateLocale(lang.value, false)
  }

  function syncFromStorage(value: string | null) {
    const locale = normalizeLocale(value)
    if (locale && locale !== lang.value) {
      lang.value = locale
      activateLocale(locale, false)
    }
  }

  return { lang, setLang, initialize, syncFromStorage }
})
