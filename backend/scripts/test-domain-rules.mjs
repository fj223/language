import assert from 'node:assert/strict'
import { AdminRole, EnrollmentStatus } from '@prisma/client'
import { permissionsForRole } from '../dist/middleware/adminAuth.js'
import {
  canCancelEnrollment,
  canReviewEnrollment,
  canSubmitEnrollment,
} from '../dist/services/enrollmentWorkflow.js'
import {
  findSuspiciousCourseTextField,
  hasSuspiciousReplacementCharacters,
} from '../dist/services/courseContentValidation.js'

const expectedPermissions = {
  [AdminRole.SUPER_ADMIN]: [
    'course.read',
    'course.write',
    'policy.read',
    'policy.write',
    'feedback.read',
    'enrollment.read',
    'enrollment.write',
    'admin.manage',
  ],
  [AdminRole.CONTENT_MANAGER]: [
    'course.read',
    'course.write',
    'policy.read',
    'feedback.read',
    'enrollment.read',
    'enrollment.write',
  ],
  [AdminRole.POLICY_EDITOR]: [
    'course.read',
    'policy.read',
    'policy.write',
    'feedback.read',
  ],
  [AdminRole.ANALYST]: [
    'course.read',
    'policy.read',
    'feedback.read',
    'enrollment.read',
  ],
}

for (const role of Object.values(AdminRole)) {
  assert.deepEqual(permissionsForRole(role), expectedPermissions[role], `${role} permission matrix changed`)
}

assert.equal(canSubmitEnrollment(undefined).allowed, true)
assert.equal(canSubmitEnrollment(EnrollmentStatus.REJECTED).allowed, true)
assert.equal(canSubmitEnrollment(EnrollmentStatus.CANCELLED).allowed, true)
assert.equal(canSubmitEnrollment(EnrollmentStatus.PENDING).allowed, false)
assert.equal(canSubmitEnrollment(EnrollmentStatus.APPROVED).allowed, false)

assert.equal(canCancelEnrollment(EnrollmentStatus.PENDING).allowed, true)
assert.equal(canCancelEnrollment(EnrollmentStatus.APPROVED).allowed, false)
assert.equal(canCancelEnrollment(EnrollmentStatus.REJECTED).allowed, false)
assert.equal(canCancelEnrollment(EnrollmentStatus.CANCELLED).allowed, false)

assert.equal(canReviewEnrollment(EnrollmentStatus.PENDING).allowed, true)
assert.equal(canReviewEnrollment(EnrollmentStatus.APPROVED).allowed, false)
assert.equal(canReviewEnrollment(EnrollmentStatus.REJECTED).allowed, false)
assert.equal(canReviewEnrollment(EnrollmentStatus.CANCELLED).allowed, false)

assert.equal(hasSuspiciousReplacementCharacters('雅思 7 分冲刺班'), false)
assert.equal(hasSuspiciousReplacementCharacters('周一/周三/周五 19:00–21:00'), false)
assert.equal(hasSuspiciousReplacementCharacters('English?'), false)
assert.equal(hasSuspiciousReplacementCharacters('?? 7 ????'), true)
assert.equal(hasSuspiciousReplacementCharacters('??/??/?? 19:00-21:00'), true)
assert.equal(findSuspiciousCourseTextField({
  title: '雅思 7 分冲刺班',
  language: '??',
  teacher: '张晓明老师',
}), 'language')

console.log('domain rules: RBAC, enrollment transitions, and course text validation passed')
