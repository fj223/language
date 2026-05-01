const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string }

export interface ChatContext {
  courseName?: string
  currentTimestamp?: number
  videoId?: string
  platform?: 'youtube' | 'bilibili' | 'local' | string
}

/**
 * 流式调用 /api/chat，通过 onDelta 回调逐字推送内容。
 * 返回完整的 AI 回复文本（resolve 时流已结束）。
 */
export async function streamChat(
  messages: ChatMessage[],
  context: ChatContext,
  onDelta: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, context }),
    signal,
  })

  if (!res.ok || !res.body) {
    throw new Error(`Chat request failed: ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''
  let isErrorEvent = false // 标记当前 event 块是否为 error 类型

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()

      // 空行 = SSE 事件块结束，重置 error 标记
      if (!trimmed) {
        isErrorEvent = false
        continue
      }

      // 记录 event 类型
      if (trimmed.startsWith('event:')) {
        isErrorEvent = trimmed.slice(6).trim() === 'error'
        continue
      }

      if (!trimmed.startsWith('data:')) continue

      const payload = trimmed.slice(5).trim()
      if (!payload || payload === '{}') continue // done 事件或空 data

      try {
        const parsed = JSON.parse(payload) as { content?: string; message?: string }

        if (isErrorEvent && parsed.message) {
          throw new Error(`AI error: ${parsed.message}`)
        }

        if (parsed.content) {
          full += parsed.content
          onDelta(parsed.content)
        }
      } catch (e) {
        // 只重新抛出真实错误，忽略 JSON 解析失败
        if (e instanceof SyntaxError) continue
        throw e
      }
    }
  }

  return full
}
