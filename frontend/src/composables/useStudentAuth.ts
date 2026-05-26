/**
 * useStudentAuth — 学生身份认证 Composable
 *
 * 模块级单例 reactive state，跨组件共享登录状态。
 * 登录/注册调用后端 API，JWT token 持久化到 localStorage。
 *
 * 存储结构（localStorage）：
 *   STUDENT_TOKEN  — JWT token string
 *   STUDENT_SESSION — { studentId, name, email, loggedInAt }
 */

import { computed, ref } from 'vue'
import { loginApi, registerApi, getMeApi, type LoginInput, type RegisterInput, type StudentInfo } from '@/api/auth'

// ============================================================
// 类型
// ============================================================

export interface StudentSession {
  studentId: string
  name: string
  email: string
  loggedInAt: number
}

// ============================================================
// Storage helpers
// ============================================================

const TOKEN_KEY = 'STUDENT_TOKEN'
const SESSION_KEY = 'STUDENT_SESSION'

function readSession(): StudentSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StudentSession>
    if (typeof parsed.studentId === 'string' && parsed.studentId.trim()) {
      return parsed as StudentSession
    }
    return null
  } catch {
    return null
  }
}

function persistSession(student: StudentInfo) {
  const s: StudentSession = {
    studentId: student.id,
    name: student.name,
    email: student.email,
    loggedInAt: Date.now(),
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(s))
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(SESSION_KEY)
}

// ============================================================
// 模块级单例 state
// ============================================================

const _session = ref<StudentSession | null>(readSession())

// ============================================================
// Composable
// ============================================================

export function useStudentAuth() {
  const session = _session

  const isLoggedIn = computed(() => session.value !== null)
  const studentId = computed(() => session.value?.studentId ?? null)
  const studentName = computed(() => session.value?.name ?? null)

  /**
   * 登录：调用后端 API，存储 token 和 session
   */
  async function login(input: LoginInput): Promise<StudentInfo> {
    const result = await loginApi(input)
    localStorage.setItem(TOKEN_KEY, result.token)
    persistSession(result.student)
    session.value = readSession()
    return result.student
  }

  /**
   * 注册：调用后端 API，存储 token 和 session
   */
  async function register(input: RegisterInput): Promise<StudentInfo> {
    const result = await registerApi(input)
    localStorage.setItem(TOKEN_KEY, result.token)
    persistSession(result.student)
    session.value = readSession()
    return result.student
  }

  /**
   * 尝试从 localStorage 中恢复 token 并验证有效性
   */
  async function restoreSession(): Promise<boolean> {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return false

    try {
      const me = await getMeApi()
      persistSession(me)
      session.value = readSession()
      return true
    } catch {
      clearSession()
      session.value = null
      return false
    }
  }

  /** 登出 */
  function logout() {
    clearSession()
    session.value = null
  }

  return { session, isLoggedIn, studentId, studentName, login, register, restoreSession, logout }
}
