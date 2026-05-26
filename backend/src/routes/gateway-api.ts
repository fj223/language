/**
 * 语言培训学校门户 — Gateway API
 *
 * 挂载路径：/api/gateway
 *
 * 当前阶段使用静态 Mock 数据，为前端提供稳定的数据契约。
 * 支持 /courses 的 language 和 q 内存过滤，演示筛选逻辑。
 */

import { Router } from 'express'
import type { Request, Response } from 'express'
import { sendOk } from '../lib/apiResponse.js'

const router = Router()

// ============================================================
// 类型定义
// ============================================================

interface GatewayCourse {
  id: string
  title: string
  level: string | null
  schedule: string | null
  teacher: string | null
  language: string
  coverUrl: string | null
}

interface TimetableEntry {
  dayOfWeek: number   // 1=周一 … 7=周日
  courseName: string
  startTime: string   // "HH:mm"
  endTime: string     // "HH:mm"
  location: string
}

interface GradeEntry {
  courseName: string
  semester: string
  grade: number | null  // null 表示未评定
  attendanceRate: number // 0–100
}

// ============================================================
// Mock 数据
// ============================================================

const MOCK_COURSES: GatewayCourse[] = [
  // ── 英语 ──────────────────────────────────────────────────
  {
    id: 'c001',
    title: '雅思 7 分冲刺班',
    level: 'C1',
    schedule: '周一/周三/周五 19:00–21:00',
    teacher: '张晓明老师',
    language: '英语',
    coverUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&q=80',
  },
  {
    id: 'c002',
    title: '商务英语精英课',
    level: 'B2',
    schedule: '周二/周四 07:30–09:00',
    teacher: '李雯老师',
    language: '英语',
    coverUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80',
  },
  {
    id: 'c003',
    title: '英语口语纠音强化',
    level: 'B1',
    schedule: '周六 10:00–12:00',
    teacher: 'David Chen 老师',
    language: '英语',
    coverUrl: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600&q=80',
  },
  {
    id: 'c004',
    title: '英语零基础入门',
    level: 'A1',
    schedule: '周六/周日 09:00–11:00',
    teacher: '王芳老师',
    language: '英语',
    coverUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80',
  },
  {
    id: 'c005',
    title: '英语写作进阶 C1',
    level: 'C1',
    schedule: '周二/周四 18:00–20:00',
    teacher: '陈博士',
    language: '英语',
    coverUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80',
  },
  // ── 俄语 ──────────────────────────────────────────────────
  {
    id: 'c006',
    title: '俄语零基础入门',
    level: 'A1',
    schedule: '周六 10:00–12:00',
    teacher: '伊万·彼得罗夫老师',
    language: '俄语',
    coverUrl: 'https://images.unsplash.com/photo-1513326738677-b964603b136d?w=600&q=80',
  },
  {
    id: 'c007',
    title: 'ТРКИ 等级考试精讲',
    level: 'B2',
    schedule: '周三/周日 14:00–16:30',
    teacher: '娜塔莎·伊万诺娃老师',
    language: '俄语',
    coverUrl: 'https://images.unsplash.com/photo-1547448415-e9f5b28e570d?w=600&q=80',
  },
  {
    id: 'c008',
    title: '俄罗斯文学与文化',
    level: 'C1',
    schedule: '周五 19:00–21:00',
    teacher: '叶卡捷琳娜老师',
    language: '俄语',
    coverUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80',
  },
  // ── 法语 ──────────────────────────────────────────────────
  {
    id: 'c009',
    title: '浪漫法语入门 A1',
    level: 'A1',
    schedule: '周五 19:00–21:00',
    teacher: '玛丽·杜邦老师',
    language: '法语',
    coverUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
  },
  {
    id: 'c010',
    title: 'TEF 法语等级备考',
    level: 'B2',
    schedule: '周三/周六 14:00–16:00',
    teacher: '皮埃尔·马丁老师',
    language: '法语',
    coverUrl: 'https://images.unsplash.com/photo-1431274172761-fcdab704a114?w=600&q=80',
  },
  {
    id: 'c011',
    title: '法语商务沟通 B1',
    level: 'B1',
    schedule: '周二/周四 19:00–21:00',
    teacher: '索菲·勒布朗老师',
    language: '法语',
    coverUrl: 'https://images.unsplash.com/photo-1520106212299-d99c443e4568?w=600&q=80',
  },
  // ── 日语 ──────────────────────────────────────────────────
  {
    id: 'c012',
    title: '日语 N5 零基础入门',
    level: 'A1',
    schedule: '周二/周四 19:00–21:00',
    teacher: '田中健一老师',
    language: '日语',
    coverUrl: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80',
  },
  {
    id: 'c013',
    title: '日语 N3 强化冲刺',
    level: 'B1',
    schedule: '周二/周五 20:00–22:00',
    teacher: '佐藤美咲老师',
    language: '日语',
    coverUrl: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600&q=80',
  },
  {
    id: 'c014',
    title: '日语 N1 精英班',
    level: 'C1',
    schedule: '周六/周日 09:00–12:00',
    teacher: '山田太郎老师',
    language: '日语',
    coverUrl: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=600&q=80',
  },
  // ── 德语 ──────────────────────────────────────────────────
  {
    id: 'c015',
    title: '德语 A1 入门基础',
    level: 'A1',
    schedule: '周三/周六 10:00–12:00',
    teacher: '汉斯·穆勒老师',
    language: '德语',
    coverUrl: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=600&q=80',
  },
  {
    id: 'c016',
    title: '德语 B2 考级冲刺',
    level: 'B2',
    schedule: '周一/周四 18:30–20:30',
    teacher: '安娜·施密特老师',
    language: '德语',
    coverUrl: 'https://images.unsplash.com/photo-1449452198679-05c7fd30f416?w=600&q=80',
  },
  // ── 西班牙语 ──────────────────────────────────────────────
  {
    id: 'c017',
    title: '西班牙语 A2 日常会话',
    level: 'A2',
    schedule: '周二/周五 19:00–21:00',
    teacher: '卡洛斯·罗德里格斯老师',
    language: '西班牙语',
    coverUrl: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80',
  },
  {
    id: 'c018',
    title: '西班牙语 DELE B1 备考',
    level: 'B1',
    schedule: '周六/周日 14:00–16:00',
    teacher: '伊莎贝尔·加西亚老师',
    language: '西班牙语',
    coverUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  },
  // ── 韩语 ──────────────────────────────────────────────────
  {
    id: 'c019',
    title: '韩语 TOPIK I 入门',
    level: 'A2',
    schedule: '周三/周六 19:00–21:00',
    teacher: '金智恩老师',
    language: '韩语',
    coverUrl: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=600&q=80',
  },
  {
    id: 'c020',
    title: '韩语 TOPIK II 进阶',
    level: 'B2',
    schedule: '周一/周四 19:30–21:30',
    teacher: '朴敏俊老师',
    language: '韩语',
    coverUrl: 'https://images.unsplash.com/photo-1583394293214-0b3b3b3b3b3b?w=600&q=80',
  },
]

const MOCK_TIMETABLE: TimetableEntry[] = [
  { dayOfWeek: 1, courseName: '英语口语 B2', startTime: '19:00', endTime: '21:00', location: '3号楼 301教室' },
  { dayOfWeek: 2, courseName: '日语 N3 强化', startTime: '20:00', endTime: '22:00', location: '1号楼 102教室' },
  { dayOfWeek: 3, courseName: '英语口语 B2', startTime: '19:00', endTime: '21:00', location: '3号楼 301教室' },
  { dayOfWeek: 5, courseName: '法语入门 A1', startTime: '19:00', endTime: '21:00', location: '2号楼 205教室' },
  { dayOfWeek: 5, courseName: '日语 N3 强化', startTime: '20:00', endTime: '22:00', location: '1号楼 102教室' },
  { dayOfWeek: 6, courseName: '法语进阶 B1', startTime: '14:00', endTime: '16:00', location: '2号楼 201教室' },
]

const MOCK_GRADES: GradeEntry[] = [
  { courseName: '英语口语 B2', semester: '2025春', grade: 88, attendanceRate: 95 },
  { courseName: '法语入门 A1', semester: '2025春', grade: null, attendanceRate: 80 },
  { courseName: '日语 N3 强化', semester: '2024秋', grade: 76, attendanceRate: 88 },
  { courseName: '俄语入门 A1', semester: '2024秋', grade: 92, attendanceRate: 100 },
]

// ============================================================
// GET /api/gateway/courses
// 支持 language 和 q 查询参数的内存过滤
// ============================================================
router.get('/courses', (_req: Request, res: Response) => {
  const { language, q } = _req.query

  let result = [...MOCK_COURSES]

  if (typeof language === 'string' && language.trim()) {
    result = result.filter((c) => c.language === language.trim())
  }

  if (typeof q === 'string' && q.trim()) {
    const keyword = q.trim().toLowerCase()
    result = result.filter(
      (c) =>
        c.title.toLowerCase().includes(keyword) ||
        (c.teacher && c.teacher.toLowerCase().includes(keyword)),
    )
  }

  sendOk(res, result)
})

// ============================================================
// GET /api/gateway/timetable?studentId=xxx
// 当前阶段不做鉴权，忽略 studentId 直接返回 Mock 数据
// ============================================================
router.get('/timetable', (_req: Request, res: Response) => {
  sendOk(res, MOCK_TIMETABLE)
})

// ============================================================
// GET /api/gateway/grades?studentId=xxx
// 当前阶段不做鉴权，忽略 studentId 直接返回 Mock 数据
// ============================================================
router.get('/grades', (_req: Request, res: Response) => {
  sendOk(res, MOCK_GRADES)
})

export default router
