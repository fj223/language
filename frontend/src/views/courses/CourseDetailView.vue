<template>
  <main class="pt-24 pb-16 px-6 lg:px-12 max-w-[1600px] mx-auto">
    <div class="flex flex-col lg:flex-row gap-10">
      <!-- Main Content Area (70%) -->
      <section class="lg:w-[70%] space-y-8">
        <!-- Video Player Container -->
        <div class="relative aspect-video bg-black rounded-xl overflow-hidden shadow-xl ring-1 ring-white/10 min-h-[360px] lg:min-h-[450px]">
          <div v-if="loading" class="w-full h-full flex items-center justify-center text-white/80 text-sm">加载中...</div>
          <div v-else-if="error" class="w-full h-full flex flex-col items-center justify-center gap-3 text-white/80 text-sm px-6 text-center">
            <div>{{ error }}</div>
            <button
              class="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
              type="button"
              @click="reload"
            >
              重试
            </button>
          </div>
          <div v-else-if="!course" class="w-full h-full flex items-center justify-center text-white/80 text-sm">课程不存在或已下架</div>

          <template v-else>
            <template v-if="activeResource?.resource_type === 'local'">
              <video
                ref="videoRef"
                class="w-full h-full object-contain bg-black"
                controls
                :src="activeResource.source_url"
                @timeupdate="videoCurrentTime = Math.floor(($event.target as HTMLVideoElement).currentTime)"
                @play="startHeartbeat($event.target as HTMLVideoElement)"
                @pause="stopHeartbeat"
                @ended="onLocalEnded"
                @loadedmetadata="onLoadedMetadata"
              />
            </template>

            <template v-else-if="activeResource?.resource_type === 'youtube'">
              <iframe
                v-if="youtubeEmbedUrl"
                class="w-full h-full"
                :src="youtubeEmbedUrl"
                title="YouTube player"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
              />
              <div v-else class="w-full h-full flex items-center justify-center text-white/80 text-sm">YouTube 链接无效</div>
            </template>

            <template v-else-if="activeResource?.resource_type === 'bilibili'">
              <iframe
                v-if="bilibiliEmbedUrl"
                class="w-full h-full"
                :src="bilibiliEmbedUrl"
                title="Bilibili player"
                frameborder="0"
                allowfullscreen
                referrerpolicy="strict-origin-when-cross-origin"
                sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
              />
              <!-- Bilibili fallback -->
              <div v-else class="w-full h-full flex items-center justify-center p-6">
                <div class="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-6 text-center">
                  <div class="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center mx-auto mb-4">
                    <span class="material-symbols-outlined text-pink-300 text-2xl">play_circle</span>
                  </div>
                  <div class="text-white font-semibold text-base mb-1">无法内嵌播放</div>
                  <div class="text-white/60 text-sm mb-5">该 Bilibili 链接无法解析为嵌入地址，请前往原网页观看。</div>
                  <div class="text-white/40 text-xs break-all bg-black/30 rounded-lg px-3 py-2 mb-5">{{ activeResource?.source_url }}</div>
                  <a
                    class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-pink-500 text-white hover:bg-pink-600 transition-colors text-sm font-semibold"
                    :href="activeResource?.source_url"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span class="material-symbols-outlined text-base">open_in_new</span>
                    跳转至原网页播放
                  </a>
                </div>
              </div>
            </template>

            <template v-else>
              <div class="w-full h-full flex items-center justify-center p-6">
                <div class="w-full max-w-xl bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-6">
                  <div class="text-white font-semibold text-lg mb-2">外部资源</div>
                  <div class="text-white/80 text-sm mb-4">该内容需要前往第三方网站/平台学习。</div>
                  <div class="text-white/70 text-xs break-all bg-black/30 rounded-lg p-3 mb-4">{{ activeResource?.source_url }}</div>
                  <a
                    class="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-primary text-on-primary hover:bg-primary-dim transition-colors text-sm font-semibold"
                    :href="activeResource?.source_url"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    前往外部学习
                  </a>
                </div>
              </div>
            </template>

          </template>
        </div>
        <!-- Course Header Info -->
        <div class="space-y-4">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <h1 class="text-3xl font-bold tracking-tight text-on-surface font-headline">{{ course?.title || '课程播放' }}</h1>
            <div class="flex items-center gap-3">
              <button class="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest transition-colors text-sm font-medium">
                <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 0;">favorite</span>
                <span>收藏</span>
              </button>
              <button class="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-dim transition-colors text-sm font-medium">
                <span class="material-symbols-outlined">share</span>
                <span>分享</span>
              </button>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-6 text-sm text-on-surface-variant font-body">
            <div class="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded">
              <span class="material-symbols-outlined text-base">verified_user</span>
              公益引用声明
            </div>
            <div class="flex items-center gap-1">
              <span class="material-symbols-outlined text-base">visibility</span>
              128,402 次观看
            </div>
            <div class="flex items-center gap-1">
              <span class="material-symbols-outlined text-base">schedule</span>
              更新于 2023年10月
            </div>
          </div>
        </div>
        <!-- Tabs Section -->
        <div class="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
          <div class="flex gap-8 border-b border-surface-container-high mb-8 font-body">
            <button
              class="pb-4"
              :class="tab === 'intro' ? 'text-primary font-bold border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface transition-colors'"
              type="button"
              @click="tab = 'intro'"
            >
              课程简介
            </button>
            <button
              class="pb-4"
              :class="tab === 'playlist' ? 'text-primary font-bold border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface transition-colors'"
              type="button"
              @click="tab = 'playlist'"
            >
              剧集目录 ({{ course?.resources.length || 0 }})
            </button>
            <button
              class="pb-4"
              :class="tab === 'flashcards' ? 'text-primary font-bold border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface transition-colors'"
              type="button"
              @click="tab = 'flashcards'; loadVideoFlashcards()"
            >
              知识卡片 ({{ videoFlashcards.length }})
            </button>
          </div>
          <div v-if="tab === 'intro'" class="prose prose-slate max-w-none text-on-surface-variant leading-relaxed space-y-4 font-body">
            <p>{{ course?.description || '暂无课程简介' }}</p>
          </div>

          <div v-else-if="tab === 'playlist'" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <button
              v-for="(r, idx) in course?.resources || []"
              :key="r.id"
              type="button"
              class="flex items-center justify-between p-4 rounded-lg border-l-4 transition-colors"
              :class="r.id === activeResourceId ? 'bg-white ring-1 ring-primary/20 border-primary shadow-md' : 'bg-surface-container-low border-transparent hover:bg-surface-container-high'"
              @click="activeResourceId = r.id"
            >
              <div class="flex items-center gap-3 min-w-0">
                <span class="text-xs font-bold" :class="r.id === activeResourceId ? 'text-primary' : 'text-on-surface-variant'">{{ String(idx + 1).padStart(2, '0') }}</span>
                <span class="text-sm font-medium truncate" :class="r.id === activeResourceId ? 'text-on-surface font-bold' : 'text-on-surface'">
                  {{ r.title || '未命名资源' }}
                </span>
              </div>
              <div class="flex items-center gap-1.5 flex-shrink-0">
                <span
                  v-if="studyRecord.isCompleted"
                  class="material-symbols-outlined text-green-500 text-base"
                  style="font-variation-settings: 'FILL' 1;"
                  title="已完成"
                >check_circle</span>
                <span
                  v-else-if="studyRecord.lastPositionSeconds > 0"
                  class="material-symbols-outlined text-blue-500 text-base"
                  style="font-variation-settings: 'FILL' 1;"
                  title="学习中"
                >radio_button_checked</span>
                <span class="text-[10px] font-bold uppercase tracking-wider" :class="resourceTagClassLocal(r.resource_type)">{{ resourceLabel(r.resource_type) }}</span>
              </div>
            </button>
          </div>

          <!-- Flashcards Tab -->
          <div v-else-if="tab === 'flashcards'">
            <div v-if="flashcardsLoading" class="flex justify-center py-10">
              <span class="material-symbols-outlined text-3xl text-slate-300 animate-spin">progress_activity</span>
            </div>
            <div v-else-if="videoFlashcards.length === 0" class="text-center py-10 text-slate-400">
              <span class="material-symbols-outlined text-4xl mb-2 block">style</span>
              <p class="text-sm">本节暂无知识卡片，在右侧 AI 助手中生成吧</p>
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="card in videoFlashcards"
                :key="card.id"
                class="flex items-start gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors"
              >
                <span class="material-symbols-outlined text-primary text-base mt-0.5 flex-shrink-0">style</span>
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-on-surface">{{ card.term }}</p>
                  <p class="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{{ card.definition }}</p>
                </div>
              </div>
            </div>
            <div class="mt-6 flex justify-end">
              <button
                class="flex items-center gap-1.5 text-sm text-primary hover:underline"
                @click="router.push('/flashcards')"
              >
                查看全部知识卡片
                <span class="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </section>
      <!-- AI Sidebar (30%) -->
      <aside class="hidden lg:flex flex-col lg:w-[30%] h-[calc(100vh-8rem)] sticky top-24">
        <div class="bg-slate-50 dark:bg-slate-950 rounded-2xl flex flex-col h-full shadow-sm overflow-hidden border border-slate-200/50">
          <!-- Sidebar Header -->
          <div class="p-6 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-primary">
                <span class="material-symbols-outlined">smart_toy</span>
              </div>
              <div>
                <h2 class="font-headline text-sm font-bold text-on-surface">AI 学习助手</h2>
                <p class="text-[10px] text-on-surface-variant uppercase tracking-wider font-body">Your learning sanctuary</p>
              </div>
            </div>
            <span class="w-2 h-2 rounded-full bg-green-500"></span>
          </div>
          <!-- Chat Area -->
          <div ref="chatContainerRef" class="flex-1 overflow-y-auto p-6 space-y-6 font-body">
            <div
              v-for="(m, idx) in chatMessages"
              :key="idx"
              class="flex gap-3 max-w-[90%]"
              :class="m.role === 'user' ? 'ml-auto flex-row-reverse' : ''"
            >
              <div
                class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
                :class="m.role === 'user' ? 'bg-surface-container-highest text-on-surface-variant' : 'bg-primary text-on-primary'"
              >
                <span v-if="m.role === 'ai'" class="material-symbols-outlined text-sm">smart_toy</span>
                <span v-else class="material-symbols-outlined text-sm">person</span>
              </div>
              <div
                class="p-4 rounded-2xl shadow-sm text-sm leading-relaxed"
                :class="m.role === 'user'
                  ? 'bg-primary text-on-primary rounded-tr-none'
                  : (m.role === 'ai' && !m.content && sending)
                    ? 'bg-white dark:bg-slate-900 rounded-tl-none italic text-on-surface-variant flex items-center gap-2'
                    : 'bg-white dark:bg-slate-900 rounded-tl-none text-on-surface'"
              >
                <template v-if="m.role === 'ai' && !m.content && sending">
                  <span class="flex gap-1">
                    <span class="w-1 h-1 bg-primary rounded-full animate-bounce"></span>
                    <span class="w-1 h-1 bg-primary rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
                    <span class="w-1 h-1 bg-primary rounded-full animate-bounce" style="animation-delay: 0.4s"></span>
                  </span>
                  AI 正在思考...
                </template>
                <template v-else>
                  {{ m.content }}
                </template>
              </div>
            </div>
          </div>
          <!-- Chat Input -->
          <div class="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <div class="relative">
              <textarea
                v-model="chatInput"
                class="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-4 text-sm focus:ring-2 ring-primary/20 resize-none transition-all pr-12 font-body"
                placeholder="向 AI 提问关于本节课的知识点..."
                rows="3"
                :disabled="sending"
                @keydown.enter.exact.prevent="sendChat"
                @keydown.enter.shift.exact.stop
              ></textarea>
              <button
                class="absolute bottom-3 right-3 w-8 h-8 bg-primary text-on-primary rounded-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                type="button"
                :disabled="sending"
                @click="sendChat"
              >
                <span class="material-symbols-outlined text-lg">send</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </main>
  
  <!-- Mobile AI FAB -->
  <button class="lg:hidden fixed bottom-24 right-6 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center z-40 active:scale-90 transition-transform">
    <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">smart_toy</span>
  </button>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCourseById, getCourseProgress, reportProgress, type CourseDto, type ProgressDto, type VideoResourceType } from '@/api/course'
import { streamChat, type ChatMessage as ApiChatMessage } from '@/api/chat'
import { resourceLabel, resourceTagClass } from '@/domain/resourceMeta'
import { fetchFlashcards, type Flashcard } from '@/api/flashcard'

type TabKey = 'intro' | 'playlist' | 'flashcards'

const route = useRoute()
const router = useRouter()
const tab = ref<TabKey>('intro')

const loading = ref(false)
const error = ref('')
const course = ref<CourseDto | null>(null)
const activeResourceId = ref('')

// --- Progress state ---
const studyRecord = ref<ProgressDto>({ lastPositionSeconds: 0, isCompleted: false, progressPercent: 0 })
const heartbeatTimer = ref<ReturnType<typeof setInterval> | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
// 实时同步视频播放秒数，供 AI context 使用
const videoCurrentTime = ref(0)

// --- Flashcard state ---
const videoFlashcards = ref<Flashcard[]>([])
const flashcardsLoading = ref(false)

async function loadVideoFlashcards() {
  const vid = activeResource.value ? extractVideoId(activeResource.value) : ''
  if (!vid) return
  flashcardsLoading.value = true
  try {
    videoFlashcards.value = await fetchFlashcards(vid)
  } catch { /* silent */ } finally {
    flashcardsLoading.value = false
  }
}

type ChatRole = 'user' | 'ai'
type ChatMessage = { role: ChatRole; content: string }

const chatMessages = ref<ChatMessage[]>([
  {
    role: 'ai',
    content: '你好！我是你的 AI 学习助手。你可以问我关于本课程的知识点、学习路径或总结。',
  },
])

const chatInput = ref('')
const sending = ref(false)
const chatContainerRef = ref<HTMLDivElement | null>(null)

const courseId = computed(() => String(route.params.id || ''))

const activeResource = computed(() => {
  const list = course.value?.resources || []
  return list.find((r) => r.id === activeResourceId.value) || list[0] || null
})

const youtubeEmbedUrl = computed(() => {
  const url = activeResource.value?.resource_type === 'youtube' ? activeResource.value.source_url : ''
  if (!url) return ''
  const id = extractYouTubeId(url)
  if (!id) return ''
  return `https://www.youtube.com/embed/${id}`
})

const bilibiliEmbedUrl = computed(() => {
  if (activeResource.value?.resource_type !== 'bilibili') return ''
  const base = extractBilibiliEmbedUrl(activeResource.value.source_url)
  if (!base) return ''
  const t = studyRecord.value.lastPositionSeconds
  return t > 0 ? `${base}&t=${t}` : base
})

// --- Progress helpers ---
function stopHeartbeat() {
  if (heartbeatTimer.value) {
    clearInterval(heartbeatTimer.value)
    heartbeatTimer.value = null
  }
}

function startHeartbeat(video: HTMLVideoElement) {
  stopHeartbeat()
  heartbeatTimer.value = setInterval(async () => {
    if (video.paused || video.ended) return
    const dur = isFinite(video.duration) && video.duration > 0 ? video.duration : undefined
    try {
      const result = await reportProgress(courseId.value, {
        currentTime: Math.round(video.currentTime),
        ...(dur !== undefined && { duration: dur }),
      })
      studyRecord.value = {
        studyRecordId: result.studyRecordId,
        lastPositionSeconds: result.lastPositionSeconds,
        isCompleted: result.isCompleted,
        progressPercent: studyRecord.value.progressPercent,
      }
    } catch { /* silent — don't interrupt playback */ }
  }, 15000)
}

async function loadProgress() {
  try {
    studyRecord.value = await getCourseProgress(courseId.value)
  } catch { /* silent fallback */ }
}

function onLoadedMetadata() {
  const pos = studyRecord.value.lastPositionSeconds
  if (pos > 5 && videoRef.value) {
    videoRef.value.currentTime = pos
  }
}

function extractBilibiliEmbedUrl(input: string): string {
  const src = input.trim()

  // 1. 纯 BV 号
  if (/^BV[0-9A-Za-z]{10,}$/.test(src)) {
    const url = `https://player.bilibili.com/player.html?bvid=${src}&as_wide=1&high_quality=1&danmaku=1`
    console.log('[bilibili] embed url:', url)
    return url
  }

  // 2. 完整 URL（www / m.bilibili.com）
  try {
    const u = new URL(src)
    const host = u.hostname.toLowerCase()

    if (host === 'b23.tv') {
      console.log('[bilibili] b23.tv short link — fallback')
      return ''
    }

    if (host === 'www.bilibili.com' || host === 'm.bilibili.com') {
      const match = u.pathname.match(/\/video\/(BV[0-9A-Za-z]{10,})/)
      if (match?.[1]) {
        const url = `https://player.bilibili.com/player.html?bvid=${match[1]}&as_wide=1&high_quality=1&danmaku=1`
        console.log('[bilibili] embed url:', url)
        return url
      }
    }
  } catch { /* ignore */ }

  console.log('[bilibili] failed to parse:', src)
  return ''
}

function extractYouTubeId(input: string) {
  try {
    const isId = /^[a-zA-Z0-9_-]{6,}$/.test(input) && !/^https?:\/\//.test(input)
    if (isId) return input

    const u = new URL(input)

    if (u.hostname === 'youtu.be') {
      return u.pathname.replace(/^\//, '')
    }

    if (u.hostname.endsWith('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v) return v

      const parts = u.pathname.split('/').filter(Boolean)
      const embedIdx = parts.indexOf('embed')
      if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1]

      const shortsIdx = parts.indexOf('shorts')
      if (shortsIdx >= 0 && parts[shortsIdx + 1]) return parts[shortsIdx + 1]
    }

    return ''
  } catch {
    return ''
  }
}

function resourceTagClassLocal(t: VideoResourceType) {
  return `${resourceTagClass(t)} px-2 py-0.5 rounded`
}

// 从当前资源提取平台视频 ID，供 AI context 使用
function extractVideoId(r: { resource_type: string; source_url: string }): string {
  if (r.resource_type === 'youtube') return extractYouTubeId(r.source_url)
  if (r.resource_type === 'bilibili') {
    const src = r.source_url.trim()
    if (/^BV[0-9A-Za-z]{10,}$/.test(src)) return src
    try {
      const match = new URL(src).pathname.match(/\/video\/(BV[0-9A-Za-z]{10,})/)
      return match?.[1] ?? ''
    } catch { return '' }
  }
  return ''
}

async function scrollChatToBottom() {
  await nextTick()
  const el = chatContainerRef.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}

async function sendChat() {
  if (sending.value) return
  const content = chatInput.value.trim()
  if (!content) return

  chatMessages.value.push({ role: 'user', content })
  chatInput.value = ''
  await scrollChatToBottom()

  // 追加空 AI 消息，流式内容直接追加进来（打字机效果）
  chatMessages.value.push({ role: 'ai', content: '' })
  const aiIndex = chatMessages.value.length - 1
  sending.value = true

  // 组装历史：跳过初始欢迎语（index 0 的 ai 消息），只保留真实对话轮次
  // 注意：history 必须以 user 消息开头，否则部分模型会忽略 system prompt
  const history: ApiChatMessage[] = chatMessages.value
    .slice(1, aiIndex) // 跳过 index 0 的欢迎语
    .filter((m) => (m.role === 'user' || m.role === 'ai') && m.content.trim())
    .map((m) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }))

  // history 为空（第一次对话）时，直接用当前用户消息，避免 isValidMessages 校验失败
  const messagesPayload: ApiChatMessage[] = history.length > 0
    ? history
    : [{ role: 'user', content }]

  const context = {
    courseName: course.value?.title ?? '',
    currentTimestamp: videoCurrentTime.value,
    videoId: activeResource.value ? extractVideoId(activeResource.value) : '',
    platform: activeResource.value?.resource_type ?? '',
  }

  // 调试：确认 context 值
  console.log('[sendChat] context:', JSON.stringify(context))
  console.log('[sendChat] history length:', history.length)

  try {
    await streamChat(messagesPayload, context, (chunk) => {
      chatMessages.value[aiIndex].content += chunk
      scrollChatToBottom()
    })
    if (!chatMessages.value[aiIndex].content) {
      chatMessages.value[aiIndex].content = '（空回复）'
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : '请求失败'
    chatMessages.value[aiIndex].content = `AI 请求失败：${msg}`
  } finally {
    sending.value = false
    await scrollChatToBottom()
  }
}

async function reload() {
  error.value = ''
  loading.value = true
  try {
    const data = await getCourseById(courseId.value)
    course.value = data
    const first = data.resources[0]
    activeResourceId.value = first ? first.id : ''
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载课程失败'
  } finally {
    loading.value = false
  }
  await loadProgress()
}

async function onLocalEnded() {
  stopHeartbeat()
  const r = activeResource.value
  if (!course.value || !r) return
  const video = videoRef.value
  try {
    const result = await reportProgress(course.value.id, {
      currentTime: video ? Math.round(video.duration) : 0,
      duration: video && isFinite(video.duration) ? video.duration : undefined,
    })
    studyRecord.value = {
      studyRecordId: result.studyRecordId,
      lastPositionSeconds: result.lastPositionSeconds,
      isCompleted: result.isCompleted,
      progressPercent: studyRecord.value.progressPercent,
    }
  } catch (e) {
    console.log('[progress] ended report failed', e)
  }
}

watch(
  courseId,
  async () => {
    await reload()
  },
  { immediate: true },
)

watch(activeResourceId, () => {
  stopHeartbeat()
})

onMounted(async () => {
  await scrollChatToBottom()
})

onUnmounted(() => {
  stopHeartbeat()
})

watch(
  () => chatMessages.value.length,
  async () => {
    await scrollChatToBottom()
  },
)
</script>
