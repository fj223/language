import { http } from './http'

export type VideoResourceType = 'local' | 'youtube' | 'bilibili' | 'external_link'

export type VideoResourceDto = {
  id: string
  courseId: string
  resource_type: VideoResourceType
  source_url: string
  title: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type CourseDto = {
  id: string
  title: string
  coverUrl: string | null
  description: string | null
  createdAt: string
  updatedAt: string
  resources: VideoResourceDto[]
}

type ApiResponse<T> = {
  ok: boolean
  data: T
  error?: string
}

export type CourseListQuery = {
  q?: string
  resource_type?: VideoResourceType
  page?: number
  pageSize?: 10 | 20 | 50
}

export type CourseListResult = {
  items: CourseDto[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export async function getCourses(query: CourseListQuery = {}) {
  const res = await http.get<ApiResponse<CourseListResult>>('/api/courses', { params: query })
  return res.data.data
}

export async function getCourseById(courseId: string) {
  const res = await http.get<ApiResponse<CourseDto>>(`/api/courses/${courseId}`)
  return res.data.data
}

export async function reportCourseProgress(courseId: string, resourceId: string) {
  const res = await http.post<ApiResponse<{ recorded: boolean }>>(`/api/courses/${courseId}/progress`, {
    resourceId,
  })
  return res.data.data
}

// --- Phase 3: Progress types & functions ---

export type ProgressDto = {
  studyRecordId?: string
  lastPositionSeconds: number
  isCompleted: boolean
  progressPercent: number
}

export type ReportProgressResult = {
  recorded: boolean
  studyRecordId: string
  isCompleted: boolean
  lastPositionSeconds: number
  note: string
}

export async function getCourseProgress(courseId: string): Promise<ProgressDto> {
  const res = await http.get<ApiResponse<ProgressDto>>(`/api/courses/${courseId}/progress`)
  return res.data.data
}

export async function reportProgress(
  courseId: string,
  payload: { currentTime: number; duration?: number },
): Promise<ReportProgressResult> {
  const res = await http.post<ApiResponse<ReportProgressResult>>(
    `/api/courses/${courseId}/progress`,
    payload,
  )
  return res.data.data
}

export type CreateCourseInput = {
  title: string
  coverUrl?: string
  description?: string
  resources: Array<{
    resource_type: VideoResourceType
    source_url: string
    title?: string
    sortOrder?: number
  }>
}

export async function createCourse(input: CreateCourseInput) {
  const res = await http.post<ApiResponse<CourseDto>>('/api/courses', input)
  return res.data.data
}

export async function deleteCourse(courseId: string) {
  const res = await http.delete<ApiResponse<{ id: string }>>(`/api/courses/${courseId}`)
  return res.data.data
}

export type UpdateCourseInput = {
  title: string
  coverUrl?: string
  description?: string
  resources?: Array<{
    id?: string
    resource_type: VideoResourceType
    source_url: string
    title?: string
    sortOrder?: number
  }>
}

// --- Resource CRUD types & functions ---

export type ResourceInput = {
  resource_type: VideoResourceType
  source_url: string
  title?: string
}

export async function updateCourse(courseId: string, input: UpdateCourseInput) {
  const res = await http.put<ApiResponse<CourseDto>>(`/api/courses/${courseId}`, input)
  return res.data.data
}

export async function addResource(courseId: string, input: ResourceInput): Promise<VideoResourceDto> {
  const res = await http.post<ApiResponse<VideoResourceDto>>(`/api/courses/${courseId}/resources`, input)
  return res.data.data
}

export async function updateResource(courseId: string, resourceId: string, input: ResourceInput): Promise<VideoResourceDto> {
  const res = await http.put<ApiResponse<VideoResourceDto>>(`/api/courses/${courseId}/resources/${resourceId}`, input)
  return res.data.data
}

export async function deleteResource(courseId: string, resourceId: string): Promise<{ id: string }> {
  const res = await http.delete<ApiResponse<{ id: string }>>(`/api/courses/${courseId}/resources/${resourceId}`)
  return res.data.data
}

export async function sortResources(courseId: string, resourceIds: string[]): Promise<CourseDto> {
  const res = await http.put<ApiResponse<CourseDto>>(`/api/courses/${courseId}/resources/sort`, { resourceIds })
  return res.data.data
}
