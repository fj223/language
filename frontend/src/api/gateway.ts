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
  coverUrl: string | null
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

type ApiOk<T> = { ok: true; data: T }

// ============================================================
// API 函数
// ============================================================

/**
 * 获取课程列表
 * GET /api/gateway/courses?language=xxx&q=xxx
 */
export async function getGatewayCourses(query: CourseQuery = {}): Promise<GatewayCourse[]> {
  // 过滤掉空字符串，避免传递 language= 这样的无效参数
  const params: Record<string, string> = {}
  if (query.language) params.language = query.language
  if (query.q?.trim()) params.q = query.q.trim()

  const res = await http.get<ApiOk<GatewayCourse[]>>('/api/gateway/courses', { params })
  return res.data.data
}

/**
 * 获取学生课表
 * GET /api/gateway/timetable?studentId=stu_001
 */
export async function getTimetable(studentId: string): Promise<TimetableEntry[]> {
  const res = await http.get<ApiOk<TimetableEntry[]>>('/api/gateway/timetable', {
    params: { studentId },
  })
  return res.data.data
}

/**
 * 获取学生成绩与出勤
 * GET /api/gateway/grades?studentId=stu_001
 */
export async function getGrades(studentId: string): Promise<GradeEntry[]> {
  const res = await http.get<ApiOk<GradeEntry[]>>('/api/gateway/grades', {
    params: { studentId },
  })
  return res.data.data
}
