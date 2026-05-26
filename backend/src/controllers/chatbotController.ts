/**
 * 智能聊天机器人 Controller — RAG 混合架构版
 *
 * 架构：意图识别 → 数据获取（Legacy API）→ DeepSeek 大模型生成自然语言回复
 *
 * AI 配置复用项目现有环境变量（与 /api/chat 路由保持一致）：
 *   OPENAI_API_KEY  — API 密钥（硅基流动 / DeepSeek 官方均可）
 *   AI_BASE_URL     — 服务商 Base URL（默认 https://api.siliconflow.cn/v1）
 *   AI_MODEL        — 模型名称（默认 deepseek-ai/DeepSeek-V3）
 *
 * 意图分支：
 *   TIMETABLE  → fetchTimetable → RAG Prompt → DeepSeek
 *   GRADES     → fetchGrades    → RAG Prompt → DeepSeek
 *   TRANSLATE  → 直接 Prompt    → DeepSeek（多语言翻译）
 *   FALLBACK   → System Prompt  → DeepSeek（通用教务问答）
 */

import type { Request, Response } from 'express'

// ============================================================
// 类型定义
// ============================================================

interface ChatRequest {
  message: string
  studentId: string
}

interface TimetableEntry {
  day: string
  time: string
  title: string
  teacher: string
  room: string
}

interface LegacyTimetableResponse {
  success: boolean
  studentId: string
  weekOf: string
  data: TimetableEntry[]
}

interface GradeEntry {
  courseId: string
  title: string
  term: string
  score: number
  grade: string
  status: 'passed' | 'failed'
}

interface LegacyGradesResponse {
  success: boolean
  studentId: string
  data: GradeEntry[]
  total: number
}

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface DeepSeekResponse {
  choices: Array<{
    message: { role: string; content: string }
    finish_reason: string
  }>
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
}

// ============================================================
// 意图识别
// ============================================================

type Intent = 'TIMETABLE' | 'GRADES' | 'TRANSLATE' | 'FALLBACK'

const INTENT_PATTERNS: Record<Exclude<Intent, 'FALLBACK'>, RegExp> = {
  // Для того чтобы запрос расписания считался требующим получения персональных данных, он должен иметь четкий префикс "query/my".
  // Сопоставление чисто общих терминов («класс», «расписание курса», «во сколько начинается занятие») больше не будет осуществляться, чтобы избежать ошибочной блокировки неформального чата в базе знаний.
  TIMETABLE: /(?:查|看|查询|查看|查一下|帮我查)(?:.*?)(?:课表|日程|我的课|本周课|今天的课|明天的课)|我的课表|本周课表|今天有(?:哪些|什么)课|明天有(?:哪些|什么)课|下节课(?:是|有)/,
  // Аналогично, запросы оценок должны иметь четкий префикс "проверить/мои" или использовать конкретную фразу, например, "мой балл/мои оценки".
  // Общие термины «оценка» и «балл» не срабатывают, если они встречаются по отдельности (например, «Как рассчитывается оценка за этот курс?»).
  GRADES:    /(?:查|看|查询|查看|查一下|帮我查)(?:.*?)(?:成绩|分数|学分)|我的成绩|我的分数|我的学分|考了多少分|考得怎样|考试结果|挂科了|及格了吗|不及格/,
  TRANSLATE: /翻译|translate|перевод/i,
}

function detectIntent(message: string): Intent {
  for (const [intent, pattern] of Object.entries(INTENT_PATTERNS) as [Exclude<Intent, 'FALLBACK'>, RegExp][]) {
    if (pattern.test(message)) return intent
  }
  return 'FALLBACK'
}

// ============================================================
// AI 配置（复用项目现有环境变量）
// ============================================================

function getAiConfig(): { apiKey: string; baseUrl: string; model: string } | null {
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const rawBase = process.env.AI_BASE_URL || 'https://api.siliconflow.cn/v1'
  // 规范化 base URL：去掉末尾斜杠，确保以 /v1 结尾
  const trimmed = rawBase.replace(/\/$/, '')
  const baseUrl = trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`

  const model = process.env.AI_MODEL || 'deepseek-ai/DeepSeek-V3'

  return { apiKey, baseUrl, model }
}

// ============================================================
// DeepSeek API 调用
// ============================================================

/**
 * 调用 DeepSeek（或兼容 OpenAI 格式的）Chat Completions API
 * 超时 30 秒。
 * 任何错误都在此处完全消化：打印详细日志供排查，向调用方返回 null。
 * 调用方收到 null 时使用 FALLBACK_REPLIES 中的静态兜底文本，
 * 确保 HTTP 响应始终是 200 + 友好文案，绝不向前端暴露 4xx/5xx。
 */
async function callDeepSeek(
  messages: DeepSeekMessage[],
  config: { apiKey: string; baseUrl: string; model: string },
): Promise<string | null> {
  const endpoint = `${config.baseUrl}/chat/completions`

  const requestBody = {
    model: config.model,
    messages,
    temperature: 0.7,
    max_tokens: 1024,
    stream: false,
  }

  console.log(`[chatbot] → DeepSeek endpoint=${endpoint} model=${config.model} messages=${messages.length}`)

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30_000),
    })

    // ── 非 2xx：读取并打印完整响应体，方便排查 quota/auth/model 错误 ──
    if (!res.ok) {
      let errBody = ''
      try { errBody = await res.text() } catch { /* ignore */ }
      console.error(
        `[chatbot] DeepSeek API error — status=${res.status} url=${endpoint}\n` +
        `  request model: ${config.model}\n` +
        `  response body: ${errBody}`,
      )
      return null
    }

    const json = (await res.json()) as DeepSeekResponse
    const content = json.choices?.[0]?.message?.content?.trim()

    if (!content) {
      console.warn('[chatbot] DeepSeek returned empty content:', JSON.stringify(json))
      return null
    }

    const usage = json.usage
    if (usage) {
      console.log(
        `[chatbot] ✓ DeepSeek OK — prompt:${usage.prompt_tokens} ` +
        `completion:${usage.completion_tokens} total:${usage.total_tokens}`,
      )
    }

    return content
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        console.error('[chatbot] DeepSeek API timeout (30s exceeded)')
      } else {
        // 网络错误、DNS 失败等
        console.error('[chatbot] DeepSeek API fetch error:', err.message)
      }
    } else {
      console.error('[chatbot] DeepSeek API unknown error:', err)
    }
    return null
  }
}

// ============================================================
// Legacy API 数据获取
// ============================================================

function getInternalBaseUrl(): string {
  const port = process.env.PORT || 3000
  return `http://localhost:${port}`
}

async function fetchTimetable(studentId: string): Promise<LegacyTimetableResponse | null> {
  try {
    const url = `${getInternalBaseUrl()}/api/legacy/timetable?studentId=${encodeURIComponent(studentId)}`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    return (await res.json()) as LegacyTimetableResponse
  } catch (err) {
    console.error('[chatbot] fetchTimetable error:', err)
    return null
  }
}

async function fetchGrades(studentId: string): Promise<LegacyGradesResponse | null> {
  try {
    const url = `${getInternalBaseUrl()}/api/legacy/grades?studentId=${encodeURIComponent(studentId)}`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    return (await res.json()) as LegacyGradesResponse
  } catch (err) {
    console.error('[chatbot] fetchGrades error:', err)
    return null
  }
}

// ============================================================
// RAG Prompt 构建器
// ============================================================

const SCHOOL_SYSTEM_PROMPT = `\
你是由新言教育（OpenEdu）开发的智能教务助手。你精通中文和俄语，语气专业、热情、耐心。\
请用自然、专业、友好的语气回答，回复简洁清晰，适当使用 Markdown 格式（如列表、加粗）提升可读性。\
不要编造数据，如果数据为空请如实告知。

【专属知识库】
以下是学校的专属政策与知识，请在学生提问涉及相关领域时，自然地结合这些信息进行解答，\
表现得像一位真实的学校教务老师——不要主动一次性罗列所有信息，而是在对话中按需自然引用。

1. 留学生合规与医疗
   根据俄罗斯法律，留学生必须每年进行一次医疗体检（медицинская комиссия）并购买医疗保险。\
当学生询问看病、体检、保险或留学合规相关问题时，请提醒其遵守法律规定，并给予关心与指引。

2. 校园设施与上课地点
   当前宿舍及教学楼即将进行装修，新的上课地点安排在主楼（Главный корпус）的全新教室。\
此外，学校体育馆设施完备，可供学生预约使用。当学生询问上课地点、教室安排或校园设施时，请提供上述信息。

3. 学费政策
   由于通货膨胀因素，学校的学费标准每年会有所上调。\
当学生咨询学费相关问题时，请客观说明这一政策，语气温和，并建议学生及时关注学校官方通知。

4. 课外活动与跨文化融入
   学校非常鼓励跨文化交流：目前已有中国留学生成功加入了俄罗斯合唱团并表现优异；\
学校的网球等体育社团也非常欢迎新生加入。当学生询问课外活动、社团或融入当地生活时，请积极介绍并鼓励参与。\
`

function buildTimetableMessages(
  userMessage: string,
  data: LegacyTimetableResponse,
): DeepSeekMessage[] {
  const dataJson = JSON.stringify(data, null, 2)
  return [
    { role: 'system', content: SCHOOL_SYSTEM_PROMPT },
    {
      role: 'user',
      content:
        `用户询问课表相关问题。\n\n` +
        `以下是通过教务系统 API 查询到的该学生真实课表数据（JSON 格式）：\n\`\`\`json\n${dataJson}\n\`\`\`\n\n` +
        `请根据以上数据，用自然语言回答用户的问题。用户原始输入：「${userMessage}」`,
    },
  ]
}

function buildGradesMessages(
  userMessage: string,
  data: LegacyGradesResponse,
): DeepSeekMessage[] {
  const dataJson = JSON.stringify(data, null, 2)
  return [
    { role: 'system', content: SCHOOL_SYSTEM_PROMPT },
    {
      role: 'user',
      content:
        `用户询问成绩相关问题。\n\n` +
        `以下是通过教务系统 API 查询到的该学生真实成绩数据（JSON 格式）：\n\`\`\`json\n${dataJson}\n\`\`\`\n\n` +
        `请根据以上数据，用自然语言回答用户的问题，可以适当分析成绩情况（如通过率、最高分等）。用户原始输入：「${userMessage}」`,
    },
  ]
}

function buildTranslateMessages(userMessage: string): DeepSeekMessage[] {
  return [
    {
      role: 'system',
      content:
        '你是新言语言学校的多语言翻译助手，专注于中文、俄语、英语、法语、日语、西班牙语之间的互译。' +
        '翻译时请提供：目标语言译文、音标/罗马化拼写（如适用）、简短用法说明。格式清晰，使用 Markdown。',
    },
    { role: 'user', content: userMessage },
  ]
}

function buildFallbackMessages(userMessage: string): DeepSeekMessage[] {
  return [
    { role: 'system', content: SCHOOL_SYSTEM_PROMPT },
    { role: 'user', content: userMessage },
  ]
}

// ============================================================
// 兜底文本（AI 不可用时使用）
// ============================================================

const FALLBACK_REPLIES: Record<Intent, string> = {
  TIMETABLE: '抱歉，课表查询服务暂时不可用，请稍后再试或直接联系教务处。',
  GRADES:    '抱歉，成绩查询服务暂时不可用，请稍后再试或直接联系教务处。',
  TRANSLATE: '抱歉，翻译服务暂时不可用，请稍后再试。',
  FALLBACK:  '您好，我是新言语言学校智能助手 🎓\n\n我可以帮您查询课表、成绩，或解答语言学习问题。\n\n如需帮助，请联系教务处或拨打客服热线。',
}

// ============================================================
// 输入校验
// ============================================================

/**
 * studentId 规则：
 *  - TIMETABLE / GRADES 意图需要有效的 studentId（由主 Controller 在意图识别后二次校验）
 *  - TRANSLATE / FALLBACK 意图不需要 studentId，允许为空字符串或缺失
 *  因此这里只校验 message，studentId 允许为空（空字符串 / undefined / null 均合法）
 */
function validateRequest(body: unknown): { valid: true; data: ChatRequest } | { valid: false; error: string } {
  if (typeof body !== 'object' || body === null) {
    return { valid: false, error: 'Request body must be a JSON object' }
  }

  const { message, studentId } = body as Record<string, unknown>

  if (typeof message !== 'string' || message.trim().length === 0) {
    return { valid: false, error: 'message is required and must be a non-empty string' }
  }
  if (message.trim().length > 500) {
    return { valid: false, error: 'message must not exceed 500 characters' }
  }

  // studentId 允许为空字符串（未登录用户），但若提供则必须是字符串类型
  const sid = typeof studentId === 'string' ? studentId.trim() : ''

  return {
    valid: true,
    data: { message: message.trim(), studentId: sid },
  }
}

// ============================================================
// 意图识别 Controller（轻量版，仅返回意图，不调用 AI）
// ============================================================

export interface IntentResult {
  intent: Intent
  needsAuth: boolean // TIMETABLE / GRADES 需要登录
}

/**
 * postChat — 纯意图识别接口
 *
 * 接收用户消息，运行正则匹配，返回识别到的意图类型。
 * 前端可用于预判是否需要登录、是否触发数据查询等。
 *
 * Body: { message: string }
 * Returns: { ok: true, data: { intent, needsAuth } }
 */
export async function postChat(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Record<string, unknown> | undefined
    const message = typeof body?.message === 'string' ? body.message.trim() : ''

    if (!message) {
      res.status(400).json({ ok: false, error: 'message is required' })
      return
    }
    if (message.length > 500) {
      res.status(400).json({ ok: false, error: 'message must not exceed 500 characters' })
      return
    }

    const intent = detectIntent(message)
    const needsAuth = intent === 'TIMETABLE' || intent === 'GRADES'

    console.log(`[chatbot:intent] message="${message}" → intent=${intent} needsAuth=${needsAuth}`)

    res.json({
      ok: true,
      data: { intent, needsAuth },
    })
  } catch (err) {
    console.error('[chatbot:intent] Unexpected error:', err)
    res.json({
      ok: true,
      data: { intent: 'FALLBACK' as Intent, needsAuth: false },
    })
  }
}

// ============================================================
// 主 Controller（完整 RAG 流程：意图识别 → 数据获取 → AI 生成）
// ============================================================

export async function handleChatbot(req: Request, res: Response): Promise<void> {
  // ── 顶层 try/catch：确保任何意外异常都返回 200 + 友好文案，绝不向前端暴露 500 ──
  try {
    const validation = validateRequest(req.body)
    if (!validation.valid) {
      res.status(400).json({ ok: false, error: validation.error })
      return
    }

    const { message, studentId } = validation.data
    const intent = detectIntent(message)
    const aiConfig = getAiConfig()

    console.log(`[chatbot] studentId="${studentId || '(guest)'}" intent=${intent} aiEnabled=${!!aiConfig} message="${message}"`)

    // ── 数据查询意图：未登录（studentId 为空）时直接返回提示，不调用 AI ──
    if ((intent === 'TIMETABLE' || intent === 'GRADES') && !studentId) {
      res.json({
        ok: true,
        data: {
          reply: '您好，请先登录后再查询个人教务信息。登录后即可查询课表和成绩。',
          intent,
          studentId: '',
        },
      })
      return
    }

    let reply: string

    // ── AI 不可用时全部走兜底 ──────────────────────────────────
    if (!aiConfig) {
      console.warn('[chatbot] AI not configured (OPENAI_API_KEY / AI_API_KEY missing), using fallback replies')
      reply = FALLBACK_REPLIES[intent]
      res.json({ ok: true, data: { reply, intent, studentId } })
      return
    }

    // ── 按意图分支处理 ─────────────────────────────────────────
    switch (intent) {

      case 'TIMETABLE': {
        const timetableData = await fetchTimetable(studentId)
        if (!timetableData) {
          const aiReply = await callDeepSeek(
            [
              { role: 'system', content: SCHOOL_SYSTEM_PROMPT },
              { role: 'user', content: `用户询问课表，但教务系统 API 暂时无法访问。请给出友好的提示，告知用户稍后重试或联系教务处。用户原始输入：「${message}」` },
            ],
            aiConfig,
          )
          reply = aiReply ?? FALLBACK_REPLIES.TIMETABLE
        } else {
          const aiReply = await callDeepSeek(buildTimetableMessages(message, timetableData), aiConfig)
          reply = aiReply ?? FALLBACK_REPLIES.TIMETABLE
        }
        break
      }

      case 'GRADES': {
        const gradesData = await fetchGrades(studentId)
        if (!gradesData) {
          const aiReply = await callDeepSeek(
            [
              { role: 'system', content: SCHOOL_SYSTEM_PROMPT },
              { role: 'user', content: `用户询问成绩，但教务系统 API 暂时无法访问。请给出友好的提示，告知用户稍后重试或联系教务处。用户原始输入：「${message}」` },
            ],
            aiConfig,
          )
          reply = aiReply ?? FALLBACK_REPLIES.GRADES
        } else {
          const aiReply = await callDeepSeek(buildGradesMessages(message, gradesData), aiConfig)
          reply = aiReply ?? FALLBACK_REPLIES.GRADES
        }
        break
      }

      case 'TRANSLATE': {
        const aiReply = await callDeepSeek(buildTranslateMessages(message), aiConfig)
        reply = aiReply ?? FALLBACK_REPLIES.TRANSLATE
        break
      }

      default: {
        // FALLBACK — 通用教务问答（无需 studentId）
        const aiReply = await callDeepSeek(buildFallbackMessages(message), aiConfig)
        reply = aiReply ?? FALLBACK_REPLIES.FALLBACK
        break
      }
    }

    res.json({ ok: true, data: { reply, intent, studentId } })

  } catch (err) {
    // 兜底：任何未预期的异常都在这里消化，返回 200 + 友好文案
    console.error('[chatbot] Unexpected error in handleChatbot:', err)
    res.json({
      ok: true,
      data: {
        reply: 'AI 大脑暂时开小差了，请稍后再试 🙏',
        intent: 'FALLBACK',
        studentId: '',
      },
    })
  }
}
