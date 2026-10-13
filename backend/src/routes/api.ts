import { Router } from 'express'
import type { Request } from 'express'
import { Prisma, VideoResourceType } from '@prisma/client'
import { prisma } from '../db/prisma.js'
import { sendError, sendOk } from '../lib/apiResponse.js'
import { serializeCourse, serializeResource } from '../lib/serializers.js'
import { requireAdminPermission } from '../middleware/adminAuth.js'
import { optionalStudentAuth, requireStudentAuth } from '../middleware/studentAuth.js'
import { chatRateLimit } from '../middleware/rateLimit.js'
import {
  handleAssistantFeedback,
  handleEnhancedChatbot as handleChatbot,
  postEnhancedIntent as postChat,
} from '../controllers/enhancedChatbotController.js'
import { getAdminCourseCatalog, getEducationCourses } from '../services/educationDataService.js'
import { recordAdminAudit } from '../services/adminAuditService.js'
import { parseCourseTranslations } from '../services/contentLocalization.js'
import { MOCK_COURSES } from '../services/mockEducationData.js'
import { findSuspiciousCourseTextField } from '../services/courseContentValidation.js'

const router = Router()

// ============================================================
// === Courses ===
// ============================================================

const RESOURCE_TYPES = new Set<VideoResourceType>([
  VideoResourceType.local,
  VideoResourceType.youtube,
  VideoResourceType.bilibili,
  VideoResourceType.external_link,
])

function parseResourceType(v: unknown): VideoResourceType | null {
  return typeof v === 'string' && RESOURCE_TYPES.has(v as VideoResourceType)
    ? (v as VideoResourceType)
    : null
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function optionalText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return null
  const text = value.trim()
  return text ? text.slice(0, maxLength) : null
}

async function courseExists(courseId: string) {
  const localCourse = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } })
  if (localCourse) return true
  const integrated = await getEducationCourses()
  return integrated.data.some((course) => course.id === courseId)
}

router.get('/admin/chatbot/feedback-summary', ...requireAdminPermission('feedback.read'), async (_req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const grouped = await prisma.chatFeedback.groupBy({
      by: ['intent', 'rating'],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    })
    const lifetimeTotal = await prisma.chatFeedback.count()
    const total = grouped.reduce((sum, row) => sum + row._count._all, 0)
    const helpful = grouped
      .filter((row) => row.rating === 'helpful')
      .reduce((sum, row) => sum + row._count._all, 0)
    const byIntentMap = new Map<string, { intent: string; total: number; helpful: number }>()
    for (const row of grouped) {
      const current = byIntentMap.get(row.intent) ?? { intent: row.intent, total: 0, helpful: 0 }
      current.total += row._count._all
      if (row.rating === 'helpful') current.helpful += row._count._all
      byIntentMap.set(row.intent, current)
    }
    const byIntent = [...byIntentMap.values()]
      .map((item) => ({
        ...item,
        helpfulRate: item.total ? Math.round((item.helpful / item.total) * 100) : null,
      }))
      .sort((a, b) => b.total - a.total)

    sendOk(res, {
      windowDays: 30,
      lifetimeTotal,
      total,
      helpful,
      unhelpful: total - helpful,
      helpfulRate: total ? Math.round((helpful / total) * 100) : null,
      byIntent,
    })
  } catch (error) {
    sendError(res, error instanceof Error ? error.message : 'Failed to load feedback summary', 500)
  }
})

// GET /courses
router.get('/courses', ...requireAdminPermission('course.read'), async (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    const resourceType = parseResourceType(req.query.resource_type)
    const archiveStatus = req.query.archive_status === 'archived' || req.query.archive_status === 'all'
      ? req.query.archive_status
      : 'active'
    const locale = typeof req.query.locale === 'string' ? req.query.locale : undefined
    const page = typeof req.query.page === 'string' ? Number.parseInt(req.query.page, 10) : 1
    const pageSize = typeof req.query.pageSize === 'string' ? Number.parseInt(req.query.pageSize, 10) : 10
    const safePage = Number.isFinite(page) && page > 0 ? page : 1
    const safePageSize = Number.isFinite(pageSize) && [10, 20, 50].includes(pageSize) ? pageSize : 10

    const catalog = await getAdminCourseCatalog(locale)
    const normalizedQuery = q.toLocaleLowerCase()
    const filtered = catalog.data.filter((course) => {
      const matchesQuery = !normalizedQuery || [
        course.title,
        course.languageLabel,
        course.language,
        course.level,
        course.teacher,
      ].some((value) => value?.toLocaleLowerCase().includes(normalizedQuery))
      const matchesResource = !resourceType ||
        (course.resources ?? []).some((resource) => resource.resourceType === resourceType)
      const matchesArchive = archiveStatus === 'all' || (archiveStatus === 'archived' ? course.isArchived : !course.isArchived)
      return matchesQuery && matchesResource && matchesArchive
    })
    const total = filtered.length
    const totalPages = total > 0 ? Math.ceil(total / safePageSize) : 1
    const currentPage = Math.min(safePage, totalPages)
    const skip = (currentPage - 1) * safePageSize
    const courses = filtered.slice(skip, skip + safePageSize)

    sendOk(res, {
      items: courses.map((course) => ({
        id: course.id,
        title: course.title,
        language: course.languageLabel ?? course.language,
        level: course.level,
        schedule: course.schedule,
        teacher: course.teacher,
        coverUrl: course.coverUrl,
        description: course.description ?? null,
        translations: course.translations ?? null,
        isPublished: course.isPublished,
        isArchived: course.isArchived,
        archivedAt: course.archivedAt,
        archivedBy: course.archivedBy,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        catalogSource: course.catalogSource,
        editable: course.editable,
        resources: (course.resources ?? []).map((resource, index) => ({
          id: resource.id,
          courseId: course.id,
          resource_type: resource.resourceType,
          source_url: resource.sourceUrl,
          title: resource.title,
          translations: resource.translations ?? null,
          sortOrder: index,
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
        })),
      })),
      pagination: { page: currentPage, pageSize: safePageSize, total, totalPages },
      catalog: {
        provider: catalog.source,
        managedCount: catalog.data.filter((course) => course.catalogSource === 'managed').length,
        sourceCount: catalog.data.filter((course) => course.catalogSource !== 'managed').length,
        degraded: Boolean(catalog.degraded),
      },
    })
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Unknown error', 500)
  }
})

// POST /courses/import-demo/:id
router.post('/courses/import-demo/:id', ...requireAdminPermission('course.write'), async (req, res) => {
  try {
    const courseId = typeof req.params.id === 'string' ? req.params.id : ''
    const demo = MOCK_COURSES.find((course) => course.id === courseId)
    if (!demo) {
      sendError(res, 'demo course not found', 404)
      return
    }
    const existing = await prisma.course.findUnique({ where: { id: demo.id }, select: { id: true } })
    if (existing) {
      sendError(res, 'course is already managed locally', 409)
      return
    }
    const demoResources = demo.resources ?? []
    const course = await prisma.course.create({
      data: {
        id: demo.id,
        title: demo.title,
        language: demo.language,
        level: demo.level,
        schedule: demo.schedule,
        teacher: demo.teacher,
        coverUrl: demo.coverUrl,
        description: demo.description ?? null,
        isPublished: demoResources.length > 0,
        ...(demoResources.length > 0
          ? {
              videoResources: {
                create: demoResources.map((resource, index) => ({
                  resourceType: resource.resourceType,
                  sourceUrl: resource.sourceUrl,
                  title: resource.title,
                  sortOrder: index,
                })),
              },
            }
          : {}),
      },
      include: { videoResources: { orderBy: { sortOrder: 'asc' } } },
    })
    await recordAdminAudit({
      actor: req.admin!,
      action: 'DEMO_COURSE_IMPORTED',
      targetType: 'Course',
      targetId: course.id,
      summary: `将演示课程“${course.title}”复制为本地可管理课程`,
      metadata: {
        source: 'demo',
        resourceCount: course.videoResources.length,
        isPublished: course.isPublished,
      },
    })
    sendOk(res, serializeCourse(course), 201)
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'failed to import demo course', 500)
  }
})

// POST /courses
router.post('/courses', ...requireAdminPermission('course.write'), async (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const language = optionalText(body.language, 50) ?? '英语'
    const level = optionalText(body.level, 20)
    const schedule = optionalText(body.schedule, 200)
    const teacher = optionalText(body.teacher, 100)
    const coverUrl = typeof body.coverUrl === 'string' ? body.coverUrl.trim() : null
    const description = typeof body.description === 'string' ? body.description.trim() : null
    const translations = parseCourseTranslations(body.translations)
    const isPublished = typeof body.isPublished === 'boolean' ? body.isPublished : true

    if (!title) { sendError(res, 'title is required', 400); return }
    const suspiciousField = findSuspiciousCourseTextField({ title, language, schedule, teacher, description })
    if (suspiciousField) {
      sendError(res, `course text contains suspicious replacement characters: ${suspiciousField}`, 400)
      return
    }

    const rawResources = Array.isArray(body.resources) ? body.resources : []
    const parsedResources: Prisma.VideoResourceCreateWithoutCourseInput[] = rawResources
      .filter(isRecord)
      .map((r, idx) => {
        const resourceType = parseResourceType(r.resource_type)
        const sourceUrl = typeof r.source_url === 'string' ? r.source_url.trim() : ''
        const resourceTitle = typeof r.title === 'string' ? r.title.trim() : null
        const sortOrder = typeof r.sortOrder === 'number' && Number.isFinite(r.sortOrder) ? r.sortOrder : idx
        const translations = parseCourseTranslations(r.translations)
        return { resourceType, sourceUrl, title: resourceTitle, translations, sortOrder }
      })
      .filter((r) => !!r.resourceType && !!r.sourceUrl)
      .map((r) => ({
        resourceType: r.resourceType!,
        sourceUrl: r.sourceUrl,
        title: r.title,
        ...(r.translations ? { translations: r.translations as Prisma.InputJsonValue } : {}),
        sortOrder: r.sortOrder,
      }))

    if (parsedResources.length === 0) {
      sendError(res, 'resources is required and must include valid resource_type and source_url', 400)
      return
    }

    const course = await prisma.course.create({
      data: {
        title,
        language,
        level,
        schedule,
        teacher,
        coverUrl,
        description,
        ...(translations ? { translations: translations as Prisma.InputJsonValue } : {}),
        isPublished,
        videoResources: { create: parsedResources },
      },
      include: { videoResources: { orderBy: { sortOrder: 'asc' } } },
    })

    await recordAdminAudit({
      actor: req.admin!,
      action: 'COURSE_CREATED',
      targetType: 'Course',
      targetId: course.id,
      summary: `创建课程“${course.title}”`,
      metadata: { resourceCount: course.videoResources.length, isPublished: course.isPublished },
    })
    sendOk(res, serializeCourse(course), 201)
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Unknown error', 500)
  }
})

// GET /courses/:id
router.get('/courses/:id', ...requireAdminPermission('course.read'), async (req, res) => {
  try {
    const courseId = typeof req.params.id === 'string' ? req.params.id : ''
    if (!courseId) { sendError(res, 'courseId is required', 400); return }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { videoResources: { orderBy: { sortOrder: 'asc' } } },
    })

    if (!course) { sendError(res, 'course not found', 404); return }

    sendOk(res, serializeCourse(course))
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Unknown error', 500)
  }
})

// PUT /courses/:id
router.put('/courses/:id', ...requireAdminPermission('course.write'), async (req, res) => {
  try {
    const courseId = typeof req.params.id === 'string' ? req.params.id : ''
    if (!courseId) { sendError(res, 'courseId is required', 400); return }

    const body = (req.body ?? {}) as Record<string, unknown>
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const language = optionalText(body.language, 50) ?? '英语'
    const level = optionalText(body.level, 20)
    const schedule = optionalText(body.schedule, 200)
    const teacher = optionalText(body.teacher, 100)
    const coverUrl = typeof body.coverUrl === 'string' ? body.coverUrl.trim() : null
    const description = typeof body.description === 'string' ? body.description.trim() : null
    const translations = parseCourseTranslations(body.translations)
    const isPublished = typeof body.isPublished === 'boolean' ? body.isPublished : true
    if (!title) { sendError(res, 'title is required', 400); return }
    const suspiciousField = findSuspiciousCourseTextField({ title, language, schedule, teacher, description })
    if (suspiciousField) {
      sendError(res, `course text contains suspicious replacement characters: ${suspiciousField}`, 400)
      return
    }

    if (body.resources === undefined) {
      const existed = await prisma.course.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          isArchived: true,
          _count: { select: { videoResources: true } },
        },
      })
      if (!existed) { sendError(res, 'course not found', 404); return }
      if (existed.isArchived) { sendError(res, 'archived course is read-only', 409); return }
      const structuredLessonCount = isPublished && existed._count.videoResources === 0
        ? await prisma.courseLesson.count({
            where: { isPublished: true, chapter: { courseId, isPublished: true } },
          })
        : 0
      if (isPublished && existed._count.videoResources === 0 && structuredLessonCount === 0) {
        sendError(res, 'published course requires at least one learning resource', 409)
        return
      }

      const updated = await prisma.course.update({
        where: { id: courseId },
        data: {
          title,
          language,
          level,
          schedule,
          teacher,
          coverUrl,
          description,
          translations: translations
            ? translations as Prisma.InputJsonValue
            : Prisma.DbNull,
          isPublished,
        },
        include: { videoResources: { orderBy: { sortOrder: 'asc' } } },
      })
      await recordAdminAudit({
        actor: req.admin!,
        action: 'COURSE_UPDATED',
        targetType: 'Course',
        targetId: updated.id,
        summary: `更新课程“${updated.title}”`,
      })
      sendOk(res, serializeCourse(updated))
      return
    }

    const rawResources = Array.isArray(body.resources) ? body.resources : []
    const parsedResources = rawResources
      .filter(isRecord)
      .map((r, idx) => {
        const id = typeof r.id === 'string' ? r.id : ''
        const resourceType = parseResourceType(r.resource_type)
        const sourceUrl = typeof r.source_url === 'string' ? r.source_url.trim() : ''
        const resourceTitle = typeof r.title === 'string' ? r.title.trim() : null
        const sortOrder = typeof r.sortOrder === 'number' && Number.isFinite(r.sortOrder) ? r.sortOrder : idx
        const translations = parseCourseTranslations(r.translations)
        return { id, resourceType, sourceUrl, title: resourceTitle, translations, sortOrder }
      })
      .filter((r) => !!r.resourceType && !!r.sourceUrl)

    if (parsedResources.length === 0) {
      sendError(res, 'resources must include at least one valid entry with resource_type and source_url', 400)
      return
    }

    const existed = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, isArchived: true, videoResources: { select: { id: true } } },
    })
    if (!existed) { sendError(res, 'course not found', 404); return }
    if (existed.isArchived) { sendError(res, 'archived course is read-only', 409); return }

    const existingIdSet = new Set(existed.videoResources.map((r) => r.id))
    const keepIdSet = new Set(parsedResources.map((r) => r.id).filter(Boolean))
    const deleteIds = existed.videoResources.map((r) => r.id).filter((id) => !keepIdSet.has(id))

    const updated = await prisma.$transaction(async (tx) => {
      if (deleteIds.length > 0) {
        await tx.videoResource.deleteMany({ where: { courseId, id: { in: deleteIds } } })
      }
      for (const item of parsedResources) {
        if (item.id && existingIdSet.has(item.id)) {
          await tx.videoResource.update({
            where: { id: item.id },
            data: {
              resourceType: item.resourceType!,
              sourceUrl: item.sourceUrl,
              title: item.title,
              translations: item.translations
                ? item.translations as Prisma.InputJsonValue
                : Prisma.DbNull,
              sortOrder: item.sortOrder,
            },
          })
        } else {
          await tx.videoResource.create({
            data: {
              courseId,
              resourceType: item.resourceType!,
              sourceUrl: item.sourceUrl,
              title: item.title,
              ...(item.translations ? { translations: item.translations as Prisma.InputJsonValue } : {}),
              sortOrder: item.sortOrder,
            },
          })
        }
      }
      return tx.course.update({
        where: { id: courseId },
        data: {
          title,
          language,
          level,
          schedule,
          teacher,
          coverUrl,
          description,
          translations: translations
            ? translations as Prisma.InputJsonValue
            : Prisma.DbNull,
          isPublished,
        },
        include: { videoResources: { orderBy: { sortOrder: 'asc' } } },
      })
    })

    await recordAdminAudit({
      actor: req.admin!,
      action: 'COURSE_UPDATED',
      targetType: 'Course',
      targetId: updated.id,
      summary: `更新课程“${updated.title}”及其学习资源`,
      metadata: { resourceCount: updated.videoResources.length, isPublished: updated.isPublished },
    })
    sendOk(res, serializeCourse(updated))
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Unknown error', 500)
  }
})

// DELETE /courses/:id — safe archive; learning history is intentionally preserved.
router.delete('/courses/:id', ...requireAdminPermission('course.write'), async (req, res) => {
  try {
    const courseId = typeof req.params.id === 'string' ? req.params.id : ''
    if (!courseId) { sendError(res, 'courseId is required', 400); return }

    const existing = await prisma.course.findUnique({ where: { id: courseId } })
    if (!existing) { sendError(res, 'course not found', 404); return }
    if (existing.isArchived) { sendError(res, 'course is already archived', 409); return }
    const archived = await prisma.course.update({
      where: { id: courseId },
      data: { isArchived: true, isPublished: false, archivedAt: new Date(), archivedBy: req.admin!.adminId },
    })
    await recordAdminAudit({
      actor: req.admin!,
      action: 'COURSE_ARCHIVED',
      targetType: 'Course',
      targetId: courseId,
      summary: `归档课程“${archived.title}”并保留全部学习历史`,
    })
    sendOk(res, { id: courseId, isArchived: true, archivedAt: archived.archivedAt })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      sendError(res, 'course not found', 404)
      return
    }
    sendError(res, err instanceof Error ? err.message : 'Unknown error', 500)
  }
})

router.post('/courses/:id/restore', ...requireAdminPermission('course.write'), async (req, res) => {
  try {
    const courseId = typeof req.params.id === 'string' ? req.params.id : ''
    if (!courseId) { sendError(res, 'courseId is required', 400); return }
    const existing = await prisma.course.findUnique({ where: { id: courseId } })
    if (!existing) { sendError(res, 'course not found', 404); return }
    if (!existing.isArchived) { sendError(res, 'course is not archived', 409); return }
    const restored = await prisma.course.update({
      where: { id: courseId },
      data: { isArchived: false, isPublished: false, archivedAt: null, archivedBy: null },
      include: { videoResources: { orderBy: { sortOrder: 'asc' } } },
    })
    await recordAdminAudit({
      actor: req.admin!,
      action: 'COURSE_RESTORED',
      targetType: 'Course',
      targetId: courseId,
      summary: `恢复课程“${restored.title}”为草稿`,
    })
    sendOk(res, serializeCourse(restored))
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'failed to restore course', 500)
  }
})

// ============================================================
// === Resources ===
// ============================================================

// POST /courses/:courseId/resources
router.post('/courses/:courseId/resources', ...requireAdminPermission('course.write'), async (req, res) => {
  try {
    const courseId = typeof req.params.courseId === 'string' ? req.params.courseId : ''
    if (!courseId) { sendError(res, 'courseId is required', 400); return }

    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true, isArchived: true } })
    if (!course) { sendError(res, 'course not found', 404); return }
    if (course.isArchived) { sendError(res, 'archived course is read-only', 409); return }

    const body = (req.body ?? {}) as Record<string, unknown>
    const resourceType = parseResourceType(body.resource_type)
    if (!resourceType) { sendError(res, 'resource_type is invalid', 400); return }

    const sourceUrl = typeof body.source_url === 'string' ? body.source_url.trim() : ''
    if (!sourceUrl) { sendError(res, 'source_url is required', 400); return }

    const title = typeof body.title === 'string' ? body.title.trim() || null : null
    const translations = parseCourseTranslations(body.translations)

    const agg = await prisma.videoResource.aggregate({
      where: { courseId },
      _max: { sortOrder: true },
    })
    const nextOrder = (agg._max.sortOrder ?? -1) + 1

    const resource = await prisma.videoResource.create({
      data: {
        courseId,
        resourceType,
        sourceUrl,
        title,
        ...(translations ? { translations: translations as Prisma.InputJsonValue } : {}),
        sortOrder: nextOrder,
      },
    })

    await recordAdminAudit({
      actor: req.admin!,
      action: 'COURSE_RESOURCE_CREATED',
      targetType: 'VideoResource',
      targetId: resource.id,
      summary: `为课程 ${courseId} 添加学习资源`,
      metadata: { courseId, resourceType },
    })
    sendOk(res, serializeResource(resource), 201)
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Unknown error', 500)
  }
})

// PUT /courses/:courseId/resources/sort  — MUST be before /:resourceId
router.put('/courses/:courseId/resources/sort', ...requireAdminPermission('course.write'), async (req, res) => {
  try {
    const courseId = typeof req.params.courseId === 'string' ? req.params.courseId : ''
    if (!courseId) { sendError(res, 'courseId is required', 400); return }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, isArchived: true, videoResources: { select: { id: true } } },
    })
    if (!course) { sendError(res, 'course not found', 404); return }
    if (course.isArchived) { sendError(res, 'archived course is read-only', 409); return }

    const body = req.body ?? {}
    const resourceIds: unknown = body.resourceIds
    if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
      sendError(res, 'resourceIds must be a non-empty array', 400)
      return
    }

    const courseResourceIds = new Set(course.videoResources.map((r) => r.id))
    const invalid = (resourceIds as unknown[]).find((id) => typeof id !== 'string' || !courseResourceIds.has(id))
    if (invalid !== undefined) {
      sendError(res, 'resourceIds contains invalid or foreign resource id', 400)
      return
    }

    await prisma.$transaction(
      (resourceIds as string[]).map((id, idx) =>
        prisma.videoResource.update({ where: { id }, data: { sortOrder: idx } })
      )
    )

    const updated = await prisma.course.findUnique({
      where: { id: courseId },
      include: { videoResources: { orderBy: { sortOrder: 'asc' } } },
    })

    await recordAdminAudit({
      actor: req.admin!,
      action: 'COURSE_RESOURCES_SORTED',
      targetType: 'Course',
      targetId: courseId,
      summary: `调整课程 ${courseId} 的资源顺序`,
      metadata: { resourceCount: resourceIds.length },
    })
    sendOk(res, serializeCourse(updated!))
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Unknown error', 500)
  }
})

// PUT /courses/:courseId/resources/:resourceId
router.put('/courses/:courseId/resources/:resourceId', ...requireAdminPermission('course.write'), async (req, res) => {
  try {
    const courseId = typeof req.params.courseId === 'string' ? req.params.courseId : ''
    const resourceId = typeof req.params.resourceId === 'string' ? req.params.resourceId : ''
    if (!courseId || !resourceId) { sendError(res, 'courseId and resourceId are required', 400); return }

    const existing = await prisma.videoResource.findUnique({ where: { id: resourceId }, select: { id: true, courseId: true, course: { select: { isArchived: true } } } })
    if (!existing || existing.courseId !== courseId) { sendError(res, 'resource not found', 404); return }
    if (existing.course.isArchived) { sendError(res, 'archived course is read-only', 409); return }

    const body = (req.body ?? {}) as Record<string, unknown>
    const resourceType = parseResourceType(body.resource_type)
    if (!resourceType) { sendError(res, 'resource_type is invalid', 400); return }

    const sourceUrl = typeof body.source_url === 'string' ? body.source_url.trim() : ''
    if (!sourceUrl) { sendError(res, 'source_url is required', 400); return }

    const title = typeof body.title === 'string' ? body.title.trim() || null : null
    const translations = parseCourseTranslations(body.translations)

    const updated = await prisma.videoResource.update({
      where: { id: resourceId },
      data: {
        resourceType,
        sourceUrl,
        title,
        translations: translations
          ? translations as Prisma.InputJsonValue
          : Prisma.DbNull,
      },
    })

    await recordAdminAudit({
      actor: req.admin!,
      action: 'COURSE_RESOURCE_UPDATED',
      targetType: 'VideoResource',
      targetId: resourceId,
      summary: `更新课程 ${courseId} 的学习资源`,
      metadata: { courseId, resourceType },
    })
    sendOk(res, serializeResource(updated))
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Unknown error', 500)
  }
})

// DELETE /courses/:courseId/resources/:resourceId
router.delete('/courses/:courseId/resources/:resourceId', ...requireAdminPermission('course.write'), async (req, res) => {
  try {
    const courseId = typeof req.params.courseId === 'string' ? req.params.courseId : ''
    const resourceId = typeof req.params.resourceId === 'string' ? req.params.resourceId : ''
    if (!courseId || !resourceId) { sendError(res, 'courseId and resourceId are required', 400); return }

    const existing = await prisma.videoResource.findUnique({ where: { id: resourceId }, select: { id: true, courseId: true, course: { select: { isArchived: true } } } })
    if (!existing || existing.courseId !== courseId) { sendError(res, 'resource not found', 404); return }
    if (existing.course.isArchived) { sendError(res, 'archived course is read-only', 409); return }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        isPublished: true,
        _count: { select: { videoResources: true } },
      },
    })
    if (!course) { sendError(res, 'course not found', 404); return }
    if (course.isPublished && course._count.videoResources <= 1) {
      sendError(res, 'published course must keep at least one learning resource; unpublish it first', 409)
      return
    }

    await prisma.videoResource.delete({ where: { id: resourceId } })
    await recordAdminAudit({
      actor: req.admin!,
      action: 'COURSE_RESOURCE_DELETED',
      targetType: 'VideoResource',
      targetId: resourceId,
      summary: `删除课程 ${courseId} 的学习资源`,
      metadata: { courseId },
    })
    sendOk(res, { id: resourceId })
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Unknown error', 500)
  }
})

// ============================================================
// === Progress ===
// ============================================================

// GET /courses/:id/progress
router.get('/courses/:id/progress', optionalStudentAuth, async (req, res) => {
  try {
    const courseId = typeof req.params.id === 'string' ? req.params.id : ''
    if (!courseId) { sendError(res, 'courseId is required', 400); return }

    if (!(await courseExists(courseId))) { sendError(res, 'course not found', 404); return }

    if (!req.student) {
      sendOk(res, { lastPositionSeconds: 0, isCompleted: false, progressPercent: 0 })
      return
    }

    const userId = req.student.studentId
    const record = await prisma.studyRecord.findUnique({
      where: { userId_courseId: { userId, courseId } },
    })

    if (!record) {
      sendOk(res, { lastPositionSeconds: 0, isCompleted: false, progressPercent: 0 })
      return
    }

    sendOk(res, {
      studyRecordId: record.id,
      lastPositionSeconds: record.lastPositionSeconds,
      isCompleted: record.isCompleted,
      progressPercent: record.progressPercent,
    })
  } catch (err) {
    console.error('[progress] GET failed', err)
    sendError(res, err instanceof Error ? err.message : 'Unknown error', 500)
  }
})

// POST /courses/:id/progress
router.post('/courses/:id/progress', optionalStudentAuth, async (req, res) => {
  try {
    const courseId = typeof req.params.id === 'string' ? req.params.id : ''
    if (!courseId) { sendError(res, 'courseId is required', 400); return }

    const body = (req.body ?? {}) as Record<string, unknown>

    const rawCurrentTime = typeof body.currentTime === 'number'
      ? body.currentTime
      : typeof body.currentTime === 'string'
        ? parseFloat(body.currentTime)
        : NaN
    if (!isFinite(rawCurrentTime) || rawCurrentTime < 0) {
      sendError(res, 'currentTime is required and must be a non-negative number', 400)
      return
    }

    const rawDuration = typeof body.duration === 'number'
      ? body.duration
      : typeof body.duration === 'string'
        ? parseFloat(body.duration)
        : NaN
    const duration = isFinite(rawDuration) && rawDuration > 0 ? rawDuration : 0

    if (!(await courseExists(courseId))) { sendError(res, 'course not found', 404); return }

    if (!req.student) {
      sendOk(res, {
        recorded: false,
        isCompleted: false,
        lastPositionSeconds: Math.round(rawCurrentTime),
        note: '登录后可同步学习进度',
      })
      return
    }

    const shouldComplete = duration > 0 && rawCurrentTime / duration >= 0.9
    const progressPercent = duration > 0
      ? Math.min(Math.round((rawCurrentTime / duration) * 10000) / 100, 100)
      : undefined

    const updateData: Record<string, unknown> = {
      lastPositionSeconds: Math.round(rawCurrentTime),
    }
    if (progressPercent !== undefined) updateData.progressPercent = progressPercent
    if (shouldComplete) {
      updateData.isCompleted = true
      updateData.completedAt = new Date()
    }

    const userId = req.student.studentId
    const record = await prisma.studyRecord.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: updateData,
      create: {
        userId,
        courseId,
        lastPositionSeconds: Math.round(rawCurrentTime),
        progressPercent: progressPercent ?? 0,
        isCompleted: shouldComplete,
        completedAt: shouldComplete ? new Date() : null,
      },
    })

    console.log('[progress] recorded', { userId, courseId, currentTime: rawCurrentTime, duration, isCompleted: record.isCompleted })

    sendOk(res, {
      recorded: true,
      studyRecordId: record.id,
      isCompleted: record.isCompleted,
      lastPositionSeconds: record.lastPositionSeconds,
    })
  } catch (err) {
    console.error('[progress] DB write failed', err)
    sendError(res, err instanceof Error ? err.message : 'Unknown error', 500)
  }
})

// ============================================================
// === Chatbot (Intent-based, non-streaming) ===
// ============================================================

// POST /chatbot/intent — 纯意图识别（不调用 AI，仅正则匹配，无 rate limit）
// Body: { message: string }
// Returns: { ok: true, data: { intent: 'TIMETABLE'|'GRADES'|'TRANSLATE'|'FALLBACK', needsAuth: boolean } }
router.post('/chatbot/intent', postChat)

// POST /chatbot — 完整 RAG 流程
// Body: { message: string, studentId: string }
// Returns: { ok: true, data: { reply, intent, studentId } }
router.post('/chatbot', optionalStudentAuth, chatRateLimit, handleChatbot)
router.post('/chatbot/feedback', optionalStudentAuth, chatRateLimit, handleAssistantFeedback)

function isAiFlashcardGenerationEnabled() {
  const enabled = (process.env.AI_ENABLED || 'false').trim().toLowerCase() === 'true'
  const apiKey = (process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '').trim()
  return enabled && Boolean(apiKey)
}

router.get('/chatbot/capabilities', (_req, res) => {
  sendOk(res, {
    flashcardGenerationEnabled: isAiFlashcardGenerationEnabled(),
  })
})

// ============================================================
// POST /chatbot/flashcard — 非流式知识点提取
// ============================================================

router.post('/chatbot/flashcard', requireStudentAuth, chatRateLimit, async (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>
    const content = typeof body.content === 'string' ? body.content.trim() : ''

    if (!content) { sendError(res, 'content is required', 400); return }
    if (content.length > 8000) { sendError(res, 'content too long (max 8000 chars)', 400); return }

    const apiKey = (process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '').trim()
    if (!isAiFlashcardGenerationEnabled()) {
      sendError(res, 'AI flashcard generation is not enabled', 503)
      return
    }

    const baseUrl = normalizeBaseUrl(process.env.AI_BASE_URL || 'https://api.openai.com')
    const model = process.env.AI_MODEL || 'gpt-4o-mini'
    const endpoint = `${baseUrl}/chat/completions`

    const prompt = `请从以下内容中提取最核心的一个知识点，严格以 JSON 格式返回，只返回 JSON，不要任何其他文字或代码块包裹。
JSON 字段要求：
- term: 核心词汇或概念名称
- definition: 包含拼音/音标、词性及详细中文解释（50-150字）
- example: 经典双语例句（英文例句 / 中文翻译）
内容：
${content}`

    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 512,
        stream: false,
      }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!upstream.ok) {
      console.error('[flashcard] AI error', upstream.status)
      sendError(res, 'AI extraction failed', 502)
      return
    }

    const json = await upstream.json() as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const raw = json.choices?.[0]?.message?.content?.trim()
    if (!raw) { sendError(res, 'AI returned empty response', 502); return }

    // 正则剥离 Markdown 代码块
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) { sendError(res, 'AI response is not valid JSON', 502); return }

    const parsed = JSON.parse(match[0]) as { term?: string; definition?: string; example?: string }
    if (!parsed.term || !parsed.definition) {
      sendError(res, 'Extracted data is incomplete', 502)
      return
    }

    sendOk(res, {
      term: parsed.term,
      definition: parsed.definition,
      example: parsed.example ?? '',
    })
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Unknown error', 500)
  }
})

function normalizeBaseUrl(raw: string) {
  const trimmed = raw.replace(/\/$/, '')
  return trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`
}

export default router
