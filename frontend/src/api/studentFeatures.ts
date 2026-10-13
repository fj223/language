import { http } from './http'

export type CourseFavorite = {
  id: string
  courseId: string
  title: string
  language: string
  level: string | null
  teacher: string | null
  schedule: string | null
  coverUrl: string | null
  createdAt: string
}

export type LearningReminder = {
  id: string
  title: string
  note: string | null
  courseId: string | null
  remindAt: string
  completedAt: string | null
  createdAt: string
}

export type EnrollmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export type EnrollmentApplication = {
  id: string
  courseId: string
  courseTitle: string
  language: string
  level: string | null
  teacher: string | null
  schedule: string | null
  status: EnrollmentStatus
  studentNote: string | null
  adminNote: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
}

type ApiOk<T> = { ok: boolean; data: T }

export async function getFavorites(locale?: string) {
  const response = await http.get<ApiOk<CourseFavorite[]>>('/api/favorites', {
    params: locale ? { locale } : {},
  })
  return response.data.data
}

export async function addFavorite(courseId: string) {
  const response = await http.post<ApiOk<CourseFavorite>>(`/api/favorites/${courseId}`)
  return response.data.data
}

export async function removeFavorite(courseId: string) {
  await http.delete(`/api/favorites/${courseId}`)
}

export async function getReminders() {
  const response = await http.get<ApiOk<LearningReminder[]>>('/api/reminders')
  return response.data.data
}

export async function createReminder(input: { title: string; note?: string; courseId?: string; remindAt: string }) {
  const response = await http.post<ApiOk<LearningReminder>>('/api/reminders', input)
  return response.data.data
}

export async function setReminderCompleted(id: string, completed: boolean) {
  const response = await http.patch<ApiOk<LearningReminder>>(`/api/reminders/${id}`, { completed })
  return response.data.data
}

export async function deleteReminder(id: string) {
  await http.delete(`/api/reminders/${id}`)
}

export async function getEnrollments(locale?: string) {
  const response = await http.get<ApiOk<EnrollmentApplication[]>>('/api/enrollments', {
    params: locale ? { locale } : {},
  })
  return response.data.data
}

export async function submitEnrollment(courseId: string, studentNote?: string) {
  const response = await http.post<ApiOk<EnrollmentApplication>>(`/api/enrollments/${courseId}`, {
    studentNote,
  })
  return response.data.data
}

export async function cancelEnrollment(id: string) {
  const response = await http.patch<ApiOk<EnrollmentApplication>>(`/api/enrollments/${id}/cancel`)
  return response.data.data
}
