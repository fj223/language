import type { Prisma } from '@prisma/client'
import type { AdminJwtPayload } from '../middleware/adminAuth.js'
import { prisma } from '../db/prisma.js'

type AuditInput = {
  actor: AdminJwtPayload
  action: string
  targetType: string
  targetId?: string | null
  summary: string
  metadata?: Prisma.InputJsonValue
}

export async function recordAdminAudit(input: AuditInput) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId: input.actor.adminId,
        actorEmail: input.actor.email,
        actorName: input.actor.name,
        actorRole: input.actor.role,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId ?? null,
        summary: input.summary,
        ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
      },
    })
  } catch (error) {
    console.error('[admin-audit] failed to record action', error)
  }
}
