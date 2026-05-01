<template>
  <main class="pb-16 px-6 lg:px-12 max-w-[1600px] mx-auto">
    <div class="flex flex-col lg:flex-row gap-10">
      <section class="lg:w-[70%] space-y-8">
        <!-- Player container -->
        <div class="relative aspect-video bg-black rounded-xl overflow-hidden shadow-xl ring-1 ring-white/10 min-h-[360px] lg:min-h-[450px]">
          <div v-if="loading" class="w-full h-full flex items-center justify-center text-white/80 text-sm">加载中...</div>
          <div v-else-if="error" class="w-full h-full flex flex-col items-center justify-center gap-3 text-white/80 text-sm px-6 text-center">
            <div>{{ error }}</div>
            <button class="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors" type="button" @click="reload">重试</button>
          </div>
          <div v-else-if="!course" class="w-full h-full flex items-center justify-center text-white/80 text-sm">课程不存在或已下架</div>
          <Player
            v-else
            ref="playerRef"
            :resource="activeResource"
            :startTime="studyRecord.lastPositionSeconds"
            @play="startHeartbeat"
            @pause="stopHeartbeat"
            @ended="onEnded"
            @loadedmetadata="onLoadedMetadata"
          />
        </div>

        <!-- Course info -->
        <div class="space-y-4">
          <h1 class="text-3xl font-bold tracking-tight text-on-surface font-headline">{{ course?.title || '课程播放' }}</h1>
          <div class="flex flex-wrap items-center gap-6 text-sm text-on-surface-variant font-body">
            <div class="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded">
              <span class="material-symbols-outlined text-base">verified_user</span>
              公益引用声明
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="bg-surface-container-lowest rounded-xl p-8 shadow-sm">
          <div class="flex gap-8 border-b border-surface-container-high mb-8 font-body">
            <button class="pb-4" :class="tab === 'intro' ? 'text-primary font-bold border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface transition-colors'" type="button" @click="tab = 'intro'">课程简介</button>
            <button class="pb-4" :class="tab === 'playlist' ? 'text-primary font-bold border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface transition-colors'" type="button" @click="tab = 'playlist'">剧集目录 ({{ course?.resources.length || 0 }})</button>
          </div>

          <div v-if="tab === 'intro'" class="prose prose-slate max-w-none text-on-surface-variant leading-relaxed font-body">
            <p>{{ course?.description || '暂无课程简介' }}</p>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
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
                <span class="text-sm font-medium truncate" :class="r.id === activeResourceId ? 'text-on-surface font-bold' : 'text-on-surface'">{{ r.title || '未命名资源' }}</span>
              </div>
              <div class="flex items-center gap-1.5 flex-shrink-0">
                <span v-if="studyRecord.isCompleted" class="material-symbols-outlined text-green-500 text-base" style="font-variation-settings:'FILL' 1;" title="已完成">check_circle</span>
                <span v-else-if="studyRecord.lastPositionSeconds > 0" class="material-symbols-outlined text-blue-500 text-base" style="font-variation-settings:'FILL' 1;" title="学习中">radio_button_checked</span>
                <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" :class="resourceTagClass(r.resource_type)">{{ resourceLabel(r.resource_type) }}</span>
              </div>
            </button>
          </div>
        </div>
      </section>

      <!-- AI Sidebar -->
      <aside class="hidden lg:flex flex-col lg:w-[30%] h-[calc(100vh-8rem)] sticky top-24">
        <AIChat :courseId="courseId" />
      </aside>
    </div>
  </main>

  <button class="lg:hidden fixed bottom-24 right-6 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center z-40 active:scale-90 transition-transform">
    <span class="material-symbols-outlined text-2xl" style="font-variation-settings:'FILL' 1;">smart_toy</span>
  </button>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Player from '@/components/Player.vue'
import AIChat from '@/components/AIChat.vue'
import { getCourseById, getCourseProgress, reportProgress, type CourseDto, type ProgressDto } from '@/api/course'
import { resourceLabel, resourceTagClass } from '@/domain/resourceMeta'

const route = useRoute()
const courseId = computed(() => String(route.params.id || ''))
const tab = ref<'intro' | 'playlist'>('intro')
const loading = ref(false)
const error = ref('')
const course = ref<CourseDto | null>(null)
const activeResourceId = ref('')
const studyRecord = ref<ProgressDto>({ lastPositionSeconds: 0, isCompleted: false, progressPercent: 0 })
const heartbeatTimer = ref<ReturnType<typeof setInterval> | null>(null)
const playerRef = ref<InstanceType<typeof Player> | null>(null)

const activeResource = computed(() => {
  const list = course.value?.resources || []
  return list.find((r) => r.id === activeResourceId.value) || list[0] || null
})

function stopHeartbeat() {
  if (heartbeatTimer.value) { clearInterval(heartbeatTimer.value); heartbeatTimer.value = null }
}

function startHeartbeat(video: HTMLVideoElement) {
  stopHeartbeat()
  heartbeatTimer.value = setInterval(async () => {
    if (video.paused || video.ended) return
    const dur = isFinite(video.duration) && video.duration > 0 ? video.duration : undefined
    try {
      const result = await reportProgress(courseId.value, { currentTime: Math.round(video.currentTime), ...(dur !== undefined && { duration: dur }) })
      studyRecord.value = { studyRecordId: result.studyRecordId, lastPositionSeconds: result.lastPositionSeconds, isCompleted: result.isCompleted, progressPercent: studyRecord.value.progressPercent }
    } catch { /* silent */ }
  }, 15000)
}

function onLoadedMetadata() {
  const pos = studyRecord.value.lastPositionSeconds
  const video = playerRef.value?.videoEl
  if (pos > 5 && video) video.currentTime = pos
}

async function onEnded() {
  stopHeartbeat()
  const video = playerRef.value?.videoEl
  if (!course.value) return
  try {
    const result = await reportProgress(course.value.id, {
      currentTime: video ? Math.round(video.duration) : 0,
      duration: video && isFinite(video.duration) ? video.duration : undefined,
    })
    studyRecord.value = { studyRecordId: result.studyRecordId, lastPositionSeconds: result.lastPositionSeconds, isCompleted: result.isCompleted, progressPercent: studyRecord.value.progressPercent }
  } catch (e) { console.log('[progress] ended failed', e) }
}

async function loadProgress() {
  try { studyRecord.value = await getCourseProgress(courseId.value) } catch { /* silent */ }
}

async function reload() {
  error.value = ''
  loading.value = true
  try {
    const data = await getCourseById(courseId.value)
    course.value = data
    activeResourceId.value = data.resources[0]?.id || ''
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载课程失败'
  } finally {
    loading.value = false
  }
  await loadProgress()
}

watch(courseId, reload, { immediate: true })
watch(activeResourceId, stopHeartbeat)
onUnmounted(stopHeartbeat)
</script>
