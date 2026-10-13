import { computed, ref } from 'vue'
import { getAdminMe, loginAdmin, type AdminInfo, type AdminPermission } from '@/api/admin'

const TOKEN_KEY = 'ADMIN_SESSION_TOKEN'
const SESSION_KEY = 'ADMIN_SESSION'

function readAdmin(): AdminInfo | null {
  try {
    const value = localStorage.getItem(SESSION_KEY)
    return value ? JSON.parse(value) as AdminInfo : null
  } catch {
    return null
  }
}

const admin = ref<AdminInfo | null>(readAdmin())

export function useAdminAuth() {
  const isLoggedIn = computed(() => Boolean(admin.value && localStorage.getItem(TOKEN_KEY)))
  const can = (permission: AdminPermission) => Boolean(admin.value?.permissions.includes(permission))

  async function login(input: { email: string; password: string }) {
    const result = await loginAdmin(input)
    localStorage.setItem(TOKEN_KEY, result.token)
    localStorage.setItem(SESSION_KEY, JSON.stringify(result.admin))
    admin.value = result.admin
    return result.admin
  }

  async function restoreSession() {
    if (!localStorage.getItem(TOKEN_KEY)) return false
    try {
      const current = await getAdminMe()
      localStorage.setItem(SESSION_KEY, JSON.stringify(current))
      admin.value = current
      return true
    } catch {
      logout()
      return false
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(SESSION_KEY)
    admin.value = null
  }

  return { admin, isLoggedIn, can, login, restoreSession, logout }
}
