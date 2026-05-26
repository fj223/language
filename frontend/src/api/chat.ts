// ============================================================
// SSE 流式响应底层 API
//
// 基于标准 SSE 协议（Server-Sent Events），使用原生 fetch +
// ReadableStream 读取流，TextDecoder 解码，行缓冲算法拼接。
// ============================================================

// ── 类型定义 ──────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatContext {
  courseName?: string
  currentTimestamp?: number
  videoId?: string
  platform?: 'youtube' | 'bilibili' | 'local' | string
}

export interface StreamOptions {
  /** 请求超时（毫秒），默认 60s */
  timeout?: number
  /** 外部 AbortSignal，用于手动取消流 */
  signal?: AbortSignal
}

export interface StreamCallbacks {
  /** 每次收到增量文本时触发 */
  onDelta: (chunk: string) => void
  /** 流式阶段发生错误时触发（不会 throw，而是回调） */
  onError?: (error: Error) => void
  /** 流正常结束时触发，传入完整文本 */
  onDone?: (fullText: string) => void
}

// ── 底层 SSE 读取器 ───────────────────────────────────────────

/**
 * 核心流读取器：fetch → ReadableStream → TextDecoder → Line Buffer → SSE 解析。
 *
 * ## 行缓冲（Line Buffer）算法
 *
 * HTTP 流中一个 chunk 可能在任意位置被切断，JSON 数据块可能不完整。
 * 因此我们需要一个 `buffer` 变量暂存未完成的片段：
 *
 *   1. 将新到的 chunk 追加到 buffer  ←  TextDecoder.decode(value, { stream: true })
 *   2. 按 `\n` 将 buffer 分割为 lines
 *   3. 最后一行（lines.pop()）是不完整的片段，保留回 buffer
 *   4. 逐行解析 SSE 语法（event: / data: / 空行=结束）
 *   5. 循环回到步骤 1
 *
 * 这样即使 chunk 在 JSON 中间断开，下一次迭代也会拼接完整后再解析。
 */

async function readSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  decoder: TextDecoder,
  callbacks: StreamCallbacks,
): Promise<string> {
  let buffer = ''       // Буфер строк: Временно хранит неполные строки, охватывающие несколько фрагментов.
  let fullText = ''     // Полный текст ответа
  let isErrorEvent = false
  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      // Поток завершается; обработайте последние оставшиеся данные в буфере.
      processRemainingBuffer(buffer, isErrorEvent, fullText, callbacks.onDelta)
      break
    }
    // ── Шаги 1-2: Декодировать и добавить в буфер, разделив по символу \n. ──────────
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    // ── Шаг 3: Последняя строка не завершена; сохраните её для следующего этапа вышивания. ──────────────
    buffer = lines.pop() ?? ''
    // ── Шаг 4: Построчный разбор синтаксиса SSE ────────────────────────────
    for (const line of lines) {
      const trimmed = line.trim()
      // Пустая строка = конечный маркер блока событий SSE.
      if (!trimmed) {
        isErrorEvent = false
        continue
      }
      // event: Строка — Тип события записи
      if (trimmed.startsWith('event:')) {
        isErrorEvent = trimmed.slice(6).trim() === 'error'
        continue
      }
      // Обрабатываются только данные: строки
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trim()
      // Пустые данные или сигнал [ГОТОВО]
      if (!payload || payload === '[DONE]') continue
      try {
        const parsed = JSON.parse(payload) as { content?: string; message?: string }
        // 如果是 error 事件，提取错误信息并通过回调报告
        if (isErrorEvent && parsed.message) {
          callbacks.onError?.(new Error(`AI error: ${parsed.message}`))
          isErrorEvent = false
          continue
        }
        if (parsed.content) {
          fullText += parsed.content
          callbacks.onDelta(parsed.content)
        }
      } catch {
        // JSON 解析失败 → 静默跳过（可能是 SSE 注释或其他非标准字段）
      }
    }
  }

  return fullText
}

/**
 * 处理 buffer 中最后残留的数据（流结束后可能还有未处理的行）
 */
function processRemainingBuffer(
  buffer: string,
  isErrorEvent: boolean,
  fullText: string,
  onDelta: (chunk: string) => void,
): void {
  if (!buffer.trim()) return

  const lines = buffer.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) { isErrorEvent = false; continue }
    if (trimmed.startsWith('event:')) { isErrorEvent = trimmed.slice(6).trim() === 'error'; continue }
    if (!trimmed.startsWith('data:')) continue

    const payload = trimmed.slice(5).trim()
    if (!payload || payload === '[DONE]') continue

    try {
      const parsed = JSON.parse(payload) as { content?: string }
      if (parsed.content && !isErrorEvent) {
        onDelta(parsed.content)  // 注意：buffer 残留不追加到 fullText（避免重复）
      }
    } catch { /* ignore */ }
  }
}

// ── 公开 API ─────────────────────────────────────────────────

/**
 * streamChat — 流式调用 /api/chat（SSE）
 *
 * @param messages  对话历史（user / assistant / system）
 * @param context   课程上下文（可空对象）
 * @param onDelta   每次收到增量文本时的回调
 * @param opts      可选：signal（取消）、timeout（超时）
 * @returns         完整 AI 回复文本（流结束后 resolve）
 *
 * @example
 * ```ts
 * const full = await streamChat(
 *   [{ role: 'user', content: '解释量子力学' }],
 *   {},
 *   (chunk) => { console.log(chunk) },
 * )
 * console.log('完整回复:', full)
 * ```
 */
export async function streamChat(
  messages: ChatMessage[],
  context: ChatContext,
  onDelta: StreamCallbacks['onDelta'],
  opts?: StreamOptions,
): Promise<string> {
  const signal = opts?.signal
  const timeout = opts?.timeout ?? 60_000

  const controller = new AbortController()
  const combinedSignal = controller.signal

  // 外部 signal 也要联动内部 controller
  if (signal) {
    if (signal.aborted) {
      controller.abort()
    } else {
      signal.addEventListener('abort', () => controller.abort(), { once: true })
    }
  }

  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? ''}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, context }),
      signal: combinedSignal,
    })

    if (!res.ok) {
      throw new Error(`Chat request failed: HTTP ${res.status}`)
    }

    if (!res.body) {
      throw new Error('Chat request returned empty response body')
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    // 使用统一的 callbacks 对象
    const callbacks: StreamCallbacks = { onDelta }

    const fullText = await readSSEStream(reader, decoder, callbacks)

    return fullText
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      const msg = signal?.aborted
        ? 'Stream cancelled'
        : `Chat request timed out after ${timeout}ms`
      throw new Error(msg)
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}
