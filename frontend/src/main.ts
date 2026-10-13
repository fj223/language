import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import 'element-plus/dist/index.css'
import './style.css'
import App from './App.vue'
import i18n from './locales'
import { useAdminAuth } from './composables/useAdminAuth'
import { useStudentAuth } from './composables/useStudentAuth'
import { useLangStore } from './stores/useLangStore'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)

const langStore = useLangStore(pinia)
langStore.initialize()

window.addEventListener('storage', (event) => {
  if (event.key === 'OPENEDU_LOCALE') langStore.syncFromStorage(event.newValue)
})

window.addEventListener('admin-session-expired', (event) => {
  useAdminAuth().logout()
  if (router.currentRoute.value.path !== '/admin/login') {
    const reason = event instanceof CustomEvent && event.detail?.reason === 'disabled' ? 'disabled' : 'expired'
    void router.replace({ path: '/admin/login', query: { reason } })
  }
})

window.addEventListener('student-session-expired', () => {
  useStudentAuth().logout()
  if (router.currentRoute.value.path !== '/auth') {
    void router.replace({ path: '/auth', query: { reason: 'expired', redirect: router.currentRoute.value.fullPath } })
  }
})

app.mount('#app')
