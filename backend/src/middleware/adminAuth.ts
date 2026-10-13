import type { Request, RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import { AdminRole } from '@prisma/client'
import { prisma } from '../db/prisma.js'
import { sendError } from '../lib/apiResponse.js'

export type AdminPermission =
  | 'course.read'
  | 'course.write'
  | 'policy.read'
  | 'policy.write'
  | 'feedback.read'
  | 'enrollment.read'
  | 'enrollment.write'
  | 'admin.manage'

export interface AdminJwtPayload {
  adminId: string
  email: string
  name: string
  role: AdminRole
}

const ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]> = {
  SUPER_ADMIN: ['course.read', 'course.write', 'policy.read', 'policy.write', 'feedback.read', 'enrollment.read', 'enrollment.write', 'admin.manage'],
  CONTENT_MANAGER: ['course.read', 'course.write', 'policy.read', 'feedback.read', 'enrollment.read', 'enrollment.write'],
  POLICY_EDITOR: ['course.read', 'policy.read', 'policy.write', 'feedback.read'],
  ANALYST: ['course.read', 'policy.read', 'feedback.read', 'enrollment.read'],
}

declare global {
  namespace Express {
    interface Request {
      admin?: AdminJwtPayload
    }
  }
}

function getAdminSecret() {
  return process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'dev-admin-jwt-secret'
}

function extractAdminToken(req: Request) {
  const header =
    (typeof req.headers['x-admin-token'] === 'string' && req.headers['x-admin-token']) ||
    ''
  const [scheme = '', bearer] = header.split(' ')
  return scheme.toLowerCase() === 'bearer' && bearer ? bearer : header
}

export function signAdminToken(payload: AdminJwtPayload) {
  return jwt.sign(payload, getAdminSecret(), { expiresIn: '8h' })
}

export function permissionsForRole(role: AdminRole) {
  return [...ROLE_PERMISSIONS[role]]
}

export const requireAdmin: RequestHandler = async (req, res, next) => {
  const token = extractAdminToken(req)
  if (!token) {
    sendError(res, '请先登录管理后台', 401)
    return
  }

  try {
    const payload = jwt.verify(token, getAdminSecret())
    if (
      typeof payload === 'string' ||
      typeof payload.adminId !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.name !== 'string' ||
      !Object.values(AdminRole).includes(payload.role as AdminRole)
    ) {
      throw new Error('Invalid admin token')
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: payload.adminId },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    })
    if (!admin?.isActive) {
      sendError(res, '管理员账号已停用', 403)
      return
    }
    req.admin = {
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    }
    next()
  } catch {
    sendError(res, '管理会话已过期，请重新登录', 401)
  }
}

export function requireAdminPermission(permission: AdminPermission): RequestHandler[] {
  return [
    requireAdmin,
    (req, res, next) => {
      if (!req.admin || !ROLE_PERMISSIONS[req.admin.role].includes(permission)) {
        sendError(res, '当前角色没有执行此操作的权限', 403)
        return
      }
      next()
    },
  ]
}
