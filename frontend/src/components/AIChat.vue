<template>
  <div class="relative bg-slate-50 dark:bg-slate-950 rounded-2xl flex flex-col h-full shadow-sm overflow-hidden border border-slate-200/50">
    <!-- Header -->
    <div class="p-5 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-primary">
          <span class="material-symbols-outlined text-xl">smart_toy</span>
        </div>
        <div>
          <h2 class="font-headline text-sm font-bold text-on-surface">AI 学习助手</h2>
          <p class="text-[10px] text-on-surface-variant uppercase tracking-wider font-body">Powered by DeepSeek</p>
        </div>
      </div>
      <span class="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-400"></span>
    </div>

    <!-- Messages -->
    <div ref="containerRef" class="flex-1 overflow-y-auto p-4 space-y-4 font-body">
      <div
        v-for="(m, idx) in messages"
        :key="idx"
        class="flex gap-2.5"
        :class="m.role === 'user' ? 'flex-row-reverse' : ''"
      >
        <!-- Avatar -->
        <div
          class="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-1"
          :class="m.role === 'user' ? 'bg-primary text-on-primary' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'"
        >
          <span class="material-symbols-outlined text-sm">{{ m.role === 'ai' ? 'smart_toy' : 'person' }}</span>
        </div>

        <!-- Bubble -->
        <div class="max-w-[85%] flex flex-col gap-1">
          <div
            class="rounded-2xl px-4 py-3 text-sm shadow-sm"
            :class="m.role === 'user'
              ? 'bg-primary text-on-primary rounded-tr-none'
              : 'bg-white dark:bg-slate-800 rounded-tl-none text-on-surface'"
          >
            <!-- Loading dots -->
            <template v-if="isThinking(m)">
              <span class="flex items-center gap-1 py-0.5">
                <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay:0.15s" />
                <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay:0.3s" />
              </span>
            </template>

            <!-- User message: plain text -->
            <template v-else-if="m.role === 'user'">
              <span class="whitespace-pre-wrap leading-relaxed">{{ m.content }}</span>
            </template>

            <!-- AI message: rendered Markdown -->
            <div
              v-else
              class="prose prose-sm max-w-none prose-slate prose-headings:mb-2 prose-headings:mt-4 prose-h1:text-lg prose-h2:text-base prose-h3:text-sm prose-p:text-[14px] prose-p:leading-relaxed prose-li:text-[14px] prose-li:my-0"
              v-html="renderMarkdown(m.content)"
            />
          </div>

          <!-- Generate card button (AI messages only, not welcome, not thinking) -->
          <div v-if="m.role === 'ai' && idx > 0 && m.content && !isThinking(m)" class="flex justify-start pl-1">
            <button
              class="flex items-center gap-1 text-[11px] transition-colors py-0.5 px-1.5 rounded-md"
              :class="m.isFlashcardGenerated
                ? 'text-green-500 cursor-default'
                : 'text-slate-400 hover:text-primary hover:bg-primary/5'"
              :disabled="extractingIdx === idx || m.isFlashcardGenerated"
              @click="!m.isFlashcardGenerated && handleGenerateCard(idx)"
            >
              <span class="material-symbols-outlined text-sm">
                {{ m.isFlashcardGenerated ? 'check_circle' : extractingIdx === idx ? 'hourglass_empty' : 'auto_awesome' }}
              </span>
              {{ m.isFlashcardGenerated ? '已生成卡片' : extractingIdx === idx ? '提取中…' : '生成卡片' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
      <div class="relative">
        <textarea
          v-model="input"
          class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition-all pr-12 font-body leading-relaxed"
          placeholder="向 AI 提问关于本节课的知识点..."
          rows="3"
          :disabled="sending"
          @keydown.enter.exact.prevent="send"
          @keydown.enter.shift.exact.stop
        />
        <button
          class="absolute bottom-3 right-3 w-8 h-8 bg-primary text-on-primary rounded-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
          type="button"
          :disabled="sending || !input.trim()"
          @click="send"
        >
          <span class="material-symbols-outlined text-base">send</span>
        </button>
      </div>
      <p class="text-[10px] text-slate-400 mt-1.5 text-center">Enter 发送 · Shift+Enter 换行</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { ElMessage } from 'element-plus'
import { streamChat, type ChatMessage as ApiChatMessage } from '@/api/chat'
import { createFlashcard, extractFlashcardContent } from '@/api/flashcard'
import { useStudentAuth } from '@/composables/useStudentAuth'

const { studentId } = useStudentAuth()

const props = defineProps<{
  courseId: string
  courseName?: string
  currentTimestamp?: number
  videoId?: string
  platform?: string
}>()

type Msg = { role: 'user' | 'ai'; content: string; isFlashcardGenerated?: boolean }

const WELCOME: Msg = { role: 'ai', content: '你好！我是你的 **AI 学习助手**。\n\n你可以问我关于本课程的知识点、概念解释或学习路径，我会用清晰的格式为你解答。' }

function storageKey(vid?: string) {
  return `ai_chat_${vid || props.videoId || props.courseId}`
}
function loadHistory(vid?: string): Msg[] {
  try {
    const raw = localStorage.getItem(storageKey(vid))
    if (raw) return JSON.parse(raw) as Msg[]
  } catch { /* ignore */ }
  return [WELCOME]
}
function saveHistory(msgs: Msg[], vid?: string) {
  try { localStorage.setItem(storageKey(vid), JSON.stringify(msgs)) } catch { /* ignore */ }
}

const messages = ref<Msg[]>([WELCOME])
const input = ref('')
const sending = ref(false)
const containerRef = ref<HTMLDivElement | null>(null)

// --- Flashcard state ---
const extractingIdx = ref<number | null>(null)

async function generateFlashcard(content: string): Promise<{ term: string; definition: string; example: string } | null> {
  try {
    return await extractFlashcardContent(content)
  } catch {
    return null
  }
}

async function handleGenerateCard(idx: number) {
  extractingIdx.value = idx
  const content = messages.value[idx].content

  try {
    const card = await generateFlashcard(content)
    if (!card) {
      ElMessage.error('知识提取失败，请重试')
      return
    }

    await createFlashcard({
      videoId: props.videoId || props.courseId,
      userId: studentId.value ?? undefined,
      term: card.term,
      definition: card.definition,
      example: card.example || null,
    })

    messages.value[idx].isFlashcardGenerated = true
    saveHistory(messages.value)
    ElMessage.success(`知识卡片【${card.term}】已保存！`)
  } catch (e) {
    ElMessage.error('生成失败：' + (e instanceof Error ? e.message : '未知错误'))
  } finally {
    extractingIdx.value = null
  }
}

onMounted(() => {
  messages.value = loadHistory()
  scrollBottom()
})

// 切换 videoId 时：保存旧记录 → 加载新记录
watch(() => props.videoId, (newId, oldId) => {
  saveHistory(messages.value, oldId)
  messages.value = loadHistory(newId)
  scrollBottom()
})

marked.setOptions({ gfm: true })

function renderMarkdown(content: string): string {
  if (!content) return ''
  // 兜底：剥除 AI 错误包裹的 ```markdown ... ``` 外层代码块
  const clean = content.replace(/^```markdown\n?/i, '').replace(/```\s*$/, '')
  const raw = marked.parse(clean) as string
  return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } })
}

function isThinking(m: Msg) {
  return m.role === 'ai' && !m.content && sending.value
}

async function scrollBottom() {
  await nextTick()
  if (containerRef.value) containerRef.value.scrollTop = containerRef.value.scrollHeight
}

async function send() {
  if (sending.value) return
  const content = input.value.trim()
  if (!content) return

  messages.value.push({ role: 'user', content })
  input.value = ''
  await scrollBottom()

  messages.value.push({ role: 'ai', content: '' })
  const aiIdx = messages.value.length - 1
  sending.value = true

  const history: ApiChatMessage[] = messages.value
    .slice(1, aiIdx)
    .filter((m) => (m.role === 'user' || m.role === 'ai') && m.content.trim())
    .map((m) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }))

  const messagesPayload: ApiChatMessage[] = history.length > 0
    ? history
    : [{ role: 'user', content }]

  const context = {
    courseName: props.courseName ?? '',
    currentTimestamp: props.currentTimestamp ?? 0,
    videoId: props.videoId ?? '',
    platform: props.platform ?? '',
  }

  try {
    await streamChat(messagesPayload, context, (chunk) => {
      messages.value[aiIdx].content += chunk
      scrollBottom()
    })
    if (!messages.value[aiIdx].content) {
      messages.value[aiIdx].content = '（空回复）'
    }
  } catch (e) {
    messages.value[aiIdx].content = `**请求失败**：${e instanceof Error ? e.message : '未知错误'}`
  } finally {
    sending.value = false
    await scrollBottom()
  }
}

watch(() => messages.value.length, () => {
  saveHistory(messages.value)
  scrollBottom()
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.25s; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translate(-50%, 8px); }
</style>
