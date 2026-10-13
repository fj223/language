import { Router } from 'express'
import { EnrollmentStatus } from '@prisma/client'
import { prisma } from '../db/prisma.js'
import { sendError, sendOk } from '../lib/apiResponse.js'
import { requireStudentAuth } from '../middleware/studentAuth.js'
import { getEducationCourses } from '../services/educationDataService.js'
import {
  canCancelEnrollment,
  canSubmitEnrollment,
} from '../services/enrollmentWorkflow.js'

const router = Router()

router.use('/favorites', requireStudentAuth)
router.use('/reminders', requireStudentAuth)
router.use('/enrollments', requireStudentAuth)

router.get('/favorites', async (req, res) => {
  const favorites = await prisma.courseFavorite.findMany({
    where: { studentId: req.student!.studentId },
    orderBy: { createdAt: 'desc' },
  })
  const locale = typeof req.query.locale === 'string' ? req.query.locale : undefined
  const courses = await getEducationCourses(locale ? { locale } : {})
  const courseMap = new Map(courses.data.map((course) => [course.id, course]))
  sendOk(res, favorites.map((favorite) => {
    const course = courseMap.get(favorite.courseId)
    return course
      ? {
          ...favorite,
          title: course.title,
          language: course.languageLabel ?? course.language,
          teacher: course.teacher,
          schedule: course.schedule,
        }
      : favorite
  }))
})

router.post('/favorites/:courseId', async (req, res) => {
  try {
    const courseId = typeof req.params.courseId === 'string' ? req.params.courseId : ''
    const result = await getEducationCourses()
    const course = result.data.find((item) => item.id === courseId)
    if (!course) {
      sendError(res, '课程不存在或已下架', 404)
      return
    }
    const favorite = await prisma.courseFavorite.upsert({
      where: { studentId_courseId: { studentId: req.student!.studentId, courseId } },
      create: {
        studentId: req.student!.studentId,
        courseId,
        title: course.title,
        language: course.language,
        level: course.level,
        teacher: course.teacher,
        schedule: course.schedule,
        coverUrl: course.coverUrl,
      },
      update: {
        title: course.title,
        language: course.language,
        level: course.level,
        teacher: course.teacher,
        schedule: course.schedule,
        coverUrl: course.coverUrl,
      },
    })
    sendOk(res, favorite, 201)
  } catch (error) {
    sendError(res, error instanceof Error ? error.message : '收藏失败', 500)
  }
})

router.delete('/favorites/:courseId', async (req, res) => {
  const courseId = typeof req.params.courseId === 'string' ? req.params.courseId : ''
  await prisma.courseFavorite.deleteMany({
    where: { studentId: req.student!.studentId, courseId },
  })
  sendOk(res, { courseId })
})

router.get('/reminders', async (req, res) => {
  const reminders = await prisma.learningReminder.findMany({
    where: { studentId: req.student!.studentId },
    orderBy: [{ completedAt: 'asc' }, { remindAt: 'asc' }],
  })
  sendOk(res, reminders)
})

router.post('/reminders', async (req, res) => {
  const input = parseReminderInput(req.body)
  if (!input.ok) {
    sendError(res, input.error, 400)
    return
  }
  const reminder = await prisma.learningReminder.create({
    data: { studentId: req.student!.studentId, ...input.data },
  })
  sendOk(res, reminder, 201)
})

router.patch('/reminders/:id', async (req, res) => {
  const id = typeof req.params.id === 'string' ? req.params.id : ''
  const existing = await prisma.learningReminder.findFirst({
    where: { id, studentId: req.student!.studentId },
  })
  if (!existing) {
    sendError(res, '提醒不存在', 404)
    return
  }

  const body = (req.body ?? {}) as Record<string, unknown>
  if (typeof body.completed === 'boolean' && Object.keys(body).length === 1) {
    const updated = await prisma.learningReminder.update({
      where: { id },
      data: { completedAt: body.completed ? new Date() : null },
    })
    sendOk(res, updated)
    return
  }

  const input = parseReminderInput(body)
  if (!input.ok) {
    sendError(res, input.error, 400)
    return
  }
  const updated = await prisma.learningReminder.update({
    where: { id },
    data: { ...input.data, completedAt: body.completed === true ? new Date() : existing.completedAt },
  })
  sendOk(res, updated)
})

router.delete('/reminders/:id', async (req, res) => {
  const id = typeof req.params.id === 'string' ? req.params.id : ''
  const result = await prisma.learningReminder.deleteMany({
    where: { id, studentId: req.student!.studentId },
  })
  if (!result.count) {
    sendError(res, '提醒不存在', 404)
    return
  }
  sendOk(res, { id })
})

router.get('/enrollments', async (req, res) => {
  const applications = await prisma.enrollmentApplication.findMany({
    where: { studentId: req.student!.studentId },
    orderBy: { updatedAt: 'desc' },
  })
  const locale = typeof req.query.locale === 'string' ? req.query.locale : undefined
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

router.post('/enrollments/:courseId', async (req, res) => {
  try {
    const courseId = typeof req.params.courseId === 'string' ? req.params.courseId : ''
    const body = (req.body ?? {}) as Record<string, unknown>
    const studentNote = typeof body.studentNote === 'string' ? body.studentNote.trim() || null : null
    if (studentNote && studentNote.length > 500) {
      sendError(res, '报名备注不能超过500字', 400)
      return
    }
    const integrated = await getEducationCourses()
    const course = integrated.data.find((item) => item.id === courseId)
    if (!course) {
      sendError(res, '课程不存在或已下架', 404)
      return
    }
    const existing = await prisma.enrollmentApplication.findUnique({
      where: { studentId_courseId: { studentId: req.student!.studentId, courseId } },
    })
    const submission = canSubmitEnrollment(existing?.status)
    if (!submission.allowed) {
      sendError(res, submission.error, 409)
      return
    }
    const snapshot = {
      courseTitle: course.title,
      language: course.languageLabel ?? course.language,
      level: course.level,
      teacher: course.teacher,
      schedule: course.schedule,
      studentNote,
      status: EnrollmentStatus.PENDING,
      adminNote: null,
      reviewedBy: null,
      reviewedAt: null,
    }
    const application = existing
      ? await prisma.enrollmentApplication.update({ where: { id: existing.id }, data: snapshot })
      : await prisma.enrollmentApplication.create({
          data: {
            studentId: req.student!.studentId,
            courseId,
            ...snapshot,
          },
        })
    sendOk(res, application, existing ? 200 : 201)
  } catch (error) {
    sendError(res, error instanceof Error ? error.message : '提交报名失败', 500)
  }
})

router.patch('/enrollments/:id/cancel', async (req, res) => {
  const id = typeof req.params.id === 'string' ? req.params.id : ''
  const application = await prisma.enrollmentApplication.findFirst({
    where: { id, studentId: req.student!.studentId },
  })
  if (!application) {
    sendError(res, '报名申请不存在', 404)
    return
  }
  const cancellation = canCancelEnrollment(application.status)
  if (!cancellation.allowed) {
    sendError(res, cancellation.error, 409)
    return
  }
  const updated = await prisma.enrollmentApplication.update({
    where: { id },
    data: {
      status: EnrollmentStatus.CANCELLED,
      reviewedBy: null,
      reviewedAt: new Date(),
    },
  })
  sendOk(res, updated)
})

function parseReminderInput(value: unknown): {
  ok: true
  data: { title: string; note: string | null; courseId: string | null; remindAt: Date }
} | { ok: false; error: string } {
  const body = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const note = typeof body.note === 'string' ? body.note.trim() || null : null
  const courseId = typeof body.courseId === 'string' ? body.courseId.trim() || null : null
  const remindAt = typeof body.remindAt === 'string' ? new Date(body.remindAt) : new Date(Number.NaN)
  if (!title || title.length > 160) return { ok: false, error: '提醒标题不能为空且不能超过160字' }
  if (note && note.length > 500) return { ok: false, error: '备注不能超过500字' }
  if (Number.isNaN(remindAt.getTime())) return { ok: false, error: '提醒时间格式不正确' }
  const oneYearLater = Date.now() + 366 * 24 * 60 * 60 * 1000
  if (remindAt.getTime() < Date.now() - 60_000 || remindAt.getTime() > oneYearLater) {
    return { ok: false, error: '提醒时间需要在未来一年内' }
  }
  return { ok: true, data: { title, note, courseId, remindAt } }
}

export default router
