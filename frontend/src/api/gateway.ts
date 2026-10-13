import { http } from './http'

// ============================================================
// 类型定义
// ============================================================

export type GatewayCourse = {
  id: string
  title: string
  level: string | null       // 如 "A1", "B2", "C1"；null 时显示"级别待定"
  schedule: string | null    // 如 "周一/周三 19:00–21:00"；null 时显示"时间待定"
  teacher: string | null     // 如 "张老师"；null 时显示"教师待定"
  language: string           // "英语" | "俄语" | "法语" | "日语"
  languageLabel?: string
  coverUrl: string | null
  description?: string | null
  managedLocally?: boolean
  resources?: Array<{
    id: string
    resourceType: 'local' | 'youtube' | 'bilibili' | 'external_link'
    sourceUrl: string
    title: string | null
  }>
}

export type CourseQuery = {
  language?: string          // 语种筛选，空字符串或 undefined 表示"全部"
  q?: string                 // 关键词搜索
}

export type TimetableEntry = {
  dayOfWeek: number          // 1=周一, 2=周二, ..., 7=周日
  courseName: string
  startTime: string          // "HH:mm" 格式
  endTime: string            // "HH:mm" 格式
  location: string
}

export type GradeEntry = {
  courseName: string
  semester: string           // 如 "2025春"
  grade: number | null       // null 表示未评定
  attendanceRate: number     // 0–100 的整数
}

export type IntegrationStatus = {
  provider: 'mock' | 'external'
  label: string
  configured: boolean
  checkedAt: string
  courseCache: {
    state: 'empty' | 'fresh' | 'stale' | 'expired'
    itemCount: number
    fetchedAt: string | null
    expiresAt: string | null
  }
  telemetry: {
    requestCount: number
    attemptCount: number
    successCount: number
    failureCount: number
    retryCount: number
    lastSuccessAt: string | null
    lastFailureAt: string | null
    lastError: string | null
    lastLatencyMs: number | null
  }
}

type ApiOk<T> = { ok: true; data: T }

// ============================================================
// API 函数
// ============================================================

/**
 * 获取课程列表
 * GET /api/gateway/courses?language=xxx&q=xxx
 */
export async function getGatewayCourses(query: CourseQuery = {}, locale?: string): Promise<GatewayCourse[]> {
  // 过滤掉空字符串，避免传递 language= 这样的无效参数
  const params: Record<string, string> = {}
  if (query.language) params.language = query.language
  if (query.q?.trim()) params.q = query.q.trim()
  if (locale) params.locale = locale

  const res = await http.get<ApiOk<GatewayCourse[]>>('/api/gateway/courses', { params })
  return res.data.data
}

/**
 * 获取学生课表
 * GET /api/gateway/timetable
 * 学生身份由 JWT 确定，不向服务器传递 studentId。
 */
export async function getTimetable(locale?: string): Promise<TimetableEntry[]> {
  const res = await http.get<ApiOk<TimetableEntry[]>>('/api/gateway/timetable', {
    params: locale ? { locale } : {},
  })
  return res.data.data
}

/**
 * 获取学生成绩与出勤
 * GET /api/gateway/grades
 * 学生身份由 JWT 确定，不向服务器传递 studentId。
 */
export async function getGrades(locale?: string): Promise<GradeEntry[]> {
  const res = await http.get<ApiOk<GradeEntry[]>>('/api/gateway/grades', {
    params: locale ? { locale } : {},
  })
  return res.data.data
}

export async function getGatewayCourse(courseId: string, locale?: string): Promise<GatewayCourse> {
  const res = await http.get<ApiOk<GatewayCourse>>(`/api/gateway/courses/${courseId}`, {
    params: locale ? { locale } : {},
  })
  return res.data.data
}

export async function getIntegrationStatus(): Promise<IntegrationStatus> {
  const res = await http.get<ApiOk<IntegrationStatus>>('/api/gateway/status')
  return res.data.data
}
