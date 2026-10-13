import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { AdminRole, EnrollmentStatus } from '@prisma/client'
import { prisma } from '../db/prisma.js'
import { sendError, sendOk } from '../lib/apiResponse.js'
import {
  permissionsForRole,
  requireAdmin,
  requireAdminPermission,
  signAdminToken,
} from '../middleware/adminAuth.js'
import { authRateLimit } from '../middleware/rateLimit.js'
import { listSchoolPolicies } from '../services/schoolPolicyService.js'
import { recordAdminAudit } from '../services/adminAuditService.js'
import { getEducationCourses, getIntegrationStatus } from '../services/educationDataService.js'
import { canReviewEnrollment } from '../services/enrollmentWorkflow.js'

const router = Router()

function adminView(admin: { id: string; email: string; name: string; role: AdminRole }) {
  return {
    ...admin,
    permissions: permissionsForRole(admin.role),
  }
}

router.post('/admin/login', authRateLimit, async (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    if (!email || !password) {
      sendError(res, '请输入管理员邮箱和密码', 400)
      return
    }

    const admin = await prisma.adminUser.findUnique({ where: { email } })
    if (!admin || !admin.isActive || !(await bcrypt.compare(password, admin.passwordHash))) {
      sendError(res, '管理员邮箱或密码错误', 401)
      return
    }
    const safe = { id: admin.id, email: admin.email, name: admin.name, role: admin.role }
    sendOk(res, {
      token: signAdminToken({
        adminId: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      }),
      admin: adminView(safe),
    })
  } catch (error) {
    sendError(res, error instanceof Error ? error.message : '管理员登录失败', 500)
  }
})

router.get('/admin/me', requireAdmin, (req, res) => {
  sendOk(res, adminView({
    id: req.admin!.adminId,
    email: req.admin!.email,
    name: req.admin!.name,
    role: req.admin!.role,
  }))
})

router.get('/admin/integration/status', ...requireAdminPermission('course.read'), (_req, res) => {
  sendOk(res, getIntegrationStatus())
})

router.post('/admin/change-password', requireAdmin, async (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : ''
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''
    if (!currentPassword || newPassword.length < 10 || newPassword.length > 128) {
      sendError(res, '请输入当前密码，新密码需要10-128位字符', 400)
      return
    }
    const admin = await prisma.adminUser.findUnique({ where: { id: req.admin!.adminId } })
    if (!admin || !(await bcrypt.compare(currentPassword, admin.passwordHash))) {
      sendError(res, '当前密码不正确', 400)
      return
    }
    if (await bcrypt.compare(newPassword, admin.passwordHash)) {
      sendError(res, '新密码不能与当前密码相同', 400)
      return
    }
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 12) },
    })
    await recordAdminAudit({
      actor: req.admin!,
      action: 'ADMIN_PASSWORD_CHANGED',
      targetType: 'AdminUser',
      targetId: admin.id,
      summary: '管理员修改了自己的登录密码',
    })
    sendOk(res, { changed: true })
  } catch (error) {
    sendError(res, error instanceof Error ? error.message : '修改密码失败', 500)
  }
})

router.get('/admin/users', ...requireAdminPermission('admin.manage'), async (_req, res) => {
  const admins = await prisma.adminUser.findMany({
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: 'asc' },
  })
  sendOk(res, admins.map((admin) => ({ ...admin, permissions: permissionsForRole(admin.role) })))
})

router.post('/admin/users', ...requireAdminPermission('admin.manage'), async (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const role = typeof body.role === 'string' && Object.values(AdminRole).includes(body.role as AdminRole)
      ? body.role as AdminRole
      : null
    if (!email || !name || password.length < 10 || !role) {
      sendError(res, '请提供有效的姓名、邮箱、角色和至少10位密码', 400)
      return
    }
    const admin = await prisma.adminUser.create({
      data: { email, name, passwordHash: await bcrypt.hash(password, 12), role },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    })
    await recordAdminAudit({
      actor: req.admin!,
      action: 'ADMIN_USER_CREATED',
      targetType: 'AdminUser',
      targetId: admin.id,
      summary: `创建管理员账号 ${admin.email}`,
      metadata: { role: admin.role },
    })
    sendOk(res, { ...admin, permissions: permissionsForRole(admin.role) }, 201)
  } catch (error) {
    sendError(res, error instanceof Error ? error.message : '创建管理员失败', 400)
  }
})

router.patch('/admin/users/:id', ...requireAdminPermission('admin.manage'), async (req, res) => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : ''
    const existing = await prisma.adminUser.findUnique({ where: { id } })
    if (!existing) {
      sendError(res, '管理员不存在', 404)
      return
    }
    const body = (req.body ?? {}) as Record<string, unknown>
    const name = typeof body.name === 'string' ? body.name.trim() : existing.name
    const role = typeof body.role === 'string' && Object.values(AdminRole).includes(body.role as AdminRole)
      ? body.role as AdminRole
      : existing.role
    const isActive = typeof body.isActive === 'boolean' ? body.isActive : existing.isActive
    if (!name || name.length > 100) {
      sendError(res, '管理员姓名不能为空且不能超过100字', 400)
      return
    }
    if (id === req.admin!.adminId && (role !== existing.role || !isActive)) {
      sendError(res, '不能修改自己的角色或停用自己的账号', 400)
      return
    }
    if (
      existing.role === AdminRole.SUPER_ADMIN &&
      existing.isActive &&
      (role !== AdminRole.SUPER_ADMIN || !isActive)
    ) {
      const activeSuperAdmins = await prisma.adminUser.count({
        where: { role: AdminRole.SUPER_ADMIN, isActive: true },
      })
      if (activeSuperAdmins <= 1) {
        sendError(res, '必须至少保留一名启用状态的超级管理员', 409)
        return
      }
    }
    const updated = await prisma.adminUser.update({
      where: { id },
      data: { name, role, isActive },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true, updatedAt: true },
    })
    await recordAdminAudit({
      actor: req.admin!,
      action: 'ADMIN_USER_UPDATED',
      targetType: 'AdminUser',
      targetId: updated.id,
      summary: `更新管理员账号 ${updated.email}`,
      metadata: {
        before: { name: existing.name, role: existing.role, isActive: existing.isActive },
        after: { name: updated.name, role: updated.role, isActive: updated.isActive },
      },
    })
    sendOk(res, { ...updated, permissions: permissionsForRole(updated.role) })
  } catch (error) {
    sendError(res, error instanceof Error ? error.message : '更新管理员失败', 400)
  }
})

router.post('/admin/users/:id/reset-password', ...requireAdminPermission('admin.manage'), async (req, res) => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : ''
    const body = (req.body ?? {}) as Record<string, unknown>
    const password = typeof body.password === 'string' ? body.password : ''
    if (password.length < 10 || password.length > 128) {
      sendError(res, '新密码需要10-128位字符', 400)
      return
    }
    const updated = await prisma.adminUser.update({
      where: { id },
      data: { passwordHash: await bcrypt.hash(password, 12) },
      select: { id: true, email: true },
    })
    await recordAdminAudit({
      actor: req.admin!,
      action: 'ADMIN_PASSWORD_RESET',
      targetType: 'AdminUser',
      targetId: updated.id,
      summary: `重置管理员账号 ${updated.email} 的密码`,
    })
    sendOk(res, { id: updated.id, email: updated.email, changed: true })
  } catch {
    sendError(res, '管理员不存在或密码重置失败', 404)
  }
})

router.get('/admin/enrollments', ...requireAdminPermission('enrollment.read'), async (req, res) => {
  const requestedStatus = typeof req.query.status === 'string' ? req.query.status : ''
  const locale = typeof req.query.locale === 'string' ? req.query.locale : undefined
  const status = Object.values(EnrollmentStatus).includes(requestedStatus as EnrollmentStatus)
    ? requestedStatus as EnrollmentStatus
    : null
  const applications = await prisma.enrollmentApplication.findMany({
    ...(status ? { where: { status } } : {}),
    include: { student: { select: { id: true, name: true, email: true } } },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  })
  const courses = await getEducationCourses(locale ? { locale } : {})
  const courseMap = new Map(courses.data.map((course) => [course.id, course]))
  sendOk(res, applications.map((application) => {
    const course = courseMap.get(application.courseId)
    return course
      ? {
          ...application,
          courseTitle: course.title,
          language: course.languageLabel ?? course.language,
          teacher: course.teacher,
          schedule: course.schedule,
        }
      : application
  }))
})

router.patch('/admin/enrollments/:id', ...requireAdminPermission('enrollment.write'), async (req, res) => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : ''
    const body = (req.body ?? {}) as Record<string, unknown>
    const status = body.status === EnrollmentStatus.APPROVED || body.status === EnrollmentStatus.REJECTED
      ? body.status
      : null
    const adminNote = typeof body.adminNote === 'string' ? body.adminNote.trim() || null : null
    if (!status) {
      sendError(res, '审核状态只能是 APPROVED 或 REJECTED', 400)
      return
    }
    if (adminNote && adminNote.length > 500) {
      sendError(res, '审核备注不能超过500字', 400)
      return
    }
    const existing = await prisma.enrollmentApplication.findUnique({ where: { id } })
    if (!existing) {
      sendError(res, '报名申请不存在', 404)
      return
    }
    const review = canReviewEnrollment(existing.status)
    if (!review.allowed) {
      sendError(res, review.error, 409)
      return
    }
    const updated = await prisma.enrollmentApplication.update({
      where: { id },
      data: {
        status,
        adminNote,
        reviewedBy: req.admin!.adminId,
        reviewedAt: new Date(),
      },
      include: { student: { select: { id: true, name: true, email: true } } },
    })
    await recordAdminAudit({
      actor: req.admin!,
      action: 'ENROLLMENT_REVIEWED',
      targetType: 'EnrollmentApplication',
      targetId: updated.id,
      summary: `${status === EnrollmentStatus.APPROVED ? '通过' : '拒绝'}学生 ${updated.student.email} 的课程报名申请`,
      metadata: { status, courseId: updated.courseId, courseTitle: updated.courseTitle },
    })
    sendOk(res, updated)
  } catch (error) {
    sendError(res, error instanceof Error ? error.message : '审核报名失败', 400)
  }
})

router.get('/admin/policies', ...requireAdminPermission('policy.read'), async (_req, res) => {
  sendOk(res, await listSchoolPolicies(true))
})

router.get('/admin/audit-logs', ...requireAdminPermission('admin.manage'), async (req, res) => {
  const requestedLimit = typeof req.query.limit === 'string' ? Number.parseInt(req.query.limit, 10) : 50
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 50
  const logs = await prisma.adminAuditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      actorEmail: true,
      actorName: true,
      actorRole: true,
      action: true,
      targetType: true,
      targetId: true,
      summary: true,
      metadata: true,
      createdAt: true,
    },
  })
  sendOk(res, logs)
})

router.post('/admin/policies', ...requireAdminPermission('policy.write'), async (req, res) => {
  try {
    const input = parsePolicyInput(req.body)
    if (!input.ok) {
      sendError(res, input.error, 400)
      return
    }
    const policy = await prisma.schoolPolicy.create({ data: { ...input.data, version: 1 } })
    await recordAdminAudit({
      actor: req.admin!,
      action: 'POLICY_CREATED',
      targetType: 'SchoolPolicy',
      targetId: policy.id,
      summary: `创建政策“${policy.title}”`,
      metadata: { isPublished: policy.isPublished, version: policy.version },
    })
    sendOk(res, { ...policy, keywords: input.data.keywords }, 201)
  } catch (error) {
    sendError(res, error instanceof Error ? error.message : '创建政策失败', 400)
  }
})

router.put('/admin/policies/:id', ...requireAdminPermission('policy.write'), async (req, res) => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : ''
    const input = parsePolicyInput(req.body, id)
    if (!input.ok) {
      sendError(res, input.error, 400)
      return
    }
    const policy = await prisma.schoolPolicy.update({
      where: { id },
      data: { ...input.data, version: { increment: 1 } },
    })
    await recordAdminAudit({
      actor: req.admin!,
      action: 'POLICY_UPDATED',
      targetType: 'SchoolPolicy',
      targetId: policy.id,
      summary: `更新政策“${policy.title}”至 v${policy.version}`,
      metadata: { isPublished: policy.isPublished, version: policy.version },
    })
    sendOk(res, { ...policy, keywords: input.data.keywords })
  } catch (error) {
    sendError(res, error instanceof Error ? error.message : '更新政策失败', 400)
  }
})

router.delete('/admin/policies/:id', ...requireAdminPermission('policy.write'), async (req, res) => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : ''
    const policy = await prisma.schoolPolicy.update({
      where: { id },
      data: { isPublished: false, version: { increment: 1 } },
    })
    await recordAdminAudit({
      actor: req.admin!,
      action: 'POLICY_UNPUBLISHED',
      targetType: 'SchoolPolicy',
      targetId: policy.id,
      summary: `停止发布政策“${policy.title}”`,
      metadata: { version: policy.version },
    })
    sendOk(res, { id: policy.id, isPublished: policy.isPublished, version: policy.version })
  } catch {
    sendError(res, '政策不存在', 404)
  }
})

function parsePolicyInput(
  value: unknown,
  routeId = '',
): { ok: true; data: {
  id: string
  title: string
  keywords: string[]
  summary: string
  guidance: string
  owner: string
  isPublished: boolean
} } | { ok: false; error: string } {
  const body = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const id = routeId || (typeof body.id === 'string' ? body.id.trim().toLowerCase() : '')
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const summary = typeof body.summary === 'string' ? body.summary.trim() : ''
  const guidance = typeof body.guidance === 'string' ? body.guidance.trim() : ''
  const owner = typeof body.owner === 'string' ? body.owner.trim() : ''
  const keywords = Array.isArray(body.keywords)
    ? [...new Set(body.keywords.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean))]
    : []
  const isPublished = body.isPublished !== false
  if (!/^[a-z0-9-]{2,64}$/.test(id)) return { ok: false, error: '政策标识仅支持小写字母、数字和连字符' }
  if (!title || title.length > 200) return { ok: false, error: '政策标题不能为空且不能超过200字' }
  if (!summary || !guidance || !owner) return { ok: false, error: '摘要、办事指引和负责部门均不能为空' }
  if (!keywords.length) return { ok: false, error: '请至少填写一个关键词' }
  return { ok: true, data: { id, title, keywords, summary, guidance, owner, isPublished } }
}

export default router
