import bcrypt from 'bcryptjs'
import { AdminRole } from '@prisma/client'
import { prisma } from '../db/prisma.js'

export async function ensureBootstrapAdmin() {
  const email = (process.env.ADMIN_BOOTSTRAP_EMAIL || '').trim().toLowerCase()
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || ''
  if (!email || !password) {
    console.warn('[admin] bootstrap account is not configured')
    return
  }
  if (password.length < 10) {
    throw new Error('ADMIN_BOOTSTRAP_PASSWORD must contain at least 10 characters')
  }

  const existingCount = await prisma.adminUser.count()
  if (existingCount > 0) return

  await prisma.adminUser.create({
    data: {
      email,
      name: (process.env.ADMIN_BOOTSTRAP_NAME || '系统管理员').trim(),
      passwordHash: await bcrypt.hash(password, 12),
      role: AdminRole.SUPER_ADMIN,
    },
  })
  console.warn(`[admin] initial administrator created: ${email}; change the bootstrap password after first deployment`)
}
