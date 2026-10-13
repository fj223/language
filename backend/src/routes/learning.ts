import { Router } from 'express'
import { AssignmentSubmissionStatus, Prisma } from '@prisma/client'
import { prisma } from '../db/prisma.js'
import { sendError, sendOk } from '../lib/apiResponse.js'
import { requireAdminPermission } from '../middleware/adminAuth.js'
import { requireStudentAuth } from '../middleware/studentAuth.js'
import { ensureStarterCurriculum, requireApprovedEnrollment } from '../services/learningService.js'
import { normalizeContentLocale } from '../services/contentLocalization.js'
import { localizeLearningChapters } from '../services/learningContentLocalization.js'
import { getEducationCourses } from '../services/educationDataService.js'

const router = Router()

function text(value: unknown, max = 10_000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function int(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.round(parsed))) : fallback
}

async function findChapterForCourse(chapterId: string, courseId?: string) {
  return prisma.courseChapter.findFirst({ where: { id: chapterId, ...(courseId ? { courseId } : {}) } })
}

async function isCourseArchived(courseId: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { isArchived: true } })
  return course?.isArchived === true
}

async function requireActiveManagedCourse(courseId: string) {
  return prisma.course.findFirst({ where: { id: courseId, isArchived: false } })
}

router.get('/learning/courses/:courseId/outline', async (req, res) => {
  try {
    const courseId = text(req.params.courseId, 191)
    const locale = normalizeContentLocale(req.query.locale)
    const localCourse = await prisma.course.findUnique({
      where: { id: courseId },
      select: { isArchived: true, isPublished: true },
    })
    if (localCourse?.isArchived) {
      sendError(res, '课程不存在或已下架', 404)
      return
    }
    const chapters = await prisma.courseChapter.findMany({
      where: { courseId, isPublished: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        sortOrder: true,
        lessons: {
          where: { isPublished: true },
          orderBy: { sortOrder: 'asc' },
          select: { id: true, title: true, summary: true, contentUrl: true, durationMinutes: true, sortOrder: true },
        },
        assignments: {
          where: { isPublished: true },
          orderBy: { sortOrder: 'asc' },
          select: { id: true, title: true, instructions: true, maxScore: true, sortOrder: true },
        },
        quizzes: {
          where: { isPublished: true },
          orderBy: { sortOrder: 'asc' },
          select: { id: true, title: true, description: true, passScore: true, sortOrder: true, _count: { select: { questions: true } } },
        },
      },
    })
    const summary = chapters.reduce((result, chapter) => ({
      chapterCount: result.chapterCount + 1,
      lessonCount: result.lessonCount + chapter.lessons.length,
      assignmentCount: result.assignmentCount + chapter.assignments.length,
      quizCount: result.quizCount + chapter.quizzes.length,
      durationMinutes: result.durationMinutes + chapter.lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0),
    }), { chapterCount: 0, lessonCount: 0, assignmentCount: 0, quizCount: 0, durationMinutes: 0 })
    sendOk(res, { courseId, chapters: localizeLearningChapters(chapters, locale), summary })
  } catch (error) {
    sendError(res, error instanceof Error ? error.message : '课程大纲加载失败', 500)
  }
})

router.get('/learning/courses/:courseId', requireStudentAuth, async (req, res) => {
  try {
    const courseId = text(req.params.courseId, 191)
    const studentId = req.student!.studentId
    const locale = normalizeContentLocale(req.query.locale)
    if (await isCourseArchived(courseId)) {
      sendError(res, '课程已归档，学习记录仍为你保留', 410)
      return
    }
    const enrollment = await requireApprovedEnrollment(studentId, courseId)
    if (!enrollment) {
      sendError(res, '报名通过后才能进入学习空间', 403)
      return
    }
    await ensureStarterCurriculum(courseId, enrollment.courseTitle)
    const chapters = await prisma.courseChapter.findMany({
      where: { courseId, isPublished: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        lessons: {
          where: { isPublished: true },
          orderBy: { sortOrder: 'asc' },
          include: { progress: { where: { studentId } } },
        },
        assignments: {
          where: { isPublished: true },
          orderBy: { sortOrder: 'asc' },
          include: { submissions: { where: { studentId } } },
        },
        quizzes: {
          where: { isPublished: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            questions: { orderBy: { sortOrder: 'asc' }, select: { id: true, prompt: true, options: true, sortOrder: true } },
            attempts: { where: { studentId }, orderBy: { submittedAt: 'desc' } },
          },
        },
      },
    })

    let totalUnits = 0
    let completedUnits = 0
    const safeChapters = chapters.map((chapter) => ({
      ...chapter,
      lessons: chapter.lessons.map((lesson) => {
        totalUnits += 1
        const progress = lesson.progress[0] ?? null
        if (progress?.isCompleted) completedUnits += 1
        const { progress: _progress, ...rest } = lesson
        return { ...rest, progress }
      }),
      assignments: chapter.assignments.map((assignment) => {
        totalUnits += 1
        const submission = assignment.submissions[0] ?? null
        if (submission) completedUnits += 1
        const { submissions: _submissions, ...rest } = assignment
        return { ...rest, submission }
      }),
      quizzes: chapter.quizzes.map((quiz) => {
        totalUnits += 1
        const bestScore = quiz.attempts.reduce((best, item) => Math.max(best, item.score), 0)
        const passed = quiz.attempts.some((item) => item.passed)
        if (passed) completedUnits += 1
        const latestAttempt = quiz.attempts[0] ?? null
        const { attempts: _attempts, ...rest } = quiz
        return { ...rest, latestAttempt, bestScore, passed }
      }),
    }))
    const localizedCatalog = await getEducationCourses({ locale })
    const localizedCourse = localizedCatalog.data.find((course) => course.id === courseId)
    sendOk(res, {
      course: {
        id: courseId,
        title: localizedCourse?.title ?? enrollment.courseTitle,
        language: localizedCourse?.languageLabel ?? localizedCourse?.language ?? enrollment.language,
        teacher: localizedCourse?.teacher ?? enrollment.teacher,
      },
      chapters: localizeLearningChapters(safeChapters, locale),
      summary: { totalUnits, completedUnits, progressPercent: totalUnits ? Math.round(completedUnits / totalUnits * 100) : 0 },
    })
  } catch (error) {
    sendError(res, error instanceof Error ? error.message : '学习空间加载失败', 500)
  }
})

router.patch('/learning/lessons/:lessonId/progress', requireStudentAuth, async (req, res) => {
  try {
    const lessonId = text(req.params.lessonId, 191)
    const lesson = await prisma.courseLesson.findUnique({ where: { id: lessonId }, include: { chapter: true } })
    if (!lesson || await isCourseArchived(lesson.chapter.courseId) || !await requireApprovedEnrollment(req.student!.studentId, lesson.chapter.courseId)) {
      sendError(res, '课时不存在或暂无学习权限', 404)
      return
    }
    const body = (req.body ?? {}) as Record<string, unknown>
    const completed = body.completed === true
    const progress = await prisma.lessonProgress.upsert({
      where: { studentId_lessonId: { studentId: req.student!.studentId, lessonId } },
      create: {
        studentId: req.student!.studentId,
        lessonId,
        positionSeconds: int(body.positionSeconds, 0, 0, 86400),
        isCompleted: completed,
        completedAt: completed ? new Date() : null,
      },
      update: {
        positionSeconds: int(body.positionSeconds, 0, 0, 86400),
        isCompleted: completed,
        completedAt: completed ? new Date() : null,
      },
    })
    sendOk(res, progress)
  } catch (error) {
    sendError(res, error instanceof Error ? error.message : '课时进度保存失败', 500)
  }
})

router.post('/learning/assignments/:assignmentId/submissions', requireStudentAuth, async (req, res) => {
  try {
    const assignmentId = text(req.params.assignmentId, 191)
    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId }, include: { chapter: true } })
    if (!assignment || await isCourseArchived(assignment.chapter.courseId) || !await requireApprovedEnrollment(req.student!.studentId, assignment.chapter.courseId)) {
      sendError(res, '作业不存在或暂无提交权限', 404)
      return
    }
    const content = text((req.body as Record<string, unknown> | undefined)?.content, 20_000)
    if (content.length < 10) {
      sendError(res, '作业内容至少需要10个字', 400)
      return
    }
    const submission = await prisma.assignmentSubmission.upsert({
      where: { assignmentId_studentId: { assignmentId, studentId: req.student!.studentId } },
      create: { assignmentId, studentId: req.student!.studentId, content },
      update: { content, status: AssignmentSubmissionStatus.SUBMITTED, score: null, feedback: null, gradedBy: null, gradedAt: null, submittedAt: new Date() },
    })
    sendOk(res, submission, 201)
  } catch (error) {
    sendError(res, error instanceof Error ? error.message : '作业提交失败', 500)
  }
})

router.post('/learning/quizzes/:quizId/attempts', requireStudentAuth, async (req, res) => {
  try {
    const quizId = text(req.params.quizId, 191)
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { chapter: true, questions: { orderBy: { sortOrder: 'asc' } } },
    })
    if (!quiz || await isCourseArchived(quiz.chapter.courseId) || !await requireApprovedEnrollment(req.student!.studentId, quiz.chapter.courseId)) {
      sendError(res, '测验不存在或暂无作答权限', 404)
      return
    }
    const rawAnswers = (req.body as Record<string, unknown> | undefined)?.answers
    const answers = Array.isArray(rawAnswers) ? rawAnswers.map((item) => int(item, -1, -1, 20)) : []
    if (answers.length !== quiz.questions.length) {
      sendError(res, '请完成全部题目后再提交', 400)
      return
    }
    const correctCount = quiz.questions.reduce((count, question, index) => count + (answers[index] === question.correctOption ? 1 : 0), 0)
    const score = quiz.questions.length ? Math.round(correctCount / quiz.questions.length * 100) : 0
    const attempt = await prisma.quizAttempt.create({
      data: { quizId, studentId: req.student!.studentId, answers, score, passed: score >= quiz.passScore },
    })
    sendOk(res, {
      ...attempt,
      results: quiz.questions.map((question, index) => ({
        questionId: question.id,
        correct: answers[index] === question.correctOption,
        correctOption: question.correctOption,
        explanation: question.explanation,
      })),
    }, 201)
  } catch (error) {
    sendError(res, error instanceof Error ? error.message : '测验提交失败', 500)
  }
})

router.get('/admin/learning/courses/:courseId', ...requireAdminPermission('course.read'), async (req, res) => {
  try {
    const courseId = text(req.params.courseId, 191)
    const chapters = await prisma.courseChapter.findMany({
      where: { courseId }, orderBy: { sortOrder: 'asc' },
      include: {
        lessons: { orderBy: { sortOrder: 'asc' } },
        assignments: { orderBy: { sortOrder: 'asc' }, include: { _count: { select: { submissions: true } } } },
        quizzes: { orderBy: { sortOrder: 'asc' }, include: { questions: { orderBy: { sortOrder: 'asc' } }, _count: { select: { attempts: true } } } },
      },
    })
    sendOk(res, chapters)
  } catch (error) {
    sendError(res, error instanceof Error ? error.message : '学习内容加载失败', 500)
  }
})

router.post('/admin/learning/courses/:courseId/seed', ...requireAdminPermission('course.write'), async (req, res) => {
  try {
    const courseId = text(req.params.courseId, 191)
    const course = await requireActiveManagedCourse(courseId)
    if (!course) { sendError(res, 'course not found', 404); return }
    sendOk(res, await ensureStarterCurriculum(courseId, course.title), 201)
  } catch (error) {
    sendError(res, error instanceof Error ? error.message : '初始化学习内容失败', 500)
  }
})

router.post('/admin/learning/courses/:courseId/chapters', ...requireAdminPermission('course.write'), async (req, res) => {
  const courseId = text(req.params.courseId, 191)
  if (!await requireActiveManagedCourse(courseId)) { sendError(res, 'archived course is read-only', 409); return }
  const body = (req.body ?? {}) as Record<string, unknown>
  const title = text(body.title, 200)
  if (!title) { sendError(res, '章节标题不能为空', 400); return }
  const chapter = await prisma.courseChapter.create({ data: { courseId, title, description: text(body.description) || null, sortOrder: int(body.sortOrder, 0, 0, 999) } })
  sendOk(res, chapter, 201)
})

router.patch('/admin/learning/chapters/:id', ...requireAdminPermission('course.write'), async (req, res) => {
  const id = text(req.params.id, 191)
  const current = await findChapterForCourse(id)
  if (!current || await isCourseArchived(current.courseId)) { sendError(res, 'archived course is read-only', 409); return }
  const body = (req.body ?? {}) as Record<string, unknown>
  const chapter = await prisma.courseChapter.update({ where: { id }, data: { title: text(body.title, 200), description: text(body.description) || null, isPublished: body.isPublished !== false } })
  sendOk(res, chapter)
})

router.delete('/admin/learning/chapters/:id', ...requireAdminPermission('course.write'), async (req, res) => {
  const id = text(req.params.id, 191)
  const current = await findChapterForCourse(id)
  if (!current || await isCourseArchived(current.courseId)) { sendError(res, 'archived course is read-only', 409); return }
  await prisma.courseChapter.delete({ where: { id } })
  sendOk(res, { id })
})

router.post('/admin/learning/chapters/:chapterId/lessons', ...requireAdminPermission('course.write'), async (req, res) => {
  const chapterId = text(req.params.chapterId, 191)
  const chapter = await findChapterForCourse(chapterId)
  if (!chapter) { sendError(res, '章节不存在', 404); return }
  if (await isCourseArchived(chapter.courseId)) { sendError(res, 'archived course is read-only', 409); return }
  const body = (req.body ?? {}) as Record<string, unknown>
  const title = text(body.title, 200)
  if (!title) { sendError(res, '课时标题不能为空', 400); return }
  const item = await prisma.courseLesson.create({ data: { chapterId, title, summary: text(body.summary) || null, contentUrl: text(body.contentUrl, 2048) || null, durationMinutes: int(body.durationMinutes, 15, 1, 1440), sortOrder: int(body.sortOrder, 0, 0, 999) } })
  sendOk(res, item, 201)
})

router.patch('/admin/learning/lessons/:id', ...requireAdminPermission('course.write'), async (req, res) => {
  const id = text(req.params.id, 191)
  const current = await prisma.courseLesson.findUnique({ where: { id }, include: { chapter: true } })
  if (!current || await isCourseArchived(current.chapter.courseId)) { sendError(res, 'archived course is read-only', 409); return }
  const body = (req.body ?? {}) as Record<string, unknown>
  const title = text(body.title, 200)
  if (!title) { sendError(res, '课时标题不能为空', 400); return }
  const item = await prisma.courseLesson.update({
    where: { id },
    data: {
      title,
      summary: text(body.summary) || null,
      contentUrl: text(body.contentUrl, 2048) || null,
      durationMinutes: int(body.durationMinutes, current.durationMinutes, 1, 1440),
    },
  })
  sendOk(res, item)
})

router.delete('/admin/learning/lessons/:id', ...requireAdminPermission('course.write'), async (req, res) => {
  const id = text(req.params.id, 191)
  const current = await prisma.courseLesson.findUnique({ where: { id }, include: { chapter: true } })
  if (!current || await isCourseArchived(current.chapter.courseId)) { sendError(res, 'archived course is read-only', 409); return }
  await prisma.courseLesson.delete({ where: { id } }); sendOk(res, { id })
})

router.post('/admin/learning/chapters/:chapterId/assignments', ...requireAdminPermission('course.write'), async (req, res) => {
  const chapterId = text(req.params.chapterId, 191)
  const chapter = await findChapterForCourse(chapterId)
  if (!chapter || await isCourseArchived(chapter.courseId)) { sendError(res, 'archived course is read-only', 409); return }
  const body = (req.body ?? {}) as Record<string, unknown>
  const title = text(body.title, 200); const instructions = text(body.instructions, 20_000)
  if (!title || !instructions) { sendError(res, '作业标题和要求不能为空', 400); return }
  const item = await prisma.assignment.create({ data: { chapterId, title, instructions, maxScore: int(body.maxScore, 100, 1, 1000), sortOrder: int(body.sortOrder, 0, 0, 999) } })
  sendOk(res, item, 201)
})

router.delete('/admin/learning/assignments/:id', ...requireAdminPermission('course.write'), async (req, res) => {
  const id = text(req.params.id, 191)
  const current = await prisma.assignment.findUnique({ where: { id }, include: { chapter: true } })
  if (!current || await isCourseArchived(current.chapter.courseId)) { sendError(res, 'archived course is read-only', 409); return }
  await prisma.assignment.delete({ where: { id } }); sendOk(res, { id })
})

router.post('/admin/learning/chapters/:chapterId/quizzes', ...requireAdminPermission('course.write'), async (req, res) => {
  const chapterId = text(req.params.chapterId, 191)
  const chapter = await findChapterForCourse(chapterId)
  if (!chapter || await isCourseArchived(chapter.courseId)) { sendError(res, 'archived course is read-only', 409); return }
  const body = (req.body ?? {}) as Record<string, unknown>
  const title = text(body.title, 200)
  const rawQuestions = Array.isArray(body.questions) ? body.questions : []
  const questions = rawQuestions.map((item, index) => {
    const value = item && typeof item === 'object' ? item as Record<string, unknown> : {}
    const options = Array.isArray(value.options) ? value.options.map((option) => text(option, 500)).filter(Boolean) : []
    return { prompt: text(value.prompt, 2000), options, correctOption: int(value.correctOption, 0, 0, Math.max(options.length - 1, 0)), explanation: text(value.explanation, 3000) || null, sortOrder: index }
  }).filter((item) => item.prompt && item.options.length >= 2)
  if (!title || questions.length === 0) { sendError(res, '测验标题和至少一道有效题目不能为空', 400); return }
  const item = await prisma.quiz.create({ data: { chapterId, title, description: text(body.description) || null, passScore: int(body.passScore, 60, 0, 100), questions: { create: questions as Prisma.QuizQuestionCreateWithoutQuizInput[] } }, include: { questions: true } })
  sendOk(res, item, 201)
})

router.delete('/admin/learning/quizzes/:id', ...requireAdminPermission('course.write'), async (req, res) => {
  const id = text(req.params.id, 191)
  const current = await prisma.quiz.findUnique({ where: { id }, include: { chapter: true } })
  if (!current || await isCourseArchived(current.chapter.courseId)) { sendError(res, 'archived course is read-only', 409); return }
  await prisma.quiz.delete({ where: { id } }); sendOk(res, { id })
})

router.get('/admin/learning/courses/:courseId/submissions', ...requireAdminPermission('course.read'), async (req, res) => {
  const courseId = text(req.params.courseId, 191)
  const submissions = await prisma.assignmentSubmission.findMany({
    where: { assignment: { chapter: { courseId } } },
    orderBy: { submittedAt: 'desc' },
    include: { student: { select: { id: true, name: true, email: true } }, assignment: { select: { id: true, title: true, maxScore: true } } },
  })
  sendOk(res, submissions)
})

router.patch('/admin/learning/submissions/:id/grade', ...requireAdminPermission('course.write'), async (req, res) => {
  const id = text(req.params.id, 191)
  const body = (req.body ?? {}) as Record<string, unknown>
  const current = await prisma.assignmentSubmission.findUnique({ where: { id }, include: { assignment: true } })
  if (!current) { sendError(res, '作业提交不存在', 404); return }
  const score = int(body.score, 0, 0, current.assignment.maxScore)
  const updated = await prisma.assignmentSubmission.update({ where: { id }, data: { status: AssignmentSubmissionStatus.GRADED, score, feedback: text(body.feedback, 5000) || null, gradedBy: req.admin!.adminId, gradedAt: new Date() } })
  sendOk(res, updated)
})

export default router
