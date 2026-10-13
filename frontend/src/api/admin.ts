import { http } from './http'
import type { IntegrationStatus } from './gateway'

export type AdminRole = 'SUPER_ADMIN' | 'CONTENT_MANAGER' | 'POLICY_EDITOR' | 'ANALYST'
export type AdminPermission =
  | 'course.read'
  | 'course.write'
  | 'policy.read'
  | 'policy.write'
  | 'feedback.read'
  | 'enrollment.read'
  | 'enrollment.write'
  | 'admin.manage'

export type AdminInfo = {
  id: string
  email: string
  name: string
  role: AdminRole
  permissions: AdminPermission[]
}

export type SchoolPolicy = {
  id: string
  title: string
  keywords: string[]
  summary: string
  guidance: string
  owner: string
  isPublished: boolean
  version: number
  updatedAt: string
}

export type AdminUserRecord = AdminInfo & {
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

export type EnrollmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export type AdminEnrollment = {
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
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
  student: { id: string; name: string; email: string }
}

export type AdminAuditLog = {
  id: string
  actorEmail: string
  actorName: string
  actorRole: AdminRole
  action: string
  targetType: string
  targetId: string | null
  summary: string
  metadata: unknown
  createdAt: string
}

type ApiOk<T> = { ok: boolean; data: T; error?: string }

export async function loginAdmin(input: { email: string; password: string }) {
  const response = await http.post<ApiOk<{ token: string; admin: AdminInfo }>>('/api/admin/login', input)
  return response.data.data
}

export async function getAdminMe() {
  const response = await http.get<ApiOk<AdminInfo>>('/api/admin/me')
  return response.data.data
}

export async function getPolicies() {
  const response = await http.get<ApiOk<SchoolPolicy[]>>('/api/admin/policies')
  return response.data.data
}

export type PolicyInput = Omit<SchoolPolicy, 'version' | 'updatedAt'>

export async function createPolicy(input: PolicyInput) {
  const response = await http.post<ApiOk<SchoolPolicy>>('/api/admin/policies', input)
  return response.data.data
}

export async function updatePolicy(id: string, input: PolicyInput) {
  const response = await http.put<ApiOk<SchoolPolicy>>(`/api/admin/policies/${id}`, input)
  return response.data.data
}

export async function unpublishPolicy(id: string) {
  const response = await http.delete<ApiOk<{ id: string; isPublished: boolean; version: number }>>(`/api/admin/policies/${id}`)
  return response.data.data
}

export async function getAdminUsers() {
  const response = await http.get<ApiOk<AdminUserRecord[]>>('/api/admin/users')
  return response.data.data
}

export async function createAdminUser(input: { email: string; name: string; password: string; role: AdminRole }) {
  const response = await http.post<ApiOk<AdminUserRecord>>('/api/admin/users', input)
  return response.data.data
}

export async function updateAdminUser(id: string, input: { name: string; role: AdminRole; isActive: boolean }) {
  const response = await http.patch<ApiOk<AdminUserRecord>>(`/api/admin/users/${id}`, input)
  return response.data.data
}

export async function resetAdminPassword(id: string, password: string) {
  await http.post(`/api/admin/users/${id}/reset-password`, { password })
}

export async function changeAdminPassword(input: { currentPassword: string; newPassword: string }) {
  await http.post('/api/admin/change-password', input)
}

export async function getAdminAuditLogs(limit = 50) {
  const response = await http.get<ApiOk<AdminAuditLog[]>>('/api/admin/audit-logs', { params: { limit } })
  return response.data.data
}

export async function getAdminIntegrationStatus() {
  const response = await http.get<ApiOk<IntegrationStatus>>('/api/admin/integration/status')
  return response.data.data
}

export async function getAdminEnrollments(status?: EnrollmentStatus, locale?: string) {
  const response = await http.get<ApiOk<AdminEnrollment[]>>('/api/admin/enrollments', {
    params: {
      ...(status ? { status } : {}),
      ...(locale ? { locale } : {}),
    },
  })
  return response.data.data
}

export async function reviewEnrollment(
  id: string,
  input: { status: 'APPROVED' | 'REJECTED'; adminNote?: string },
) {
  const response = await http.patch<ApiOk<AdminEnrollment>>(`/api/admin/enrollments/${id}`, input)
  return response.data.data
}
