import { EnrollmentStatus } from '@prisma/client'

export type EnrollmentTransitionResult =
  | { allowed: true }
  | { allowed: false; error: string }

export function canSubmitEnrollment(
  currentStatus: EnrollmentStatus | null | undefined,
): EnrollmentTransitionResult {
  if (!currentStatus || currentStatus === EnrollmentStatus.REJECTED || currentStatus === EnrollmentStatus.CANCELLED) {
    return { allowed: true }
  }
  if (currentStatus === EnrollmentStatus.PENDING) {
    return { allowed: false, error: '该课程已有待审核申请，请勿重复提交' }
  }
  return { allowed: false, error: '该课程报名已经通过，无需重复提交' }
}

export function canCancelEnrollment(
  currentStatus: EnrollmentStatus,
): EnrollmentTransitionResult {
  if (currentStatus === EnrollmentStatus.PENDING) return { allowed: true }
  if (currentStatus === EnrollmentStatus.CANCELLED) {
    return { allowed: false, error: '报名申请已经取消' }
  }
  if (currentStatus === EnrollmentStatus.APPROVED) {
    return { allowed: false, error: '已通过的报名不能直接取消，请联系教务人员处理' }
  }
  return { allowed: false, error: '已拒绝的申请无需取消，可修改信息后重新提交' }
}

export function canReviewEnrollment(
  currentStatus: EnrollmentStatus,
): EnrollmentTransitionResult {
  if (currentStatus === EnrollmentStatus.PENDING) return { allowed: true }
  if (currentStatus === EnrollmentStatus.CANCELLED) {
    return { allowed: false, error: '学生已取消申请，不能继续审核' }
  }
  return { allowed: false, error: '该申请已经完成审核，不能重复审核' }
}
