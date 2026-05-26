/**
 * 模拟教务系统 Legacy API
 *
 * 模拟一个老旧教务系统对外暴露的 RESTful 接口。
 * 数据全部使用 Mock 静态数据，真实项目中可替换为数据库查询。
 *
 * 挂载路径：/api/legacy
 */

import { Router } from 'express'
import type { Request, Response } from 'express'

const router = Router()

// ============================================================
// Mock 数据
// ============================================================

const MOCK_COURSES = [
  // ── 英语 ──────────────────────────────────────────────────
  {
    id: 'legacy-001',
    title: '英语雅思冲刺班',
    language: 'en',
    teacher: '张晓明',
    lessons: 48,
    price: 2980,
    level: 'C1',
    description: '针对雅思 7 分目标的强化冲刺课程，涵盖听说读写四项技能，配套真题精讲。',
  },
  {
    id: 'legacy-002',
    title: '商务英语精英课',
    language: 'en',
    teacher: '李雯',
    lessons: 32,
    price: 2400,
    level: 'B2',
    description: '面向职场人士的商务英语课程，涵盖商务写作、谈判用语与跨文化沟通。',
  },
  {
    id: 'legacy-003',
    title: '英语零基础入门',
    language: 'en',
    teacher: '王芳',
    lessons: 24,
    price: 1280,
    level: 'A1',
    description: '从字母发音开始，系统建立英语基础，适合完全零基础学员。',
  },
  // ── 俄语 ──────────────────────────────────────────────────
  {
    id: 'legacy-004',
    title: 'TRKI考级冲刺强化',
    language: 'ru',
    teacher: '娜塔莎·伊万诺娃',
    lessons: 36,
    price: 3200,
    level: 'B2',
    description: '对应俄语国家等级考试 TRKI 第二级别，系统强化语法、词汇与口语表达。',
  },
  {
    id: 'legacy-005',
    title: '俄语零基础入门',
    language: 'ru',
    teacher: '伊万·彼得罗夫',
    lessons: 24,
    price: 1580,
    level: 'A1',
    description: '从西里尔字母开始，循序渐进掌握俄语基础发音与日常会话。',
  },
  // ── 法语 ──────────────────────────────────────────────────
  {
    id: 'legacy-006',
    title: '浪漫法语入门',
    language: 'fr',
    teacher: '玛丽·杜邦',
    lessons: 24,
    price: 1680,
    level: 'A1',
    description: '零基础法语入门，覆盖发音规则、基础词汇与日常会话场景，感受法语魅力。',
  },
  {
    id: 'legacy-007',
    title: 'TEF 法语等级备考',
    language: 'fr',
    teacher: '皮埃尔·马丁',
    lessons: 30,
    price: 2600,
    level: 'B2',
    description: '针对 TEF 法语等级考试的系统备考课程，强化听力、阅读与写作。',
  },
  // ── 日语 ──────────────────────────────────────────────────
  {
    id: 'legacy-008',
    title: '日语 N3 精讲',
    language: 'ja',
    teacher: '田中健一',
    lessons: 40,
    price: 2200,
    level: 'B1',
    description: '系统讲解 JLPT N3 考试所需语法、词汇与阅读理解技巧。',
  },
  {
    id: 'legacy-009',
    title: '日语 N1 精英班',
    language: 'ja',
    teacher: '山田太郎',
    lessons: 48,
    price: 3800,
    level: 'C1',
    description: '面向 N1 冲刺的高阶课程，深度解析语法难点与文字词汇。',
  },
  // ── 德语 ──────────────────────────────────────────────────
  {
    id: 'legacy-010',
    title: '德语 A1 入门基础',
    language: 'de',
    teacher: '汉斯·穆勒',
    lessons: 24,
    price: 1780,
    level: 'A1',
    description: '德语零基础入门，掌握基础发音、常用词汇与简单句型结构。',
  },
  // ── 西班牙语 ──────────────────────────────────────────────
  {
    id: 'legacy-011',
    title: '西班牙语 A2 日常会话',
    language: 'es',
    teacher: '卡洛斯·罗德里格斯',
    lessons: 28,
    price: 1900,
    level: 'A2',
    description: '欧标 A2 级别西班牙语，强化日常交流与基础语法结构。',
  },
  // ── 韩语 ──────────────────────────────────────────────────
  {
    id: 'legacy-012',
    title: '韩语 TOPIK I 入门',
    language: 'ko',
    teacher: '金智恩',
    lessons: 24,
    price: 1480,
    level: 'A2',
    description: '韩语入门课程，覆盖谚文拼读、基础词汇与 TOPIK I 考试技巧。',
  },
]

// 学生课表（按 studentId 区分）
const MOCK_TIMETABLE: Record<string, object[]> = {
  stu_001: [
    { day: 'Monday',    time: '09:00-10:30', courseId: 'legacy-001', title: '英语雅思冲刺',       teacher: '王晓明',          room: 'A101' },
    { day: 'Wednesday', time: '14:00-15:30', courseId: 'legacy-003', title: '法语基础',           teacher: '李佳慧',          room: 'B203' },
    { day: 'Friday',    time: '10:00-11:30', courseId: 'legacy-001', title: '英语雅思冲刺（复习）', teacher: '王晓明',          room: 'A101' },
  ],
  stu_002: [
    { day: 'Tuesday',   time: '09:00-10:30', courseId: 'legacy-002', title: '俄语TRKI-2考级强化', teacher: '娜塔莎·伊万诺娃', room: 'C305' },
    { day: 'Thursday',  time: '13:00-14:30', courseId: 'legacy-004', title: '日语 N3 精讲',       teacher: '田中健一',        room: 'B102' },
  ],
}

// 学生历史成绩
const MOCK_GRADES: Record<string, object[]> = {
  stu_001: [
    { courseId: 'legacy-003', title: '法语基础',   term: '2025-Spring', score: 88, grade: 'B+', status: 'passed' },
    { courseId: 'legacy-001', title: '英语雅思冲刺', term: '2025-Fall',   score: 92, grade: 'A',  status: 'passed' },
  ],
  stu_002: [
    { courseId: 'legacy-002', title: '俄语TRKI-2考级强化', term: '2025-Spring', score: 76, grade: 'C+', status: 'passed' },
    { courseId: 'legacy-004', title: '日语 N3 精讲',       term: '2025-Fall',   score: 61, grade: 'D',  status: 'passed' },
    { courseId: 'legacy-005', title: '西班牙语 A2',        term: '2024-Fall',   score: 45, grade: 'F',  status: 'failed' },
  ],
}

// ============================================================
// GET /api/legacy/courses
// 返回语言课程列表
// ============================================================
router.get('/courses', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: MOCK_COURSES,
    total: MOCK_COURSES.length,
  })
})

// ============================================================
// GET /api/legacy/timetable?studentId=xxx
// 返回某学生的本周课表
// ============================================================
router.get('/timetable', (req: Request, res: Response) => {
  const studentId = typeof req.query.studentId === 'string' ? req.query.studentId.trim() : ''

  if (!studentId) {
    res.status(400).json({ success: false, message: 'studentId is required' })
    return
  }

  const timetable = MOCK_TIMETABLE[studentId] ?? []

  res.json({
    success: true,
    studentId,
    weekOf: getCurrentWeekRange(),
    data: timetable,
  })
})

// ============================================================
// GET /api/legacy/grades?studentId=xxx
// 返回某学生的历史成绩
// ============================================================
router.get('/grades', (req: Request, res: Response) => {
  const studentId = typeof req.query.studentId === 'string' ? req.query.studentId.trim() : ''

  if (!studentId) {
    res.status(400).json({ success: false, message: 'studentId is required' })
    return
  }

  const grades = MOCK_GRADES[studentId] ?? []

  res.json({
    success: true,
    studentId,
    data: grades,
    total: grades.length,
  })
})

// ============================================================
// 工具函数
// ============================================================

/** 返回本周的起止日期字符串（周一 ~ 周日） */
function getCurrentWeekRange(): string {
  const now = new Date()
  const day = now.getDay() === 0 ? 7 : now.getDay() // 将周日从 0 改为 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - (day - 1))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  return `${fmt(monday)} ~ ${fmt(sunday)}`
}

export default router
