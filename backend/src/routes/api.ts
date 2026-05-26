import { Router } from 'express'
import type { Request } from 'express'
import { Prisma, VideoResourceType } from '@prisma/client'
import { prisma } from '../db/prisma.js'
import { sendError, sendOk } from '../lib/apiResponse.js'
import { serializeCourse, serializeResource } from '../lib/serializers.js'
import { requireAdmin } from '../middleware/adminAuth.js'
import { optionalStudentAuth } from '../middleware/studentAuth.js'
import { chatRateLimit } from '../middleware/rateLimit.js'
import { handleChatbot, postChat } from '../controllers/chatbotController.js'

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

// GET /courses
router.get('/courses', async (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    const resourceType = parseResourceType(req.query.resource_type)
    const page = typeof req.query.page === 'string' ? Number.parseInt(req.query.page, 10) : 1
    const pageSize = typeof req.query.pageSize === 'string' ? Number.parseInt(req.query.pageSize, 10) : 10
    const safePage = Number.isFinite(page) && page > 0 ? page : 1
    const safePageSize = Number.isFinite(pageSize) && [10, 20, 50].includes(pageSize) ? pageSize : 10

    const where: Prisma.CourseWhereInput = {}
    if (q) where.title = { contains: q }
    if (resourceType) {
      where.videoResources = { some: { resourceType } }
    }

    const total = await prisma.course.count({ where })
    const totalPages = total > 0 ? Math.ceil(total / safePageSize) : 1
    const currentPage = Math.min(safePage, totalPages)
    const skip = (currentPage - 1) * safePageSize

    const courses = await prisma.course.findMany({
      where,
      include: { videoResources: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: safePageSize,
    })

    sendOk(res, {
      items: courses.map(serializeCourse),
      pagination: { page: currentPage, pageSize: safePageSize, total, totalPages },
    })
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Unknown error', 500)
  }
})

// POST /courses
router.post('/courses', requireAdmin, async (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const coverUrl = typeof body.coverUrl === 'string' ? body.coverUrl.trim() : null
    const description = typeof body.description === 'string' ? body.description.trim() : null

    if (!title) { sendError(res, 'title is required', 400); return }

    const rawResources = Array.isArray(body.resources) ? body.resources : []
    const parsedResources: Prisma.VideoResourceCreateWithoutCourseInput[] = rawResources
      .filter(isRecord)
      .map((r, idx) => {
        const resourceType = parseResourceType(r.resource_type)
        const sourceUrl = typeof r.source_url === 'string' ? r.source_url.trim() : ''
        const resourceTitle = typeof r.title === 'string' ? r.title.trim() : null
        const sortOrder = typeof r.sortOrder === 'number' && Number.isFinite(r.sortOrder) ? r.sortOrder : idx
        return { resourceType, sourceUrl, title: resourceTitle, sortOrder }
      })
      .filter((r) => !!r.resourceType && !!r.sourceUrl)
      .map((r) => ({
        resourceType: r.resourceType!,
        sourceUrl: r.sourceUrl,
        title: r.title,
        sortOrder: r.sortOrder,
      }))

    if (parsedResources.length === 0) {
      sendError(res, 'resources is required and must include valid resource_type and source_url', 400)
      return
    }

    const course = await prisma.course.create({
      data: {
        title,
        coverUrl,
        description,
        videoResources: { create: parsedResources },
      },
      include: { videoResources: { orderBy: { sortOrder: 'asc' } } },
    })

    sendOk(res, serializeCourse(course), 201)
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Unknown error', 500)
  }
})

// GET /courses/:id
router.get('/courses/:id', async (req, res) => {
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
router.put('/courses/:id', requireAdmin, async (req, res) => {
  try {
    const courseId = typeof req.params.id === 'string' ? req.params.id : ''
    if (!courseId) { sendError(res, 'courseId is required', 400); return }

    const body = (req.body ?? {}) as Record<string, unknown>
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const coverUrl = typeof body.coverUrl === 'string' ? body.coverUrl.trim() : null
    const description = typeof body.description === 'string' ? body.description.trim() : null
    if (!title) { sendError(res, 'title is required', 400); return }

    if (body.resources === undefined) {
      const existed = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } })
      if (!existed) { sendError(res, 'course not found', 404); return }

      const updated = await prisma.course.update({
        where: { id: courseId },
        data: { title, coverUrl, description },
        include: { videoResources: { orderBy: { sortOrder: 'asc' } } },
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
        return { id, resourceType, sourceUrl, title: resourceTitle, sortOrder }
      })
      .filter((r) => !!r.resourceType && !!r.sourceUrl)

    if (parsedResources.length === 0) {
      sendError(res, 'resources must include at least one valid entry with resource_type and source_url', 400)
      return
    }

    const existed = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, videoResources: { select: { id: true } } },
    })
    if (!existed) { sendError(res, 'course not found', 404); return }

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
            data: { resourceType: item.resourceType!, sourceUrl: item.sourceUrl, title: item.title, sortOrder: item.sortOrder },
          })
        } else {
          await tx.videoResource.create({
            data: { courseId, resourceType: item.resourceType!, sourceUrl: item.sourceUrl, title: item.title, sortOrder: item.sortOrder },
          })
        }
      }
      return tx.course.update({
        where: { id: courseId },
        data: { title, coverUrl, description },
        include: { videoResources: { orderBy: { sortOrder: 'asc' } } },
      })
    })

    sendOk(res, serializeCourse(updated))
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Unknown error', 500)
  }
})

// DELETE /courses/:id
router.delete('/courses/:id', requireAdmin, async (req, res) => {
  try {
    const courseId = typeof req.params.id === 'string' ? req.params.id : ''
    if (!courseId) { sendError(res, 'courseId is required', 400); return }

    await prisma.course.delete({ where: { id: courseId } })
    sendOk(res, { id: courseId })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      sendError(res, 'course not found', 404)
      return
    }
    sendError(res, err instanceof Error ? err.message : 'Unknown error', 500)
  }
})

// ============================================================
// === Resources ===
// ============================================================

// POST /courses/:courseId/resources
router.post('/courses/:courseId/resources', requireAdmin, async (req, res) => {
  try {
    const courseId = typeof req.params.courseId === 'string' ? req.params.courseId : ''
    if (!courseId) { sendError(res, 'courseId is required', 400); return }

    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } })
    if (!course) { sendError(res, 'course not found', 404); return }

    const body = (req.body ?? {}) as Record<string, unknown>
    const resourceType = parseResourceType(body.resource_type)
    if (!resourceType) { sendError(res, 'resource_type is invalid', 400); return }

    const sourceUrl = typeof body.source_url === 'string' ? body.source_url.trim() : ''
    if (!sourceUrl) { sendError(res, 'source_url is required', 400); return }

    const title = typeof body.title === 'string' ? body.title.trim() || null : null

    const agg = await prisma.videoResource.aggregate({
      where: { courseId },
      _max: { sortOrder: true },
    })
    const nextOrder = (agg._max.sortOrder ?? -1) + 1

    const resource = await prisma.videoResource.create({
      data: { courseId, resourceType, sourceUrl, title, sortOrder: nextOrder },
    })

    sendOk(res, serializeResource(resource), 201)
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Unknown error', 500)
  }
})

// PUT /courses/:courseId/resources/sort  — MUST be before /:resourceId
router.put('/courses/:courseId/resources/sort', requireAdmin, async (req, res) => {
  try {
    const courseId = typeof req.params.courseId === 'string' ? req.params.courseId : ''
    if (!courseId) { sendError(res, 'courseId is required', 400); return }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, videoResources: { select: { id: true } } },
    })
    if (!course) { sendError(res, 'course not found', 404); return }

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

    sendOk(res, serializeCourse(updated!))
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Unknown error', 500)
  }
})

// PUT /courses/:courseId/resources/:resourceId
router.put('/courses/:courseId/resources/:resourceId', requireAdmin, async (req, res) => {
  try {
    const courseId = typeof req.params.courseId === 'string' ? req.params.courseId : ''
    const resourceId = typeof req.params.resourceId === 'string' ? req.params.resourceId : ''
    if (!courseId || !resourceId) { sendError(res, 'courseId and resourceId are required', 400); return }

    const existing = await prisma.videoResource.findUnique({ where: { id: resourceId }, select: { id: true, courseId: true } })
    if (!existing || existing.courseId !== courseId) { sendError(res, 'resource not found', 404); return }

    const body = (req.body ?? {}) as Record<string, unknown>
    const resourceType = parseResourceType(body.resource_type)
    if (!resourceType) { sendError(res, 'resource_type is invalid', 400); return }

    const sourceUrl = typeof body.source_url === 'string' ? body.source_url.trim() : ''
    if (!sourceUrl) { sendError(res, 'source_url is required', 400); return }

    const title = typeof body.title === 'string' ? body.title.trim() || null : null

    const updated = await prisma.videoResource.update({
      where: { id: resourceId },
      data: { resourceType, sourceUrl, title },
    })

    sendOk(res, serializeResource(updated))
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Unknown error', 500)
  }
})

// DELETE /courses/:courseId/resources/:resourceId
router.delete('/courses/:courseId/resources/:resourceId', requireAdmin, async (req, res) => {
  try {
    const courseId = typeof req.params.courseId === 'string' ? req.params.courseId : ''
    const resourceId = typeof req.params.resourceId === 'string' ? req.params.resourceId : ''
    if (!courseId || !resourceId) { sendError(res, 'courseId and resourceId are required', 400); return }

    const existing = await prisma.videoResource.findUnique({ where: { id: resourceId }, select: { id: true, courseId: true } })
    if (!existing || existing.courseId !== courseId) { sendError(res, 'resource not found', 404); return }

    await prisma.videoResource.delete({ where: { id: resourceId } })
    sendOk(res, { id: resourceId })
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Unknown error', 500)
  }
})

// ============================================================
// === Progress ===
// ============================================================

function getUserId(req: Request): string {
  return req.student?.studentId ?? 'anonymous'
}

// GET /courses/:id/progress
router.get('/courses/:id/progress', optionalStudentAuth, async (req, res) => {
  try {
    const courseId = typeof req.params.id === 'string' ? req.params.id : ''
    if (!courseId) { sendError(res, 'courseId is required', 400); return }

    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } })
    if (!course) { sendError(res, 'course not found', 404); return }

    const userId = getUserId(req)
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

    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } })
    if (!course) { sendError(res, 'course not found', 404); return }

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

    const userId = getUserId(req)
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
router.post('/chatbot', chatRateLimit, handleChatbot)

// ============================================================
// POST /chatbot/flashcard — 非流式知识点提取
// ============================================================

router.post('/chatbot/flashcard', chatRateLimit, async (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>
    const content = typeof body.content === 'string' ? body.content.trim() : ''

    if (!content) { sendError(res, 'content is required', 400); return }
    if (content.length > 8000) { sendError(res, 'content too long (max 8000 chars)', 400); return }

    const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY
    if (!apiKey) { sendError(res, 'AI is not configured on server', 503); return }

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

// ============================================================
// === Chat (SSE Streaming) ===
// ============================================================

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

function normalizeBaseUrl(raw: string) {
  const trimmed = raw.replace(/\/$/, '')
  return trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`
}

function isValidMessages(v: unknown): v is ChatMessage[] {
  return (
    Array.isArray(v) && v.length > 0 &&
    v.every((m) => isRecord(m) && typeof m.content === 'string' && m.content.trim().length > 0 &&
      ['system', 'user', 'assistant'].includes(m.role as string))
  )
}

function buildSystemPrompt(context: Record<string, unknown>): string {
  const courseName = typeof context.courseName === 'string' ? context.courseName.trim() : ''
  const courseStr = courseName ? `，当前课程为《${courseName}》` : ''
  return `你是一位专业、友善的 AI 学习助教${courseStr}。请用排版清晰的 Markdown 格式，简洁明了地解答用户的学习疑惑。请直接输出格式化后的文本，绝对不要在回答的最外层使用 \`\`\`markdown 代码块包裹！`
}

// POST /chat  — streams response as SSE (text/event-stream)
router.post('/chat', chatRateLimit, async (req, res) => {
  const body = (req.body ?? {}) as Record<string, unknown>

  let messages: ChatMessage[]
  if (isValidMessages(body.messages)) {
    messages = body.messages
  } else if (typeof body.message === 'string' && body.message.trim()) {
    messages = [{ role: 'user', content: body.message.trim() }]
  } else {
    sendError(res, 'messages (array) or message (string) is required', 400)
    return
  }

  // 注入 context 为 system prompt
  const context = isRecord(body.context) ? body.context : null
  if (context && !messages.some((m) => m.role === 'system')) {
    messages = [{ role: 'system', content: buildSystemPrompt(context) }, ...messages]
  }

  console.log('[chat] Final messages payload:', JSON.stringify(messages, null, 2))

  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) { sendError(res, 'AI is not configured on server', 503); return }

  const endpoint = `${normalizeBaseUrl(process.env.AI_BASE_URL || 'https://api.openai.com')}/chat/completions`
  const model = process.env.AI_MODEL || 'gpt-4o-mini'

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  // 禁用 Nginx 等反向代理缓存，保障 TTFB 性能
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  const sendEvent = (event: string, data: string) => res.write(`event: ${event}\ndata: ${data}\n\n`)

  const abort = new AbortController()
  const timeout = setTimeout(() => abort.abort(), 60_000)
  req.on('close', () => abort.abort())

  try {
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}`, Accept: 'text/event-stream' },
      body: JSON.stringify({ model, messages, stream: true }),
      signal: abort.signal,
    })
    clearTimeout(timeout)

    if (!upstream.ok) {
      const detail = process.env.NODE_ENV !== 'production' ? `: ${await upstream.text()}` : ''
      sendEvent('error', JSON.stringify({ message: `Upstream AI error ${upstream.status}${detail}` }))
      res.end(); return
    }
    if (!upstream.body) { sendEvent('error', JSON.stringify({ message: 'No response body from AI' })); res.end(); return }

    const reader = upstream.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const payload = trimmed.slice(5).trim()
        if (payload === '[DONE]') { sendEvent('done', '{}'); res.end(); return }
        try {
          const chunk = JSON.parse(payload) as { choices?: Array<{ delta?: { content?: string | null } }> }
          const content = chunk.choices?.[0]?.delta?.content
          if (content) sendEvent('delta', JSON.stringify({ content }))
        } catch { /* ignore malformed lines */ }
      }
    }
    sendEvent('done', '{}')
    res.end()
  } catch (err) {
    clearTimeout(timeout)
    const msg = err instanceof Error && err.name === 'AbortError' ? 'Request timeout or client disconnected' : (err instanceof Error ? err.message : 'Unknown error')
    sendEvent('error', JSON.stringify({ message: msg }))
    res.end()
  }
})

export default router
