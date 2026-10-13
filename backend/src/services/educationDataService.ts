import {
  MOCK_COURSES,
  MOCK_GRADES,
  MOCK_TIMETABLE,
  type GatewayCourse,
  type GradeEntry,
  type TimetableEntry,
} from './mockEducationData.js'
import { prisma } from '../db/prisma.js'
import {
  localizeCourse,
  localizeGrades,
  localizeTimetable,
  normalizeContentLocale,
} from './contentLocalization.js'

export type EducationDataSource = 'mock' | 'external'
export type CourseCatalogSource = 'managed' | 'demo' | 'external'

export type AdminCatalogCourse = GatewayCourse & {
  catalogSource: CourseCatalogSource
  editable: boolean
  isPublished: boolean
  isArchived: boolean
  archivedAt: string | null
  archivedBy: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type EducationDataResult<T> = {
  data: T
  source: EducationDataSource
  fetchedAt: string
  degraded?: boolean
}

export type EducationCourseQuery = {
  language?: string
  q?: string
  locale?: string
}

export type IntegrationStatus = {
  provider: EducationDataSource
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

export type { GatewayCourse, GradeEntry, TimetableEntry }

export class EducationDataError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 502,
  ) {
    super(message)
    this.name = 'EducationDataError'
  }
}

const COURSE_CACHE_TTL_MS = 5 * 60 * 1000
const COURSE_STALE_MAX_AGE_MS = 30 * 60 * 1000
let courseCache: { data: GatewayCourse[]; expiresAt: number; fetchedAt: string } | null = null
const integrationTelemetry: IntegrationStatus['telemetry'] = {
  requestCount: 0,
  attemptCount: 0,
  successCount: 0,
  failureCount: 0,
  retryCount: 0,
  lastSuccessAt: null,
  lastFailureAt: null,
  lastError: null,
  lastLatencyMs: null,
}

function getProvider(): EducationDataSource {
  return process.env.EDU_DATA_PROVIDER?.trim().toLowerCase() === 'external'
    ? 'external'
    : 'mock'
}

function externalConfig() {
  const baseUrl = process.env.EDU_API_BASE_URL?.trim().replace(/\/+$/, '') ?? ''
  const apiKey = process.env.EDU_API_KEY?.trim() ?? ''
  const parsedTimeout = Number(process.env.EDU_API_TIMEOUT_MS ?? 8000)
  const timeoutMs = Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : 8000
  const parsedRetryCount = Number(process.env.EDU_API_RETRY_COUNT ?? 1)
  const retryCount = Number.isInteger(parsedRetryCount) && parsedRetryCount >= 0 && parsedRetryCount <= 3
    ? parsedRetryCount
    : 1
  return { baseUrl, apiKey, timeoutMs, retryCount }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function unwrapArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  const record = asRecord(value)
  if (record && Array.isArray(record.data)) return record.data
  throw new EducationDataError('Institutional API returned an invalid payload')
}

function requiredString(record: Record<string, unknown>, key: string): string {
  const value = record[key]
  if (typeof value !== 'string' || !value.trim()) {
    throw new EducationDataError(`Institutional API field "${key}" is invalid`)
  }
  return value.trim()
}

function nullableString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key]
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string') {
    throw new EducationDataError(`Institutional API field "${key}" is invalid`)
  }
  return value.trim() || null
}

function requiredNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key]
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new EducationDataError(`Institutional API field "${key}" is invalid`)
  }
  return value
}

class ExternalRequestFailure extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean,
  ) {
    super(message)
    this.name = 'ExternalRequestFailure'
  }
}

function waitBeforeRetry(attempt: number) {
  return new Promise((resolve) => setTimeout(resolve, 150 * (2 ** attempt)))
}

async function fetchExternal(path: string): Promise<unknown> {
  const { baseUrl, apiKey, timeoutMs, retryCount } = externalConfig()
  if (!baseUrl) {
    throw new EducationDataError('Institutional API is not configured', 503)
  }

  const startedAt = Date.now()
  integrationTelemetry.requestCount += 1
  let lastFailure = 'Institutional API request failed'

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    integrationTelemetry.attemptCount += 1
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        headers: {
          Accept: 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        signal: AbortSignal.timeout(timeoutMs),
      })
      if (!response.ok) {
        throw new ExternalRequestFailure(
          `HTTP ${response.status}`,
          response.status === 408 || response.status === 429 || response.status >= 500,
        )
      }
      const payload = await response.json()
      integrationTelemetry.successCount += 1
      integrationTelemetry.lastSuccessAt = new Date().toISOString()
      integrationTelemetry.lastError = null
      integrationTelemetry.lastLatencyMs = Date.now() - startedAt
      return payload
    } catch (error) {
      const failure = error instanceof ExternalRequestFailure
        ? error
        : new ExternalRequestFailure(error instanceof Error ? error.message : 'network error', true)
      lastFailure = failure.message
      const canRetry = failure.retryable && attempt < retryCount
      if (canRetry) {
        integrationTelemetry.retryCount += 1
        console.warn(`[education-data] retrying external request path=${path} attempt=${attempt + 2}`)
        await waitBeforeRetry(attempt)
        continue
      }
      break
    }
  }

  integrationTelemetry.failureCount += 1
  integrationTelemetry.lastFailureAt = new Date().toISOString()
  integrationTelemetry.lastError = lastFailure
  integrationTelemetry.lastLatencyMs = Date.now() - startedAt
  console.error(`[education-data] external request failed path=${path} reason=${lastFailure}`)
  throw new EducationDataError('Institutional API is temporarily unavailable', 502)
}

function normalizeCourses(payload: unknown): GatewayCourse[] {
  return unwrapArray(payload).map((item) => {
    const record = asRecord(item)
    if (!record) throw new EducationDataError('Institutional API returned an invalid course')
    return {
      id: requiredString(record, 'id'),
      title: requiredString(record, 'title'),
      level: nullableString(record, 'level'),
      schedule: nullableString(record, 'schedule'),
      teacher: nullableString(record, 'teacher'),
      language: requiredString(record, 'language'),
      coverUrl: nullableString(record, 'coverUrl'),
    }
  })
}

function normalizeTimetable(payload: unknown): TimetableEntry[] {
  return unwrapArray(payload).map((item) => {
    const record = asRecord(item)
    if (!record) throw new EducationDataError('Institutional API returned an invalid timetable entry')
    const dayOfWeek = requiredNumber(record, 'dayOfWeek')
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
      throw new EducationDataError('Institutional API field "dayOfWeek" is invalid')
    }
    return {
      dayOfWeek,
      courseName: requiredString(record, 'courseName'),
      startTime: requiredString(record, 'startTime'),
      endTime: requiredString(record, 'endTime'),
      location: requiredString(record, 'location'),
    }
  })
}

function normalizeGrades(payload: unknown): GradeEntry[] {
  return unwrapArray(payload).map((item) => {
    const record = asRecord(item)
    if (!record) throw new EducationDataError('Institutional API returned an invalid grade entry')
    const gradeValue = record.grade
    const grade = gradeValue === null || gradeValue === undefined
      ? null
      : requiredNumber(record, 'grade')
    const attendanceRate = requiredNumber(record, 'attendanceRate')
    if (
      (grade !== null && (grade < 0 || grade > 100)) ||
      attendanceRate < 0 ||
      attendanceRate > 100
    ) {
      throw new EducationDataError('Institutional API returned an out-of-range grade')
    }
    return {
      courseName: requiredString(record, 'courseName'),
      semester: requiredString(record, 'semester'),
      grade,
      attendanceRate,
    }
  })
}

function filterCourses(courses: GatewayCourse[], query: EducationCourseQuery) {
  let result = [...courses]
  if (query.language?.trim()) {
    const language = query.language.trim()
    result = result.filter((course) => course.language === language)
  }
  if (query.q?.trim()) {
    const keyword = query.q.trim().toLowerCase()
    result = result.filter(
      (course) =>
        course.title.toLowerCase().includes(keyword) ||
        Boolean(course.teacher?.toLowerCase().includes(keyword)),
    )
  }
  return result
}

function localizeAndFilterCourses(courses: GatewayCourse[], query: EducationCourseQuery) {
  const locale = normalizeContentLocale(query.locale)
  return filterCourses(courses.map((course) => localizeCourse(course, locale)), query)
}

async function getLocalCourses(publishedOnly: boolean): Promise<Array<GatewayCourse & {
  isPublished: boolean
  isArchived: boolean
  archivedAt: string | null
  archivedBy: string | null
  createdAt: string
  updatedAt: string
}>> {
  try {
    const courses = await prisma.course.findMany({
      ...(publishedOnly ? { where: { isPublished: true, isArchived: false } } : {}),
      include: { videoResources: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
    })
    return courses.map((course) => ({
      id: course.id,
      title: course.title,
      level: course.level,
      schedule: course.schedule,
      teacher: course.teacher,
      language: course.language,
      coverUrl: course.coverUrl,
      description: course.description,
      translations: course.translations,
      managedLocally: true,
      isPublished: course.isPublished,
      isArchived: course.isArchived,
      archivedAt: course.archivedAt?.toISOString() ?? null,
      archivedBy: course.archivedBy,
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
      resources: course.videoResources.map((resource) => ({
        id: resource.id,
        resourceType: resource.resourceType,
        sourceUrl: resource.sourceUrl,
        title: resource.title,
        translations: resource.translations,
      })),
    }))
  } catch (error) {
    console.error('[education-data] local course catalog unavailable', error)
    return []
  }
}

async function getPublishedLocalCourses(): Promise<GatewayCourse[]> {
  return getLocalCourses(true)
}

async function getManagedCourseIds() {
  try {
    const courses = await prisma.course.findMany({ select: { id: true } })
    return new Set(courses.map((course) => course.id))
  } catch {
    return new Set<string>()
  }
}

function mergeCoursesById(primary: GatewayCourse[], secondary: GatewayCourse[]): GatewayCourse[] {
  const merged = new Map<string, GatewayCourse>()
  for (const course of [...primary, ...secondary]) {
    if (!merged.has(course.id)) merged.set(course.id, course)
  }
  return [...merged.values()]
}

export async function getEducationCourses(
  query: EducationCourseQuery = {},
): Promise<EducationDataResult<GatewayCourse[]>> {
  const source = getProvider()
  const [localCourses, managedIds] = await Promise.all([getPublishedLocalCourses(), getManagedCourseIds()])
  const withoutManagedDuplicates = (courses: GatewayCourse[]) => courses.filter((course) => !managedIds.has(course.id))
  if (source === 'mock') {
    return {
      data: localizeAndFilterCourses(mergeCoursesById(localCourses, withoutManagedDuplicates(MOCK_COURSES)), query),
      source,
      fetchedAt: new Date().toISOString(),
    }
  }

  const now = Date.now()
  if (!courseCache || courseCache.expiresAt <= now) {
    try {
      const fetchedAt = new Date().toISOString()
      courseCache = {
        data: normalizeCourses(await fetchExternal('/courses')),
        expiresAt: now + COURSE_CACHE_TTL_MS,
        fetchedAt,
      }
    } catch (error) {
      const cacheAge = courseCache ? now - Date.parse(courseCache.fetchedAt) : Number.POSITIVE_INFINITY
      if (courseCache && cacheAge <= COURSE_STALE_MAX_AGE_MS) {
        return {
          data: localizeAndFilterCourses(mergeCoursesById(localCourses, withoutManagedDuplicates(courseCache.data)), query),
          source,
          fetchedAt: courseCache.fetchedAt,
          degraded: true,
        }
      }
      throw error
    }
  }
  return {
    data: localizeAndFilterCourses(mergeCoursesById(localCourses, withoutManagedDuplicates(courseCache.data)), query),
    source,
    fetchedAt: courseCache.fetchedAt,
  }
}

export async function getAdminCourseCatalog(requestedLocale?: string): Promise<{
  data: AdminCatalogCourse[]
  source: EducationDataSource
  fetchedAt: string
  degraded?: boolean
}> {
  const locale = normalizeContentLocale(requestedLocale)
  const managed = await getLocalCourses(false)
  const integrated = await getEducationCourses({ locale })
  const sourceCourses = integrated.data.filter((course) => !course.managedLocally)
  const managedIds = new Set(managed.map((course) => course.id))

  const managedEntries: AdminCatalogCourse[] = managed.map((course) => ({
    ...localizeCourse(course, locale),
    catalogSource: 'managed',
    editable: true,
    isPublished: course.isPublished,
    isArchived: course.isArchived,
    archivedAt: course.archivedAt,
    archivedBy: course.archivedBy,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  }))
  const sourceEntries: AdminCatalogCourse[] = sourceCourses
    .filter((course) => !managedIds.has(course.id))
    .map((course) => ({
      ...course,
      catalogSource: integrated.source === 'mock' ? 'demo' : 'external',
      editable: false,
      isPublished: true,
      isArchived: false,
      archivedAt: null,
      archivedBy: null,
      createdAt: null,
      updatedAt: null,
    }))

  return {
    data: [...managedEntries, ...sourceEntries],
    source: integrated.source,
    fetchedAt: integrated.fetchedAt,
    ...(integrated.degraded ? { degraded: true } : {}),
  }
}

export async function getStudentTimetable(
  studentId: string,
  requestedLocale?: string,
): Promise<EducationDataResult<TimetableEntry[]>> {
  const source = getProvider()
  const fetchedAt = new Date().toISOString()
  const locale = normalizeContentLocale(requestedLocale)
  if (source === 'mock') return { data: localizeTimetable(MOCK_TIMETABLE, locale), source, fetchedAt }
  return {
    data: localizeTimetable(
      normalizeTimetable(await fetchExternal(`/students/${encodeURIComponent(studentId)}/timetable`)),
      locale,
    ),
    source,
    fetchedAt,
  }
}

export async function getStudentGrades(
  studentId: string,
  requestedLocale?: string,
): Promise<EducationDataResult<GradeEntry[]>> {
  const source = getProvider()
  const fetchedAt = new Date().toISOString()
  const locale = normalizeContentLocale(requestedLocale)
  if (source === 'mock') return { data: localizeGrades(MOCK_GRADES, locale), source, fetchedAt }
  return {
    data: localizeGrades(
      normalizeGrades(await fetchExternal(`/students/${encodeURIComponent(studentId)}/grades`)),
      locale,
    ),
    source,
    fetchedAt,
  }
}

export function getIntegrationStatus(): IntegrationStatus {
  const provider = getProvider()
  const configured = provider === 'mock' || Boolean(externalConfig().baseUrl)
  const now = Date.now()
  const cacheAge = courseCache ? now - Date.parse(courseCache.fetchedAt) : Number.POSITIVE_INFINITY
  const cacheState: IntegrationStatus['courseCache']['state'] = !courseCache
    ? 'empty'
    : courseCache.expiresAt > now
      ? 'fresh'
      : cacheAge <= COURSE_STALE_MAX_AGE_MS
        ? 'stale'
        : 'expired'
  return {
    provider,
    configured,
    label: provider === 'mock' ? '演示数据' : configured ? '机构系统已连接' : '机构系统未配置',
    checkedAt: new Date().toISOString(),
    courseCache: {
      state: cacheState,
      itemCount: courseCache?.data.length ?? 0,
      fetchedAt: courseCache?.fetchedAt ?? null,
      expiresAt: courseCache ? new Date(courseCache.expiresAt).toISOString() : null,
    },
    telemetry: { ...integrationTelemetry },
  }
}
