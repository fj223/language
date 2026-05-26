import { createI18n } from 'vue-i18n'
import zh from './zh'
import ru from './ru'
import en from './en'

export const i18n = createI18n({
  legacy: false,       // Composition API mode
  locale: 'zh',
  fallbackLocale: 'zh',
  messages: {
    zh,
    ru,
    en,
  },
})

export default i18n
