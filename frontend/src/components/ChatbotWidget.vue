<template>
  <!-- ============================================================
       Floating trigger button
  ============================================================ -->
  <Teleport to="body">
    <!-- Backdrop (mobile) -->
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[9998] md:hidden"
        @click="isOpen = false"
      />
    </Transition>

    <!-- Chat panel -->
    <Transition name="panel">
      <div
        v-if="isOpen"
        class="chatbot-panel fixed bottom-24 right-4 sm:right-6 z-[9999]
               w-[calc(100vw-2rem)] max-w-sm
               bg-white rounded-2xl shadow-2xl shadow-slate-900/20
               border border-slate-200/80
               flex flex-col overflow-hidden"
        style="height: min(600px, calc(100dvh - 7rem))"
        role="dialog"
        :aria-label="$t('chatbot.ariaLabel')"
        aria-modal="true"
      >
        <!-- Header -->
        <div class="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 flex-shrink-0">
          <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
              <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" opacity=".3"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-white font-semibold text-sm leading-tight">{{ $t('chatbot.headerTitle') }}</p>
            <p class="text-white/70 text-[10px] leading-tight mt-0.5 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
              {{ $t('chatbot.headerStatus') }}
            </p>
          </div>
          <button
            class="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors flex-shrink-0"
            :aria-label="$t('chatbot.closeBtn')"
            @click="isOpen = false"
          >
            <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Message list -->
        <div
          ref="listRef"
          class="flex-1 overflow-y-auto px-3 py-4 space-y-3 scroll-smooth"
          style="overscroll-behavior: contain"
        >
          <div
            v-for="(msg, idx) in messages"
            :key="idx"
            class="flex gap-2"
            :class="msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'"
          >
            <!-- Bot avatar -->
            <div
              v-if="msg.role === 'bot'"
              class="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm"
            >
              <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zm-2 10H6V7h12v12zm-9-6c-.83 0-1.5-.67-1.5-1.5S8.17 10 9 10s1.5.67 1.5 1.5S9.83 13 9 13zm6 0c-.83 0-1.5-.67-1.5-1.5S14.17 10 15 10s1.5.67 1.5 1.5S15.83 13 15 13z"/>
              </svg>
            </div>

            <!-- Message bubble + actions wrapper -->
            <div class="max-w-[82%] flex flex-col gap-1">
              <!-- Bubble -->
              <div
                class="rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm"
                :class="msg.role === 'user'
                  ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-tr-sm'
                  : 'bg-slate-100 text-slate-800 rounded-tl-sm'"
              >
                <!-- Thinking animation -->
                <template v-if="msg.role === 'bot' && msg.thinking">
                  <span class="flex items-center gap-1 py-0.5 px-1">
                    <span class="thinking-dot" style="animation-delay: 0ms" />
                    <span class="thinking-dot" style="animation-delay: 150ms" />
                    <span class="thinking-dot" style="animation-delay: 300ms" />
                  </span>
                </template>

                <!-- User message: plain text -->
                <template v-else-if="msg.role === 'user'">
                  <span class="whitespace-pre-wrap">{{ msg.content }}</span>
                </template>

                <!-- Bot message: rendered markdown -->
                <div
                  v-else
                  class="chatbot-prose"
                  v-html="renderMarkdown(msg.content)"
                />
              </div>

              <!-- Flashcard extraction button (bot messages only, not thinking, has content) -->
              <button
                v-if="msg.role === 'bot' && !msg.thinking && msg.content"
                class="flex items-center gap-1 text-[11px] transition-colors py-0.5 px-1.5 rounded-md self-start"
                :class="msg.isFlashcardGenerated
                  ? 'text-green-500 cursor-default'
                  : 'text-slate-400 hover:text-indigo-500 hover:bg-indigo-50'"
                :disabled="extractingIdx === idx || msg.isFlashcardGenerated"
                @click="!msg.isFlashcardGenerated && handleGenerateCard(idx)"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path v-if="msg.isFlashcardGenerated" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  <path v-else d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
                </svg>
                {{ msg.isFlashcardGenerated ? '已生成卡片' : extractingIdx === idx ? '提取中…' : '提取卡片' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Quick replies -->
        <div v-if="showQuickReplies" class="px-3 pb-2 flex gap-1.5 flex-wrap flex-shrink-0">
          <button
            v-for="q in QUICK_REPLIES"
            :key="q"
            class="text-[11px] px-2.5 py-1 rounded-full border border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors whitespace-nowrap"
            @click="sendQuick(q)"
          >
            {{ q }}
          </button>
        </div>

        <!-- Input area -->
        <div class="px-3 pb-3 pt-2 border-t border-slate-100 flex-shrink-0">
          <div class="flex items-end gap-2">
            <textarea
              ref="inputRef"
              v-model="inputText"
              rows="1"
              :placeholder="isListening ? $t('chatbot.inputListening') : $t('chatbot.inputPlaceholder')"
              class="flex-1 resize-none rounded-xl border bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400
                     focus:outline-none focus:ring-2 focus:border-indigo-400
                     transition-all leading-relaxed max-h-28 overflow-y-auto"
              :class="isListening
                ? 'border-rose-400 focus:ring-rose-300/40 placeholder-rose-400'
                : 'border-slate-200 focus:ring-indigo-400/40'"
              :disabled="loading"
              @keydown.enter.exact.prevent="send"
              @keydown.enter.shift.exact.stop
              @input="autoResize"
            />

            <!-- 麦克风按钮（仅在浏览器支持时显示） -->
            <button
              v-if="speechSupported"
              type="button"
              class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
              :class="isListening
                ? 'bg-rose-500 text-white shadow-md shadow-rose-300/60 scale-105'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'"
              :aria-label="isListening ? $t('chatbot.micStop') : $t('chatbot.micStart')"
              :title="isListening ? $t('chatbot.micStopTitle') : $t('chatbot.micStartTitle')"
              @click="toggleSpeech"
            >
              <!-- 录音中：波动圆圈 + 麦克风 -->
              <span v-if="isListening" class="relative flex items-center justify-center">
                <span class="mic-ripple" />
                <svg class="w-4 h-4 relative z-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </span>
              <!-- 待机：普通麦克风 -->
              <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            </button>

            <!-- 发送按钮 -->
            <button
              class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all
                     bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm
                     hover:shadow-indigo-300/60 hover:shadow-md hover:scale-105
                     active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
              :disabled="loading || !inputText.trim()"
              :aria-label="$t('chatbot.sendBtn')"
              @click="send"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
          <p class="text-[10px] text-slate-400 mt-1.5 text-center">
            <template v-if="isListening">
              <span class="text-rose-400 font-medium">{{ $t('chatbot.listeningHint') }}</span>
            </template>
            <template v-else>{{ $t('chatbot.sendHint') }}</template>
          </p>
        </div>
      </div>
    </Transition>

    <!-- FAB trigger button -->
    <Transition name="fab">
      <button
        v-show="!isOpen"
        class="fixed bottom-6 right-4 sm:right-6 z-[9999]
               w-14 h-14 rounded-full
               bg-gradient-to-br from-indigo-500 to-violet-600
               text-white shadow-lg shadow-indigo-500/40
               hover:shadow-xl hover:shadow-indigo-500/50 hover:scale-110
               active:scale-95 transition-all duration-200
               flex items-center justify-center"
        :aria-label="$t('chatbot.openBtn')"
        @click="open"
      >
        <!-- Chat bubble icon -->
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
        </svg>
        <!-- Unread badge -->
        <span
          v-if="unreadCount > 0"
          class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow"
        >{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
      </button>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, ref, computed, watch } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { http } from '@/api/http'
import { createFlashcard, extractFlashcardContent } from '@/api/flashcard'
import { useStudentAuth } from '@/composables/useStudentAuth'

// ============================================================
// Types
// ============================================================

interface BotMessage {
  role: 'bot'
  content: string
  thinking?: boolean
  isFlashcardGenerated?: boolean
}
interface UserMessage {
  role: 'user'
  content: string
}
type Message = BotMessage | UserMessage

// ============================================================
// Auth state
// ============================================================

const { isLoggedIn, studentId, studentName } = useStudentAuth()
const { t } = useI18n()

// ============================================================
// Config
// ============================================================

const QUICK_REPLIES = computed(() => [
  t('chatbot.quickSchedule'),
  t('chatbot.quickGrade'),
  t('chatbot.quickTranslate1'),
  t('chatbot.quickTranslate2'),
])

/** 欢迎语：根据登录状态动态生成 */
function buildWelcomeMsg(): BotMessage {
  if (isLoggedIn.value && studentName.value) {
    return {
      role: 'bot',
      content: `您好，**${studentName.value}**！我是新言语言学校智能助手 🎓\n\n我可以帮您：\n- 📅 ${t('chatbot.quickSchedule')}\n- 📊 ${t('chatbot.quickGrade')}\n- 🌐 ${t('chatbot.quickTranslate1').replace('翻译：', '')} / ${t('chatbot.quickTranslate2').replace('翻译：', '')} 词汇翻译\n\n请问有什么可以帮您？`,
    }
  }
  return {
    role: 'bot',
    content: `您好！我是新言语言学校智能助手 🎓\n\n我可以帮您：\n- 📅 ${t('chatbot.quickSchedule')}\n- 📊 ${t('chatbot.quickGrade')}\n- 🌐 ${t('chatbot.quickTranslate1').replace('翻译：', '')} / ${t('chatbot.quickTranslate2').replace('翻译：', '')} 词汇翻译\n\n请问有什么可以帮您？`,
  }
}

/** 未登录提示消息 */
const NOT_LOGGED_IN_MSG: BotMessage = {
  role: 'bot',
  content: '⚠️ **您好，请先登录后再查询个人教务信息。**\n\n登录后即可查询课表、成绩等个人数据。\n\n您也可以直接向我提问语言学习相关问题，无需登录。',
}

// ============================================================
// State
// ============================================================

const isOpen = ref(false)
const inputText = ref('')
const loading = ref(false)
const messages = ref<Message[]>([buildWelcomeMsg()])
const listRef = ref<HTMLDivElement | null>(null)
const inputRef = ref<HTMLTextAreaElement | null>(null)
const unreadCount = ref(0)

// --- Flashcard state ---
const extractingIdx = ref<number | null>(null)

/** 仅在只有欢迎语时显示快捷回复 */
const showQuickReplies = computed(() => messages.value.length === 1 && !loading.value)

// 登录状态变化时，重置对话并更新欢迎语
watch(isLoggedIn, () => {
  messages.value = [buildWelcomeMsg()]
  unreadCount.value = 0
})

// ============================================================
// Panel open / close
// ============================================================

function open() {
  isOpen.value = true
  unreadCount.value = 0
  nextTick(() => {
    scrollBottom()
    inputRef.value?.focus()
  })
}

// ============================================================
// Markdown rendering
// ============================================================

marked.setOptions({ gfm: true })

function renderMarkdown(content: string): string {
  if (!content) return ''
  const clean = content.replace(/^```markdown\n?/i, '').replace(/```\s*$/, '')
  const raw = marked.parse(clean) as string
  return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } })
}

// ============================================================
// Scroll
// ============================================================

async function scrollBottom() {
  await nextTick()
  if (listRef.value) {
    listRef.value.scrollTop = listRef.value.scrollHeight
  }
}

// ============================================================
// Auto-resize textarea
// ============================================================

function autoResize(e: Event) {
  const el = e.target as HTMLTextAreaElement
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 112)}px`
}

function resetTextarea() {
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
  }
}

// ============================================================
// Flashcard extraction
// ============================================================

async function generateFlashcard(content: string): Promise<{ term: string; definition: string; example: string } | null> {
  try {
    return await extractFlashcardContent(content)
  } catch {
    return null
  }
}

async function handleGenerateCard(idx: number) {
  extractingIdx.value = idx
  const msg = messages.value[idx]
  const content = msg.role === 'bot' ? msg.content : ''
  if (!content) return

  try {
    const card = await generateFlashcard(content)
    if (!card) {
      ElMessage.error('知识提取失败，请重试')
      return
    }

    await createFlashcard({
      videoId: 'chatbot',
      userId: studentId.value ?? undefined,
      term: card.term,
      definition: card.definition,
      example: card.example || null,
    })

    const botMsg = messages.value[idx] as BotMessage
    botMsg.isFlashcardGenerated = true
    ElMessage.success(`知识卡片【${card.term}】已保存！`)
  } catch (e) {
    ElMessage.error('生成失败：' + (e instanceof Error ? e.message : '未知错误'))
  } finally {
    extractingIdx.value = null
  }
}

// ============================================================
// Intent detection (mirrors backend, for pre-flight guard)
// ============================================================

// 与后端保持一致：必须有明确的"查询/我的"意图前缀才视为数据查询，
// 避免泛义词（"上课"、"分数"）误拦截知识库闲聊。
const DATA_QUERY_PATTERN =
  /(?:查|看|查询|查看|查一下|帮我查)(?:.*?)(?:课表|日程|我的课|本周课|今天的课|明天的课|成绩|分数|学分)|我的课表|本周课表|今天有(?:哪些|什么)课|明天有(?:哪些|什么)课|下节课(?:是|有)|我的成绩|我的分数|我的学分|考了多少分|考得怎样|考试结果|挂科了|及格了吗|不及格/

/** 是否是需要登录才能查询的数据意图 */
function isDataQueryIntent(text: string): boolean {
  return DATA_QUERY_PATTERN.test(text)
}

// ============================================================
// Send message
// ============================================================

async function send() {
  const text = inputText.value.trim()
  if (!text || loading.value) return

  // ── 未登录 + 数据查询意图：拦截并提示 ──────────────────────
  if (!isLoggedIn.value && isDataQueryIntent(text)) {
    messages.value.push({ role: 'user', content: text })
    inputText.value = ''
    resetTextarea()
    await scrollBottom()
    messages.value.push({ ...NOT_LOGGED_IN_MSG })
    await scrollBottom()
    if (!isOpen.value) unreadCount.value++
    return
  }

  // Push user bubble
  messages.value.push({ role: 'user', content: text })
  inputText.value = ''
  resetTextarea()
  await scrollBottom()

  // Push thinking bubble
  const thinkingMsg: BotMessage = { role: 'bot', content: '', thinking: true }
  messages.value.push(thinkingMsg)
  const thinkingIdx = messages.value.length - 1
  loading.value = true
  await scrollBottom()

  try {
    const { data } = await http.post<{
      ok: boolean
      data: { reply: string; intent: string; studentId: string }
    }>('/api/chatbot', {
      message: text,
      // 已登录时传真实 studentId，未登录时传空字符串（后端 FALLBACK 意图不需要 studentId）
      studentId: studentId.value ?? '',
    }, {
      timeout: 45_000, // AI 调用最多 30s + 数据获取 5s，预留余量
    })

    messages.value[thinkingIdx] = {
      role: 'bot',
      content: data.data?.reply ?? '抱歉，暂时无法处理您的请求，请稍后再试。',
      thinking: false,
    }

    if (!isOpen.value) unreadCount.value++
  } catch (err) {
    messages.value[thinkingIdx] = {
      role: 'bot',
      content: `**请求失败**：${err instanceof Error ? err.message : '网络错误，请稍后重试'}`,
      thinking: false,
    }
  } finally {
    loading.value = false
    await scrollBottom()
    inputRef.value?.focus()
  }
}

async function sendQuick(text: string) {
  inputText.value = text
  await send()
}

// ============================================================
// Speech Recognition（语音输入）
// ============================================================

// 检测浏览器是否支持 Web Speech API
const SpeechRecognitionCtor =
  (window as unknown as { SpeechRecognition?: new () => SpeechRecognition })
    .SpeechRecognition ??
  (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition })
    .webkitSpeechRecognition ??
  null

const speechSupported = ref(!!SpeechRecognitionCtor)
const isListening = ref(false)

let recognition: SpeechRecognition | null = null

function toggleSpeech() {
  if (!SpeechRecognitionCtor) {
    // 理论上按钮已隐藏，这里作为双重保险
    alert('当前浏览器不支持语音输入，请使用 Chrome 或 Edge。')
    return
  }

  if (isListening.value) {
    // 手动停止
    recognition?.stop()
    return
  }

  // 初始化并启动
  recognition = new SpeechRecognitionCtor()
  recognition.lang = 'zh-CN'       // 默认中文，可根据语言 store 动态切换
  recognition.interimResults = true // 实时显示中间结果
  recognition.maxAlternatives = 1
  recognition.continuous = false

  recognition.onstart = () => {
    isListening.value = true
  }

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    // 取最后一个结果（最终结果优先，否则取中间结果）
    const results = event.results
    const last = results[results.length - 1]
    const transcript = last[0].transcript.trim()
    if (transcript) {
      inputText.value = transcript
      // 同步 textarea 高度
      nextTick(() => {
        if (inputRef.value) {
          inputRef.value.style.height = 'auto'
          inputRef.value.style.height =
            `${Math.min(inputRef.value.scrollHeight, 112)}px`
        }
      })
    }
  }

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    console.warn('[speech] error:', event.error)
    isListening.value = false
    if (event.error === 'not-allowed') {
      alert('麦克风权限被拒绝，请在浏览器设置中允许访问麦克风。')
    }
  }

  recognition.onend = () => {
    isListening.value = false
    recognition = null
    // 识别结束后聚焦输入框，方便用户直接编辑或发送
    nextTick(() => inputRef.value?.focus())
  }

  recognition.start()
}
</script>

<style scoped>
/* ── Panel slide-up transition ─────────────────────────────── */
.panel-enter-active {
  transition: opacity 0.22s ease, transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.panel-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.97);
}

/* ── FAB pop transition ────────────────────────────────────── */
.fab-enter-active {
  transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.fab-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.fab-enter-from,
.fab-leave-to {
  opacity: 0;
  transform: scale(0.7);
}

/* ── Backdrop fade ─────────────────────────────────────────── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ── Thinking dots ─────────────────────────────────────────── */
.thinking-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #94a3b8;
  animation: thinking-bounce 1s infinite ease-in-out;
}

@keyframes thinking-bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
  40%           { transform: translateY(-5px); opacity: 1; }
}

/* ── Chatbot prose (markdown inside bot bubbles) ───────────── */
.chatbot-prose :deep(p)          { margin: 0 0 0.5em; line-height: 1.6; }
.chatbot-prose :deep(p:last-child) { margin-bottom: 0; }
.chatbot-prose :deep(ul),
.chatbot-prose :deep(ol)         { margin: 0.4em 0 0.5em 1.1em; padding: 0; }
.chatbot-prose :deep(li)         { margin-bottom: 0.2em; line-height: 1.55; }
.chatbot-prose :deep(strong)     { font-weight: 600; color: #1e293b; }
.chatbot-prose :deep(code)       {
  font-size: 0.8em;
  background: #e2e8f0;
  border-radius: 4px;
  padding: 0.1em 0.35em;
  font-family: ui-monospace, monospace;
}
.chatbot-prose :deep(pre)        {
  background: #1e293b;
  color: #e2e8f0;
  border-radius: 8px;
  padding: 0.75em 1em;
  overflow-x: auto;
  margin: 0.5em 0;
  font-size: 0.78em;
}
.chatbot-prose :deep(pre code)   { background: none; padding: 0; color: inherit; }
.chatbot-prose :deep(blockquote) {
  border-left: 3px solid #818cf8;
  margin: 0.4em 0;
  padding: 0.2em 0.75em;
  color: #475569;
  font-style: italic;
}
.chatbot-prose :deep(h1),
.chatbot-prose :deep(h2),
.chatbot-prose :deep(h3)         { font-weight: 600; margin: 0.6em 0 0.3em; line-height: 1.3; }
.chatbot-prose :deep(h1)         { font-size: 1em; }
.chatbot-prose :deep(h2)         { font-size: 0.95em; }
.chatbot-prose :deep(h3)         { font-size: 0.9em; }
.chatbot-prose :deep(a)          { color: #6366f1; text-decoration: underline; }
.chatbot-prose :deep(hr)         { border: none; border-top: 1px solid #e2e8f0; margin: 0.5em 0; }

/* ── Scrollbar styling ─────────────────────────────────────── */
.chatbot-panel ::-webkit-scrollbar       { width: 4px; }
.chatbot-panel ::-webkit-scrollbar-track { background: transparent; }
.chatbot-panel ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
.chatbot-panel ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

/* ── Mic ripple animation ──────────────────────────────────── */
.mic-ripple {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.35);
  animation: mic-pulse 1.2s ease-out infinite;
}

@keyframes mic-pulse {
  0%   { transform: scale(0.85); opacity: 0.8; }
  70%  { transform: scale(1.4);  opacity: 0; }
  100% { transform: scale(1.4);  opacity: 0; }
}
</style>
