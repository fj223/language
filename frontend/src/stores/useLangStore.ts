import { defineStore } from 'pinia'
import { ref } from 'vue'
import { i18n } from '@/locales'

export type Lang = 'zh' | 'ru' | 'en'

export const useLangStore = defineStore('lang', () => {
  const lang = ref<Lang>('zh')

  function setLang(l: Lang) {
    lang.value = l
    i18n.global.locale.value = l
  }

  return { lang, setLang }
})
