import { Router } from 'express'
import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../db/prisma.js'
import { sendError, sendOk } from '../lib/apiResponse.js'
import { requireStudentAuth, type StudentJwtPayload } from '../middleware/studentAuth.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-xinyanedu'
const JWT_EXPIRES_IN = '7d'

function signToken(payload: StudentJwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

// ============================================================
// POST /api/register
// ============================================================
router.post('/register', async (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!email) { sendError(res, '邮箱不能为空', 400); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { sendError(res, '邮箱格式不正确', 400); return }
    if (!name) { sendError(res, '用户名不能为空', 400); return }
    if (name.length < 2 || name.length > 50) { sendError(res, '用户名需要2-50个字符', 400); return }
    if (!password || password.length < 6) { sendError(res, '密码至少需要6位字符', 400); return }

    const existing = await prisma.student.findUnique({ where: { email }, select: { id: true } })
    if (existing) { sendError(res, '该邮箱已被注册', 409); return }

    const passwordHash = await bcrypt.hash(password, 10)

    const student = await prisma.student.create({
      data: { email, name, passwordHash },
      select: { id: true, email: true, name: true },
    })

    const token = signToken({ studentId: student.id, email: student.email, name: student.name })

    sendOk(res, {
      token,
      student: { id: student.id, email: student.email, name: student.name },
    }, 201)
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : '注册失败', 500)
  }
})

// ============================================================
// POST /api/login
// ============================================================
router.post('/login', async (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!email) { sendError(res, '请输入邮箱', 400); return }
    if (!password) { sendError(res, '请输入密码', 400); return }

    const student = await prisma.student.findUnique({ where: { email } })
    if (!student) { sendError(res, '邮箱或密码错误', 401); return }

    const valid = await bcrypt.compare(password, student.passwordHash)
    if (!valid) { sendError(res, '邮箱或密码错误', 401); return }

    const token = signToken({ studentId: student.id, email: student.email, name: student.name })

    sendOk(res, {
      token,
      student: { id: student.id, email: student.email, name: student.name },
    })
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : '登录失败', 500)
  }
})

// ============================================================
// GET /api/me — 获取当前登录用户信息
// ============================================================
router.get('/me', requireStudentAuth, async (req: Request, res: Response) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.student!.studentId },
      select: { id: true, email: true, name: true, createdAt: true },
    })
    if (!student) { sendError(res, '用户不存在', 404); return }
    sendOk(res, student)
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Unknown error', 500)
  }
})

export default router
