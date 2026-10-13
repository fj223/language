import { Prisma } from '@prisma/client'
import { prisma } from '../db/prisma.js'

export type SchoolPolicyEntry = {
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

export const SCHOOL_POLICY_META = {
  name: 'OpenEdu 校内政策知识库',
  version: '实时版',
  owner: '教务与学生事务',
} as const

const DEFAULT_POLICIES = [
  {
    id: 'tuition',
    title: '学费与缴费',
    keywords: ['学费', '缴费', '退费', 'tuition', 'payment', 'refund'],
    summary: '学费标准可能按年度调整。',
    guidance: '具体金额、缴费日期和退费条件必须以学校最新正式通知或财务处答复为准。',
    owner: '财务处',
  },
  {
    id: 'medical-insurance',
    title: '留学生体检与保险',
    keywords: ['保险', '体检', '医疗', 'medical', 'insurance', 'exam'],
    summary: '留学生应按适用规定完成年度医疗体检并购买医疗保险。',
    guidance: '本学年的时间、指定机构和材料清单请以教务处通知为准。',
    owner: '教务处',
  },
  {
    id: 'classroom',
    title: '教学地点调整',
    keywords: ['教室', '主楼', '宿舍', '装修', '上课地点', 'classroom', 'building'],
    summary: '宿舍及部分教学楼装修期间，新安排的课程主要在主楼新教室上课。',
    guidance: '个人课程最终地点以课表显示和临时教务通知为准。',
    owner: '教务处',
  },
  {
    id: 'campus-activities',
    title: '校园设施与社团',
    keywords: ['体育馆', '社团', '合唱团', '网球', '校园设施', '活动', 'club', 'campus', 'gym'],
    summary: '学校体育馆支持预约使用，并鼓励学生参加跨文化和体育活动。',
    guidance: '合唱团、网球等社团的开放时间和报名方式请向学生事务部门确认。',
    owner: '学生事务部',
  },
] satisfies Array<{
  id: string
  title: string
  keywords: string[]
  summary: string
  guidance: string
  owner: string
}>

function parseKeywords(value: Prisma.JsonValue): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
    : []
}

function serializePolicy(policy: {
  id: string
  title: string
  keywords: Prisma.JsonValue
  summary: string
  guidance: string
  owner: string
  isPublished: boolean
  version: number
  updatedAt: Date
}): SchoolPolicyEntry {
  return {
    ...policy,
    keywords: parseKeywords(policy.keywords),
    updatedAt: policy.updatedAt.toISOString(),
  }
}

export async function ensureDefaultPolicies() {
  if (await prisma.schoolPolicy.count()) return
  await prisma.schoolPolicy.createMany({
    data: DEFAULT_POLICIES.map((policy) => ({ ...policy, keywords: policy.keywords })),
  })
}

export async function listSchoolPolicies(includeDrafts = false): Promise<SchoolPolicyEntry[]> {
  const policies = await prisma.schoolPolicy.findMany({
    ...(includeDrafts ? {} : { where: { isPublished: true } }),
    orderBy: [{ updatedAt: 'desc' }, { title: 'asc' }],
  })
  return policies.map(serializePolicy)
}

export async function findSchoolPolicies(message: string, fallbackToAll = true): Promise<SchoolPolicyEntry[]> {
  const policies = await listSchoolPolicies(false)
  const normalized = message.toLowerCase()
  const matches = policies.filter((policy) =>
    policy.keywords.some((keyword) => normalized.includes(keyword.toLowerCase())),
  )
  return matches.length || !fallbackToAll ? matches : policies
}

export function buildSchoolPolicyContext(entries: SchoolPolicyEntry[]) {
  const lines = entries.map((entry) =>
    `- ${entry.title}：${entry.summary}${entry.guidance}（负责人：${entry.owner}；版本：v${entry.version}；更新：${entry.updatedAt}）`,
  )
  return `${SCHOOL_POLICY_META.name}（数据库实时发布内容）\n${lines.join('\n')}`
}

export async function formatSchoolPolicyReply(message: string) {
  const matches = await findSchoolPolicies(message)
  if (!matches.length) {
    return '政策知识库当前没有已发布内容，请联系教务处确认。'
  }
  if (matches.length === 1) {
    const policy = matches[0]!
    return `${policy.summary}${policy.guidance}\n\n信息负责人：${policy.owner}；知识条目版本 v${policy.version}，更新于 ${new Date(policy.updatedAt).toLocaleDateString('zh-CN')}。`
  }
  const lines = matches.map((policy) => `- **${policy.title}**：${policy.summary}`)
  return `我可以查询以下校内信息：\n\n${lines.join('\n')}\n\n涉及金额、日期或个人资格时，请以对应部门的正式通知为准。`
}
