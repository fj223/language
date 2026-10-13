import assert from 'node:assert/strict'

const apiBaseUrl = process.env.E2E_API_BASE_URL || 'http://127.0.0.1:3100'
const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@openedu.local'
const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'change-me-admin-password'
process.env.DATABASE_URL ||= 'mysql://root:root@127.0.0.1:3406/jiaoyu'

const suffix = `e2e-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
const studentEmail = `${suffix}@student.openedu.local`
const analystEmail = `${suffix}-analyst@admin.openedu.local`
const policyEditorEmail = `${suffix}-policy@admin.openedu.local`
const contentManagerEmail = `${suffix}-content@admin.openedu.local`
const temporaryPassword = 'Temporary-Password-2026'
const courseTitle = `E2E 业务流程课程 ${suffix}`
const createdIds = {
  course: '',
  enrollment: '',
  student: '',
  admins: [],
}

async function api(path, { method = 'GET', token, adminToken, body } = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(adminToken ? { 'X-Admin-Token': adminToken } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const payload = await response.json().catch(() => null)
  return { status: response.status, payload }
}

function expectStatus(result, expected, label) {
  assert.equal(
    result.status,
    expected,
    `${label}: expected HTTP ${expected}, received ${result.status}: ${JSON.stringify(result.payload)}`,
  )
  return result.payload?.data
}

async function loginAdmin(email, password) {
  const result = await api('/api/admin/login', {
    method: 'POST',
    body: { email, password },
  })
  return expectStatus(result, 200, `admin login ${email}`).token
}

let prisma
try {
  const ready = await api('/api/ready')
  expectStatus(ready, 200, 'backend readiness')

  const superToken = await loginAdmin(adminEmail, adminPassword)

  const course = expectStatus(await api('/api/courses', {
    method: 'POST',
    adminToken: superToken,
    body: {
      title: courseTitle,
      language: '英语',
      level: 'B1',
      teacher: 'E2E 教师',
      schedule: '周六 10:00-12:00',
      description: '用于自动化业务闭环验证，测试完成后精确清理。',
      isPublished: true,
      resources: [{
        resource_type: 'external_link',
        source_url: 'https://example.edu/e2e-resource',
        title: 'E2E 课程资料',
      }],
    },
  }), 201, 'create published course')
  createdIds.course = course.id

  const adminInputs = [
    { email: analystEmail, name: 'E2E 数据分析员', role: 'ANALYST' },
    { email: policyEditorEmail, name: 'E2E 政策编辑', role: 'POLICY_EDITOR' },
    { email: contentManagerEmail, name: 'E2E 内容管理员', role: 'CONTENT_MANAGER' },
  ]
  for (const input of adminInputs) {
    const created = expectStatus(await api('/api/admin/users', {
      method: 'POST',
      adminToken: superToken,
      body: { ...input, password: temporaryPassword },
    }), 201, `create ${input.role}`)
    createdIds.admins.push(created.id)
  }

  const analystToken = await loginAdmin(analystEmail, temporaryPassword)
  const policyToken = await loginAdmin(policyEditorEmail, temporaryPassword)
  const contentToken = await loginAdmin(contentManagerEmail, temporaryPassword)

  const unifiedCatalog = expectStatus(
    await api('/api/courses?pageSize=50&locale=en', { adminToken: analystToken }),
    200,
    'analyst reads unified course catalog',
  )
  assert(
    unifiedCatalog.items.some((item) => item.id === createdIds.course && item.catalogSource === 'managed' && item.editable),
    'locally managed course must be editable in the unified catalog',
  )
  assert(
    unifiedCatalog.items.every((item) =>
      item.catalogSource === 'managed' ? item.editable : !item.editable
    ),
    'managed courses must be editable and integrated source courses must be read-only',
  )
  expectStatus(await api('/api/courses', {
    method: 'POST',
    adminToken: superToken,
    body: {
      title: `E2E 无资源课程 ${suffix}`,
      isPublished: true,
      resources: [],
    },
  }), 400, 'course creation requires at least one learning resource')
  expectStatus(await api('/api/courses', {
    method: 'POST',
    adminToken: analystToken,
    body: {
      title: 'must be denied',
      resources: [{ resource_type: 'external_link', source_url: 'https://example.edu/denied' }],
    },
  }), 403, 'analyst cannot create courses')
  expectStatus(await api('/api/admin/policies', { adminToken: policyToken }), 200, 'policy editor reads policies')
  expectStatus(await api('/api/admin/enrollments', { adminToken: policyToken }), 403, 'policy editor cannot read enrollments')
  expectStatus(await api('/api/admin/integration/status', { adminToken: analystToken }), 200, 'analyst reads integration status')

  const registration = expectStatus(await api('/api/register', {
    method: 'POST',
    body: {
      email: studentEmail,
      name: 'E2E 学生',
      password: temporaryPassword,
    },
  }), 201, 'register student')
  const studentToken = registration.token
  createdIds.student = registration.student.id

  const capabilities = expectStatus(
    await api('/api/chatbot/capabilities'),
    200,
    'read assistant capabilities',
  )
  assert.equal(typeof capabilities.flashcardGenerationEnabled, 'boolean')
  if (!capabilities.flashcardGenerationEnabled) {
    expectStatus(await api('/api/chatbot/flashcard', {
      method: 'POST',
      token: studentToken,
      body: { content: 'A test assistant answer.' },
    }), 503, 'disabled AI flashcard generation returns an explicit status')
  }

  const englishTimetableReply = expectStatus(await api('/api/chatbot', {
    method: 'POST',
    token: studentToken,
    body: {
      message: 'Show my timetable',
      history: [],
      locale: 'en',
    },
  }), 200, 'assistant localizes timetable data')
  assert.match(englishTimetableReply.reply, /English Speaking B2/)
  assert.match(englishTimetableReply.reply, /Building 3, Room 301/)
  assert.doesNotMatch(englishTimetableReply.reply, /英语口语|号楼|教室/)

  const russianGradesReply = expectStatus(await api('/api/chatbot', {
    method: 'POST',
    token: studentToken,
    body: {
      message: 'Show my grades',
      history: [],
      locale: 'ru',
    },
  }), 200, 'assistant localizes grade data')
  assert.match(russianGradesReply.reply, /Разговорный английский B2/)
  assert.match(russianGradesReply.reply, /Весна 2025/)
  assert.doesNotMatch(russianGradesReply.reply, /英语口语|春|秋/)

  const publicCourses = expectStatus(await api('/api/gateway/courses'), 200, 'list public courses')
  assert(publicCourses.some((item) => item.id === createdIds.course), 'published local course must appear in gateway')

  expectStatus(await api(`/api/favorites/${createdIds.course}`, {
    method: 'POST',
    token: studentToken,
  }), 201, 'favorite course')
  const favorites = expectStatus(await api('/api/favorites', { token: studentToken }), 200, 'list favorites')
  assert(favorites.some((item) => item.courseId === createdIds.course), 'favorite must be visible to its student')

  const reminder = expectStatus(await api('/api/reminders', {
    method: 'POST',
    token: studentToken,
    body: {
      title: '完成 E2E 课程复习',
      courseId: createdIds.course,
      note: '自动化测试提醒',
      remindAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  }), 201, 'create reminder')
  const completedReminder = expectStatus(await api(`/api/reminders/${reminder.id}`, {
    method: 'PATCH',
    token: studentToken,
    body: { completed: true },
  }), 200, 'complete reminder')
  assert(completedReminder.completedAt, 'completed reminder must contain completedAt')

  const enrollment = expectStatus(await api(`/api/enrollments/${createdIds.course}`, {
    method: 'POST',
    token: studentToken,
    body: { studentNote: '希望参加周末班' },
  }), 201, 'submit enrollment')
  createdIds.enrollment = enrollment.id

  expectStatus(await api(`/api/enrollments/${createdIds.course}`, {
    method: 'POST',
    token: studentToken,
    body: {},
  }), 409, 'reject duplicate pending enrollment')

  expectStatus(await api(`/api/enrollments/${createdIds.enrollment}/cancel`, {
    method: 'PATCH',
    token: studentToken,
  }), 200, 'cancel pending enrollment')
  expectStatus(await api(`/api/enrollments/${createdIds.enrollment}/cancel`, {
    method: 'PATCH',
    token: studentToken,
  }), 409, 'reject duplicate cancellation')

  expectStatus(await api(`/api/enrollments/${createdIds.course}`, {
    method: 'POST',
    token: studentToken,
    body: { studentNote: '调整后重新申请' },
  }), 200, 'resubmit cancelled enrollment')

  const approved = expectStatus(await api(`/api/admin/enrollments/${createdIds.enrollment}`, {
    method: 'PATCH',
    adminToken: contentToken,
    body: { status: 'APPROVED', adminNote: '自动化审核通过' },
  }), 200, 'content manager approves enrollment')
  assert.equal(approved.status, 'APPROVED')

  expectStatus(await api(`/api/enrollments/${createdIds.enrollment}/cancel`, {
    method: 'PATCH',
    token: studentToken,
  }), 409, 'student cannot directly cancel approved enrollment')
  expectStatus(await api(`/api/admin/enrollments/${createdIds.enrollment}`, {
    method: 'PATCH',
    adminToken: contentToken,
    body: { status: 'REJECTED' },
  }), 409, 'administrator cannot review completed enrollment twice')

  const enrollments = expectStatus(await api('/api/enrollments', { token: studentToken }), 200, 'student reads enrollment result')
  const finalEnrollment = enrollments.find((item) => item.id === createdIds.enrollment)
  assert.equal(finalEnrollment?.status, 'APPROVED')
  assert.equal(finalEnrollment?.adminNote, '自动化审核通过')

  console.log('business workflow e2e: identity permissions, favorites, reminders and enrollment lifecycle passed')
} finally {
  try {
    const { PrismaClient } = await import('@prisma/client')
    prisma = new PrismaClient()
    const targetIds = [
      createdIds.course,
      createdIds.enrollment,
      createdIds.student,
      ...createdIds.admins,
    ].filter(Boolean)
    await prisma.adminAuditLog.deleteMany({
      where: {
        OR: [
          ...(targetIds.length ? [{ targetId: { in: targetIds } }] : []),
          { actorId: { in: createdIds.admins } },
          { summary: { contains: suffix } },
        ],
      },
    })
    await prisma.student.deleteMany({ where: { email: studentEmail } })
    await prisma.course.deleteMany({ where: { title: courseTitle } })
    await prisma.adminUser.deleteMany({
      where: { email: { in: [analystEmail, policyEditorEmail, contentManagerEmail] } },
    })
  } catch (cleanupError) {
    console.error(`e2e cleanup failed for prefix ${suffix}:`, cleanupError)
    process.exitCode = 1
  } finally {
    await prisma?.$disconnect()
  }
}
