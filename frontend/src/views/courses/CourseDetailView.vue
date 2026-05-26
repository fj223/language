<template>
  <main class="min-h-screen" style="background: #f5f7fa;">
    <div class="max-w-6xl mx-auto px-6 py-10">

      <nav class="flex items-center gap-2 text-sm text-on-surface-variant mb-8 font-body" aria-label="面包屑">
        <router-link to="/courses" class="hover:text-primary transition-colors">{{ $t('courseDetail.breadcrumbList') }}</router-link>
        <span class="material-symbols-outlined text-base opacity-40">chevron_right</span>
        <span class="text-on-surface font-medium line-clamp-1">{{ course.title }}</span>
      </nav>

      <div class="flex flex-col lg:flex-row gap-8 items-start">

        <div class="flex-1 min-w-0 space-y-6">

          <div
            class="w-full rounded-3xl overflow-hidden relative"
            style="aspect-ratio: 16/7;"
          >
            <img
              v-if="course.coverUrl"
              :src="course.coverUrl"
              :alt="course.title"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="w-full h-full flex flex-col items-center justify-center gap-4"
              :style="{ background: coverGradient }"
            >
              <span class="text-6xl" aria-hidden="true">{{ languageEmoji }}</span>
              <p class="text-white/80 text-lg font-bold font-headline">{{ course.language }} · {{ course.level ?? $t('courseDetail.levelPending') }}</p>
            </div>

            <div class="absolute top-4 left-4 flex items-center gap-2">
              <span
                class="px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm shadow-sm"
                :class="languageBadgeClass"
              >{{ course.language }}</span>
              <span
                class="px-3 py-1 rounded-full text-xs font-bold"
                :class="levelBadgeClass"
              >{{ course.level ?? $t('courseDetail.levelPending') }}</span>
            </div>
          </div>

          <div class="bg-white rounded-2xl p-7 shadow-sm border border-outline-variant/10">
            <h1 class="text-2xl font-extrabold text-on-surface font-headline tracking-tight mb-4">
              {{ course.title }}
            </h1>
            <div class="flex flex-wrap gap-5 text-sm text-on-surface-variant font-body">
              <div class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-base text-primary/60">person</span>
                <span>{{ course.teacher ?? $t('courseDetail.teacherPending') }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-base text-primary/60">schedule</span>
                <span>{{ course.schedule ?? $t('courseDetail.timePending') }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-base text-primary/60">language</span>
                <span>{{ course.language }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-base text-primary/60">signal_cellular_alt</span>
                <span>{{ course.level ?? $t('courseDetail.levelPending') }}</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl p-7 shadow-sm border border-outline-variant/10">
            <h2 class="text-lg font-bold text-on-surface font-headline mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-xl">description</span>
              {{ $t('courseDetail.introTitle') }}
            </h2>
            <div class="text-sm text-on-surface-variant font-body leading-relaxed space-y-3">
              <p>{{ $t('courseDetail.introP1', { lang: course.language }) }}</p>
              <p>{{ $t('courseDetail.introP2') }}</p>
            </div>
          </div>

          <div class="bg-white rounded-2xl p-7 shadow-sm border border-outline-variant/10">
            <h2 class="text-lg font-bold text-on-surface font-headline mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-xl">group</span>
              {{ $t('courseDetail.audienceTitle') }}
            </h2>
            <ul class="space-y-3">
              <li
                v-for="item in targetAudience"
                :key="item"
                class="flex items-start gap-3 text-sm text-on-surface-variant font-body"
              >
                <span class="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span class="material-symbols-outlined text-primary text-xs">check</span>
                </span>
                {{ item }}
              </li>
            </ul>
          </div>

          <div class="bg-white rounded-2xl p-7 shadow-sm border border-outline-variant/10">
            <h2 class="text-lg font-bold text-on-surface font-headline mb-5 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-xl">format_list_bulleted</span>
              {{ $t('courseDetail.syllabusTitle') }}
            </h2>
            <div class="space-y-3">
              <div
                v-for="(unit, idx) in syllabus"
                :key="idx"
                class="syllabus-item"
              >
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                    {{ String(idx + 1).padStart(2, '0') }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-on-surface">{{ unit.title }}</p>
                    <p class="text-xs text-on-surface-variant mt-0.5">{{ unit.desc }}</p>
                  </div>
                  <span class="text-xs text-on-surface-variant shrink-0 font-body">{{ unit.hours }} {{ $t('courseDetail.hoursSuffix') }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 视频课程目录 & 播放器 -->
          <div class="bg-white rounded-2xl p-7 shadow-sm border border-outline-variant/10">
            <h2 class="text-lg font-bold text-on-surface font-headline mb-4 flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-xl">play_circle</span>
              {{ $t('courseDetail.videoLessons') }}
            </h2>

            <!-- 视频播放占位区 -->
            <div
              v-if="selectedLesson"
              class="mb-5 rounded-xl overflow-hidden border border-outline-variant/15"
              style="background: #0f172a;"
            >
              <div class="aspect-video flex flex-col items-center justify-center gap-3 text-white/90">
                <span class="material-symbols-outlined text-5xl">smart_display</span>
                <p class="font-bold text-lg">{{ selectedLesson.title }}</p>
                <p class="text-sm text-white/50">{{ $t('courseDetail.episodeInfo', { episode: selectedLesson.episode, duration: selectedLesson.duration }) }}</p>
                <div class="w-3/4 h-1.5 rounded-full bg-white/20 mt-2 overflow-hidden">
                  <div
                    class="h-full rounded-full bg-primary transition-all duration-500"
                    :style="{ width: (lessonProgress.get(selectedLesson.id) ?? 0) + '%' }"
                  />
                </div>
                <span class="text-xs text-white/40">
                  {{ $t('courseDetail.progressPercent', { percent: lessonProgress.get(selectedLesson.id) ?? 0 }) }}
                </span>
                <button
                  type="button"
                  class="mt-2 px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                  :class="(lessonProgress.get(selectedLesson.id) ?? 0) >= 95
                    ? 'bg-green-500/20 text-green-400 cursor-default'
                    : 'bg-primary/70 hover:bg-primary text-white'"
                  :disabled="(lessonProgress.get(selectedLesson.id) ?? 0) >= 95"
                  @click="simulateProgress(selectedLesson.id)"
                >
                  <span class="material-symbols-outlined text-base">
                    {{ (lessonProgress.get(selectedLesson.id) ?? 0) >= 95 ? 'check_circle' : 'trending_up' }}
                  </span>
                  {{ $t('courseDetail.simulateProgress') }}
                </button>
              </div>
            </div>

            <!-- 无选中课程时的占位 -->
            <div
              v-else
              class="mb-5 rounded-xl border-2 border-dashed border-outline-variant/20 flex flex-col items-center justify-center py-14 text-on-surface-variant bg-slate-50/50"
            >
              <span class="material-symbols-outlined text-4xl mb-2">touch_app</span>
              <p class="text-sm font-bold">{{ $t('courseDetail.clickToStart') }}</p>
            </div>

            <!-- 章节列表 -->
            <div class="space-y-2">
              <div
                v-for="lesson in lessons"
                :key="lesson.id"
                class="flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all border"
                :class="selectedLesson?.id === lesson.id
                  ? 'bg-primary/5 border-primary/30 shadow-sm'
                  : 'bg-slate-50 border-transparent hover:bg-slate-100'"
                @click="selectedLessonId = lesson.id"
              >
                <span
                  class="material-symbols-outlined text-xl shrink-0"
                  :class="(lessonProgress.get(lesson.id) ?? 0) >= 95 ? 'text-green-500' : 'text-primary/60'"
                >
                  {{ (lessonProgress.get(lesson.id) ?? 0) >= 95 ? 'check_circle' : 'play_circle' }}
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-on-surface">
                    {{ $t('courseDetail.lessonLabel', { episode: lesson.episode, title: lesson.title }) }}
                  </p>
                  <p class="text-xs text-on-surface-variant">{{ lesson.duration }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-20 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      :class="(lessonProgress.get(lesson.id) ?? 0) >= 95 ? 'bg-green-500' : 'bg-primary'"
                      :style="{ width: (lessonProgress.get(lesson.id) ?? 0) + '%' }"
                    />
                  </div>
                  <span
                    class="text-xs font-bold w-10 text-right"
                    :class="(lessonProgress.get(lesson.id) ?? 0) >= 95 ? 'text-green-600' : 'text-primary'"
                  >
                    {{ lessonProgress.get(lesson.id) ?? 0 }}%
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <aside class="w-full lg:w-80 shrink-0 lg:sticky lg:top-24">
          <div class="bg-white rounded-3xl shadow-lg border border-outline-variant/10 overflow-hidden">

            <div class="p-6 border-b border-outline-variant/10">
              <div class="flex items-end gap-2 mb-1">
                <span class="text-4xl font-black text-primary">¥{{ course.price }}</span>
                <span class="text-sm text-on-surface-variant line-through mb-1">¥{{ course.originalPrice }}</span>
              </div>
              <p class="text-xs text-green-600 font-semibold">
                {{ $t('courseDetail.discountPrefix') }}{{ course.originalPrice - course.price }}
              </p>
            </div>

            <div class="px-6 py-4 space-y-3 border-b border-outline-variant/10">
               <div class="flex items-center justify-between text-sm">
                <span class="text-on-surface-variant font-body flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-base text-primary/50">video_library</span>
                  {{ $t('courseDetail.totalLessons') }}
                </span>
                <span class="font-bold text-on-surface">{{ course.totalLessons }} {{ $t('courseDetail.hoursSuffix') }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-on-surface-variant font-body flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-base text-primary/50">schedule</span>
                  {{ $t('courseDetail.duration') }}
                </span>
                <span class="font-bold text-on-surface">{{ course.duration }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-on-surface-variant font-body flex items-center gap-1.5">
                   <span class="material-symbols-outlined text-base text-primary/50">group</span>
                  {{ $t('courseDetail.classSize') }}
                </span>
                <span class="font-bold text-on-surface">{{ $t('courseDetail.smallClass') }}</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                 <span class="text-on-surface-variant font-body flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-base text-primary/50">workspace_premium</span>
                  {{ $t('courseDetail.certificate') }}
                </span>
                <span class="font-bold text-green-600">{{ $t('courseDetail.awarded') }}</span>
                </div>
            </div>

            <div class="p-6 space-y-3">
              <button
                type="button"
                class="enroll-btn w-full"
                @click="handleEnroll"
              >
                <span class="material-symbols-outlined text-xl" aria-hidden="true">how_to_reg</span>
                {{ $t('courseDetail.enrollBtn') }}
              </button>
              <button
                type="button"
                class="consult-btn w-full"
                @click="handleConsult"
              >
                <span class="material-symbols-outlined text-xl" aria-hidden="true">support_agent</span>
                {{ $t('courseDetail.consultBtn') }}
              </button>
              <p class="text-center text-xs text-on-surface-variant font-body">
                {{ $t('courseDetail.refundPolicy') }}
              </p>
            </div>
          </div>

          <div class="mt-4 bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/10">
            <h3 class="text-sm font-bold text-on-surface mb-3 font-headline">{{ $t('courseDetail.teacherTitle') }}</h3>
             <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
                :style="{ background: coverGradient }"
              >
                {{ (course.teacher ?? $t('courseDetail.defaultTeacher')).charAt(0) }}
              </div>
              <div>
                <p class="text-sm font-bold text-on-surface">{{ course.teacher ?? $t('courseDetail.teacherPending') }}</p>
                <p class="text-xs text-on-surface-variant mt-0.5">{{ $t('courseDetail.seniorTeacher', { lang: course.language }) }}</p>
                <div class="flex items-center gap-1 mt-1">
                  <span v-for="i in 5" :key="i" class="material-symbols-outlined text-yellow-400 text-sm" style="font-variation-settings:'FILL' 1;">star</span>
                  <span class="text-xs text-on-surface-variant ml-1">{{ $t('courseDetail.score') }}</span>
                  </div>
              </div>
            </div>
          </div>

        </aside>
      </div>
    </div>

    <Transition name="toast">
      <div
        v-if="toastVisible"
        class="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3.5 rounded-2xl text-white text-sm font-semibold shadow-xl"
        style="background: linear-gradient(135deg, #335ea1 0%, #4f7fd4 100%);"
        role="status"
        aria-live="polite"
      >
        <span class="material-symbols-outlined text-base" aria-hidden="true">check_circle</span>
        {{ toastMsg }}
      </div>
    </Transition>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getGatewayCourses, type GatewayCourse } from '@/api/gateway'
import { reportProgress } from '@/api/course'

const route = useRoute()
const { t } = useI18n()
const courseId = computed(() => String(route.params.id ?? ''))

const rawCourse = ref<GatewayCourse | null>(null)

onMounted(async () => {
  try {
    const all = await getGatewayCourses()
    rawCourse.value = all.find((c) => c.id === courseId.value) ?? all[0] ?? null
  } catch {
    // Отключение тишины не удалось, используйте значение по умолчанию.
  }
})

// duration 用 i18n key 存储，在 computed 里动态翻译
const PRICE_MAP: Record<string, { price: number; originalPrice: number; totalLessons: number; durationKey: string; durationN: number }> = {
  c001: { price: 2980, originalPrice: 3980, totalLessons: 48, durationKey: 'months', durationN: 3 },
  c002: { price: 1980, originalPrice: 2580, totalLessons: 32, durationKey: 'months', durationN: 2 },
  c003: { price: 1280, originalPrice: 1680, totalLessons: 24, durationKey: 'weeks',  durationN: 6 },
  c004: { price: 880,  originalPrice: 1280, totalLessons: 20, durationKey: 'weeks',  durationN: 5 },
  c005: { price: 2480, originalPrice: 3200, totalLessons: 40, durationKey: 'months', durationN: 2.5 },
  c006: { price: 980,  originalPrice: 1380, totalLessons: 24, durationKey: 'weeks',  durationN: 6 },
  c007: { price: 3200, originalPrice: 4200, totalLessons: 56, durationKey: 'months', durationN: 4 },
  c008: { price: 2680, originalPrice: 3480, totalLessons: 36, durationKey: 'months', durationN: 3 },
  c009: { price: 1280, originalPrice: 1680, totalLessons: 24, durationKey: 'weeks',  durationN: 6 },
  c010: { price: 2980, originalPrice: 3980, totalLessons: 48, durationKey: 'months', durationN: 3 },
}

const course = computed(() => {
  const c = rawCourse.value
  const raw = PRICE_MAP[courseId.value] ?? { price: 1999, originalPrice: 2599, totalLessons: 36, durationKey: 'months', durationN: 3 }
  const extra = {
    price: raw.price,
    originalPrice: raw.originalPrice,
    totalLessons: raw.totalLessons,
    duration: t(`courseDetail.duration_${raw.durationKey}`, { n: raw.durationN }),
  }
  return {
    id: c?.id ?? courseId.value,
    title: c?.title ?? t('courseDetail.defaultCourseName'),
    level: c?.level ?? null,
    schedule: c?.schedule ?? null,
    teacher: c?.teacher ?? null,
    language: c?.language ?? '英语',
    coverUrl: c?.coverUrl ?? null,
    ...extra,
  }
})

const COVER_GRADIENTS: Record<string, string> = {
  英语: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
  俄语: 'linear-gradient(135deg, #991b1b 0%, #ef4444 100%)',
  法语: 'linear-gradient(135deg, #5b21b6 0%, #8b5cf6 100%)',
  日语: 'linear-gradient(135deg, #c2410c 0%, #f97316 100%)',
  德语: 'linear-gradient(135deg, #92400e 0%, #f59e0b 100%)',
  西班牙语: 'linear-gradient(135deg, #9f1239 0%, #f43f5e 100%)',
  韩语: 'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 100%)',
}

const LANGUAGE_EMOJIS: Record<string, string> = {
  英语: '🇬🇧', 俄语: '🇷🇺', 法语: '🇫🇷', 日语: '🇯🇵',
  德语: '🇩🇪', 西班牙语: '🇪🇸', 韩语: '🇰🇷',
}

const coverGradient = computed(() => COVER_GRADIENTS[course.value.language] ?? 'linear-gradient(135deg, #335ea1 0%, #4f7fd4 100%)')
const languageEmoji = computed(() => LANGUAGE_EMOJIS[course.value.language] ?? '🌐')

const LANG_BADGE: Record<string, string> = {
  英语: 'bg-blue-100/90 text-blue-700',
  俄语: 'bg-red-100/90 text-red-700',
  法语: 'bg-purple-100/90 text-purple-700',
  日语: 'bg-orange-100/90 text-orange-700',
  德语: 'bg-yellow-100/90 text-yellow-800',
  西班牙语: 'bg-rose-100/90 text-rose-700',
  韩语: 'bg-pink-100/90 text-pink-700',
}
const languageBadgeClass = computed(() => LANG_BADGE[course.value.language] ?? 'bg-slate-100/90 text-slate-600')

const LEVEL_BADGE: Record<string, string> = {
  A1: 'bg-green-100 text-green-700',
  A2: 'bg-green-100 text-green-700',
  B1: 'bg-yellow-100 text-yellow-700',
  B2: 'bg-orange-100 text-orange-700',
  C1: 'bg-red-100 text-red-700',
  C2: 'bg-red-100 text-red-700',
}
const levelBadgeClass = computed(() => {
  const l = course.value.level
  return l ? (LEVEL_BADGE[l] ?? 'bg-slate-100 text-slate-600') : 'bg-slate-100 text-slate-500'
})

// 将原本写死的数组转换为使用 Computed 的动态翻译数组
const targetAudience = computed(() => [
  t('courseDetail.audience1', { level: course.value.level ?? 'A1' }),
  t('courseDetail.audience2'),
  t('courseDetail.audience3'),
])

const syllabus = computed(() => [
  { title: t('courseDetail.s1Title'), desc: t('courseDetail.s1Desc'), hours: 6 },
  { title: t('courseDetail.s2Title'), desc: t('courseDetail.s2Desc'), hours: 12 },
  { title: t('courseDetail.s3Title'), desc: t('courseDetail.s3Desc'), hours: 8 },
  { title: t('courseDetail.s4Title'), desc: t('courseDetail.s4Desc'), hours: 10 },
  { title: t('courseDetail.s5Title'), desc: t('courseDetail.s5Desc'), hours: 4 },
])

const toastVisible = ref(false)
const toastMsg = ref('')

function showToast(msg: string) {
  toastMsg.value = msg
  toastVisible.value = true
  setTimeout(() => { toastVisible.value = false }, 3000)
}

function handleEnroll() {
  showToast(t('courseDetail.enrollSuccess'))
}

function handleConsult() {
  showToast(t('courseDetail.consultSuccess'))
}

// ── 视频课程 & 进度同步 ──────────────────────────────────────

interface Lesson {
  id: string
  episode: number
  title: string
  duration: string
  durationSeconds: number
}

const lessons = computed<Lesson[]>(() => [
  { id: 'L01', episode: 1, title: t('courseDetail.lesson1Title'), duration: '18:32', durationSeconds: 1112 },
  { id: 'L02', episode: 2, title: t('courseDetail.lesson2Title'), duration: '22:15', durationSeconds: 1335 },
  { id: 'L03', episode: 3, title: t('courseDetail.lesson3Title'), duration: '25:08', durationSeconds: 1508 },
  { id: 'L04', episode: 4, title: t('courseDetail.lesson4Title'), duration: '20:47', durationSeconds: 1247 },
  { id: 'L05', episode: 5, title: t('courseDetail.lesson5Title'), duration: '28:10', durationSeconds: 1690 },
])

const selectedLessonId = ref<string | null>(null)
const selectedLesson = computed(() => lessons.value.find((l) => l.id === selectedLessonId.value) ?? null)
const lessonProgress = ref(new Map<string, number>())

async function simulateProgress(lessonId: string) {
  const lesson = lessons.value.find((l) => l.id === lessonId)
  if (!lesson) return

  try {
    const targetTime = Math.round(lesson.durationSeconds * 0.95)
    const result = await reportProgress(courseId.value, {
      currentTime: targetTime,
      duration: lesson.durationSeconds,
    })

    if (result.recorded) {
      lessonProgress.value.set(lessonId, 95)
    }
  } catch {
    // 即便后端不可用，前端 UI 仍然展示进度变化（降级）
    lessonProgress.value.set(lessonId, 95)
  }
}
</script>

<style scoped>
.enroll-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  border-radius: 0.875rem;
  font-size: 1rem;
  font-weight: 800;
  color: white;
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, #335ea1 0%, #4f7fd4 100%);
  box-shadow: 0 6px 20px rgba(51, 94, 161, 0.35);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.enroll-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(51, 94, 161, 0.45);
}
.enroll-btn:active {
  transform: translateY(0);
}
.consult-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.875rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: #3b82f6;
  background: transparent;
  border: 2px solid #3b82f6;
  cursor: pointer;
  transition: all 0.2s ease;
}
.consult-btn:hover {
  background: #eff6ff;
}
.syllabus-item {
  padding: 0.875rem 1rem;
  border-radius: 0.875rem;
  background: #f8fafc;
  border: 1px solid rgba(171, 179, 183, 0.12);
  transition: background 0.15s ease;
}
.syllabus-item:hover {
  background: #eff6ff;
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(16px);
}
</style>