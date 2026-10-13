<template>
  <main class="min-h-screen" style="background: #f5f7fa;">
    <div class="max-w-6xl mx-auto px-6 py-10">
      <div v-if="loading" class="flex min-h-[55vh] flex-col items-center justify-center gap-3 text-on-surface-variant" aria-live="polite">
        <span class="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
        <p class="text-sm font-bold">{{ $t('courseDetail.loading') }}</p>
      </div>
      <div v-else-if="loadError" class="flex min-h-[55vh] flex-col items-center justify-center gap-4 text-center" role="alert">
        <span class="material-symbols-outlined text-6xl text-slate-300">menu_book</span>
        <h1 class="text-2xl font-black text-on-surface">{{ $t('courseDetail.unavailableTitle') }}</h1>
        <p class="max-w-md text-sm text-on-surface-variant">{{ loadError }}</p>
        <div class="flex gap-3">
          <button type="button" class="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white" @click="loadCourse">{{ $t('courseDetail.reload') }}</button>
          <router-link to="/courses" class="rounded-xl border border-outline-variant px-5 py-2.5 text-sm font-bold text-on-surface">{{ $t('courseDetail.backToCourses') }}</router-link>
        </div>
      </div>
      <template v-else>

      <nav class="flex items-center gap-2 text-sm text-on-surface-variant mb-8 font-body" :aria-label="$t('courseDetail.breadcrumbAria')">
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
              <p class="text-white/80 text-lg font-bold font-headline">{{ displayLanguage }} · {{ course.level ?? $t('courseDetail.levelPending') }}</p>
            </div>

            <div class="absolute top-4 left-4 flex items-center gap-2">
              <span
                class="px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm shadow-sm"
                :class="languageBadgeClass"
              >{{ displayLanguage }}</span>
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
                <span>{{ displayLanguage }}</span>
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
              <p v-if="course.description">{{ course.description }}</p>
              <template v-else>
                <p>{{ $t('courseDetail.introP1', { lang: displayLanguage }) }}</p>
                <p>{{ $t('courseDetail.introP2') }}</p>
              </template>
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
            <div v-if="outlineLoading" class="rounded-xl bg-slate-50 p-5 text-center text-sm text-on-surface-variant">
              {{ $t('courseDetail.outlineLoading') }}
            </div>
            <div v-else-if="syllabus.length" class="space-y-3">
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
                  <span class="text-xs text-on-surface-variant shrink-0 font-body">{{ outlineMetricsText(unit) }}</span>
                </div>
              </div>
            </div>
            <div v-else class="rounded-xl border border-dashed border-outline-variant/30 bg-slate-50 p-6 text-center text-sm text-on-surface-variant">
              {{ $t('courseDetail.outlineEmpty') }}
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
              <iframe
                v-if="selectedLessonEmbedUrl"
                class="aspect-video w-full"
                :src="selectedLessonEmbedUrl"
                :title="selectedLesson.title"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen
              ></iframe>
              <video
                v-else-if="selectedLessonDirectVideoUrl"
                class="aspect-video w-full bg-black"
                :src="selectedLessonDirectVideoUrl"
                controls
                preload="metadata"
              ></video>
              <div v-else class="aspect-video flex flex-col items-center justify-center gap-3 px-6 text-center text-white/90">
                <span class="material-symbols-outlined text-5xl">{{ selectedLesson.contentUrl ? 'link' : 'video_off' }}</span>
                <p class="font-bold text-lg">{{ selectedLesson.title }}</p>
                <p class="text-sm text-white/50">{{ $t('courseDetail.episodeInfo', { episode: selectedLesson.episode, duration: selectedLesson.duration }) }}</p>
                <p v-if="selectedLesson.summary" class="max-w-xl px-6 text-center text-sm leading-6 text-white/60">{{ selectedLesson.summary }}</p>
                <a
                  v-if="selectedLessonResourceUrl"
                  :href="selectedLessonResourceUrl"
                  target="_blank"
                  rel="noreferrer"
                  class="mt-2 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary/90"
                >{{ $t('courseDetail.openResource') }}</a>
                <template v-else>
                  <p class="mt-2 text-sm font-bold text-amber-300">{{ $t('courseDetail.resourcePending') }}</p>
                  <p class="max-w-lg text-xs leading-5 text-white/45">{{ $t('courseDetail.resourcePendingHint') }}</p>
                  <router-link v-if="enrollment?.status === 'APPROVED'" :to="`/learn/${courseId}`" class="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary/90">{{ $t('courseDetail.startLearning') }}</router-link>
                </template>
              </div>
            </div>

            <!-- 无选中课程时的占位 -->
            <div
              v-else-if="lessons.length === 0"
              class="mb-5 rounded-xl border-2 border-dashed border-outline-variant/20 flex flex-col items-center justify-center py-14 px-6 text-center text-on-surface-variant bg-slate-50/50"
            >
              <span class="material-symbols-outlined text-4xl mb-2">folder_off</span>
              <p class="text-sm font-bold">{{ $t('courseDetail.noLearningResources') }}</p>
            </div>

            <!-- 有资源但尚未选择时的占位 -->
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
                  class="material-symbols-outlined text-xl shrink-0 text-primary/60"
                >
                  play_circle
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-on-surface">
                    {{ $t('courseDetail.lessonLabel', { episode: lesson.episode, title: lesson.title }) }}
                  </p>
                  <p class="text-xs text-on-surface-variant">{{ lesson.chapterTitle }} · {{ lesson.duration }}</p>
                  <p class="mt-1 text-[11px] font-bold" :class="lesson.contentUrl ? 'text-emerald-600' : 'text-amber-600'">
                    {{ lesson.contentUrl ? $t('courseDetail.resourceConfigured') : $t('courseDetail.resourcePendingShort') }}
                  </p>
                </div>
                <span class="material-symbols-outlined text-slate-300">chevron_right</span>
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
                :disabled="enrollmentSubmitting || enrollment?.status === 'PENDING'"
                @click="handleEnroll"
              >
                <span class="material-symbols-outlined text-xl" aria-hidden="true">{{ enrollment?.status === 'APPROVED' ? 'school' : 'how_to_reg' }}</span>
                {{ enrollmentButtonText }}
              </button>
              <div
                v-if="enrollment"
                class="rounded-xl border px-3 py-2.5 text-xs leading-5"
                :class="enrollmentStatusClass"
                role="status"
              >
                <p class="font-bold">{{ enrollmentStatusText }}</p>
                <p v-if="enrollment.adminNote" class="mt-1">{{ $t('courseDetail.reviewNote') }}：{{ enrollment.adminNote }}</p>
                <router-link to="/dashboard#enrollments" class="mt-1 inline-block font-bold underline">{{ $t('courseDetail.viewApplication') }}</router-link>
              </div>
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
                <p class="text-xs text-on-surface-variant mt-0.5">{{ $t('courseDetail.seniorTeacher', { lang: displayLanguage }) }}</p>
                <div class="flex items-center gap-1 mt-1">
                  <span v-for="i in 5" :key="i" class="material-symbols-outlined text-yellow-400 text-sm" style="font-variation-settings:'FILL' 1;">star</span>
                  <span class="text-xs text-on-surface-variant ml-1">{{ $t('courseDetail.score') }}</span>
                  </div>
              </div>
            </div>
          </div>

        </aside>
      </div>
      </template>
    </div>

    <div
      v-if="enrollmentModalOpen"
      class="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 px-4"
      role="dialog"
      aria-modal="true"
      :aria-label="$t('courseDetail.enrollmentDialogAria')"
      @click.self="enrollmentModalOpen = false"
    >
      <form class="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" @submit.prevent="confirmEnrollment">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-bold text-primary">{{ $t('courseDetail.enrollmentDialogTitle') }}</p>
            <h2 class="mt-1 text-xl font-black text-on-surface">{{ course.title }}</h2>
          </div>
          <button type="button" class="text-slate-400 hover:text-slate-700" :aria-label="$t('courseDetail.closeEnrollment')" @click="enrollmentModalOpen = false">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <p class="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-700">
          {{ $t('courseDetail.enrollmentExplanation') }}
        </p>
        <label class="mt-5 block text-sm font-bold text-on-surface">
          {{ $t('courseDetail.enrollmentNote') }}
          <textarea v-model.trim="enrollmentNote" maxlength="500" rows="4" class="mt-2 w-full resize-none rounded-xl border border-outline-variant/40 p-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" :placeholder="$t('courseDetail.enrollmentNotePlaceholder')" />
        </label>
        <p v-if="enrollmentError" class="mt-3 text-sm font-bold text-red-600" role="alert">{{ enrollmentError }}</p>
        <div class="mt-6 flex gap-3">
          <button type="submit" :disabled="enrollmentSubmitting" class="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-black text-white disabled:opacity-50">
            {{ enrollmentSubmitting ? $t('courseDetail.submitting') : $t('courseDetail.confirmEnrollment') }}
          </button>
          <button type="button" class="rounded-xl border border-outline-variant px-4 py-3 text-sm font-bold" @click="enrollmentModalOpen = false">{{ $t('courseDetail.cancel') }}</button>
        </div>
      </form>
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
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getGatewayCourse, type GatewayCourse } from '@/api/gateway'
import { getPublicCourseOutline, type PublicCourseOutline } from '@/api/learning'
import { useStudentAuth } from '@/composables/useStudentAuth'
import {
  getEnrollments,
  submitEnrollment,
  type EnrollmentApplication,
} from '@/api/studentFeatures'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const { isLoggedIn } = useStudentAuth()
const courseId = computed(() => String(route.params.id ?? ''))

const rawCourse = ref<GatewayCourse | null>(null)
const outline = ref<PublicCourseOutline | null>(null)
const outlineLoading = ref(true)
const loading = ref(true)
const loadError = ref('')
const enrollment = ref<EnrollmentApplication | null>(null)
const enrollmentModalOpen = ref(false)
const enrollmentSubmitting = ref(false)
const enrollmentNote = ref('')
const enrollmentError = ref('')
const selectedLessonId = ref<string | null>(null)

async function loadCourse() {
  loading.value = true
  loadError.value = ''
  try {
    rawCourse.value = await getGatewayCourse(courseId.value, locale.value)
  } catch (error) {
    rawCourse.value = null
    loadError.value = error instanceof Error ? error.message : t('courseDetail.notFoundError')
  } finally {
    loading.value = false
  }
}

async function loadEnrollment() {
  if (!isLoggedIn.value) return
  try {
    enrollment.value = (await getEnrollments(locale.value)).find((item) => item.courseId === courseId.value) ?? null
  } catch {
    enrollment.value = null
  }
}

async function loadOutline() {
  outlineLoading.value = true
  try {
    outline.value = await getPublicCourseOutline(courseId.value, locale.value)
    const availableLessonIds = outline.value.chapters.flatMap((chapter) => chapter.lessons.map((lesson) => lesson.id))
    if (!selectedLessonId.value || !availableLessonIds.includes(selectedLessonId.value)) {
      selectedLessonId.value = availableLessonIds[0] ?? null
    }
  } catch {
    outline.value = null
  } finally {
    outlineLoading.value = false
  }
}

onMounted(() => {
  void Promise.allSettled([loadCourse(), loadEnrollment(), loadOutline()])
})

watch(locale, () => {
  void Promise.allSettled([loadCourse(), loadEnrollment(), loadOutline()])
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
    totalLessons: outline.value?.summary.lessonCount || raw.totalLessons,
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
    description: c?.description ?? null,
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
const displayLanguage = computed(() => ({
  英语: t('courseList.langEn'),
  俄语: t('courseList.langRu'),
  法语: t('courseList.langFr'),
  日语: t('courseList.langJa'),
  德语: t('courseList.langDe'),
  西班牙语: t('courseList.langEs'),
  韩语: t('courseList.langKo'),
}[course.value.language] ?? course.value.language))

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

const syllabus = computed(() => (outline.value?.chapters ?? []).map((chapter) => ({
  title: chapter.title,
  desc: chapter.description || t('courseDetail.chapterDescriptionFallback'),
  lessons: chapter.lessons.length,
  assignments: chapter.assignments.length,
  quizzes: chapter.quizzes.length,
})))

function russianCount(count: number, one: string, few: string, many: string) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return `${count} ${one}`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} ${few}`
  return `${count} ${many}`
}

function outlineMetricsText(unit: { lessons: number; assignments: number; quizzes: number }) {
  const current = String(locale.value)
  if (current.startsWith('en')) {
    return [
      `${unit.lessons} ${unit.lessons === 1 ? 'lesson' : 'lessons'}`,
      `${unit.assignments} ${unit.assignments === 1 ? 'assignment' : 'assignments'}`,
      `${unit.quizzes} ${unit.quizzes === 1 ? 'quiz' : 'quizzes'}`,
    ].join(' · ')
  }
  if (current.startsWith('ru')) {
    return [
      russianCount(unit.lessons, 'урок', 'урока', 'уроков'),
      russianCount(unit.assignments, 'задание', 'задания', 'заданий'),
      russianCount(unit.quizzes, 'тест', 'теста', 'тестов'),
    ].join(' · ')
  }
  return t('courseDetail.outlineMetrics', unit)
}

const toastVisible = ref(false)
const toastMsg = ref('')

function showToast(msg: string) {
  toastMsg.value = msg
  toastVisible.value = true
  setTimeout(() => { toastVisible.value = false }, 3000)
}

const enrollmentButtonText = computed(() => {
  if (enrollmentSubmitting.value) return t('courseDetail.submitting')
  if (enrollment.value?.status === 'PENDING') return t('courseDetail.enrollmentPending')
  if (enrollment.value?.status === 'APPROVED') return t('courseDetail.startLearning')
  if (enrollment.value?.status === 'REJECTED' || enrollment.value?.status === 'CANCELLED') return t('courseDetail.resubmitEnrollment')
  return t('courseDetail.enrollBtn')
})

const enrollmentStatusText = computed(() => ({
  PENDING: t('courseDetail.statusPending'),
  APPROVED: t('courseDetail.statusApproved'),
  REJECTED: t('courseDetail.statusRejected'),
  CANCELLED: t('courseDetail.statusCancelled'),
}[enrollment.value?.status ?? 'PENDING']))

const enrollmentStatusClass = computed(() => ({
  PENDING: 'border-amber-200 bg-amber-50 text-amber-800',
  APPROVED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  REJECTED: 'border-rose-200 bg-rose-50 text-rose-800',
  CANCELLED: 'border-slate-200 bg-slate-50 text-slate-600',
}[enrollment.value?.status ?? 'PENDING']))

function handleEnroll() {
  if (!isLoggedIn.value) {
    void router.push({ path: '/auth', query: { redirect: route.fullPath } })
    return
  }
  if (enrollment.value?.status === 'APPROVED') {
    void router.push(`/learn/${courseId.value}`)
    return
  }
  if (enrollment.value?.status === 'PENDING') return
  enrollmentError.value = ''
  enrollmentNote.value = enrollment.value?.studentNote ?? ''
  enrollmentModalOpen.value = true
}

async function confirmEnrollment() {
  if (enrollmentSubmitting.value) return
  enrollmentSubmitting.value = true
  enrollmentError.value = ''
  try {
    enrollment.value = await submitEnrollment(courseId.value, enrollmentNote.value || undefined)
    enrollmentModalOpen.value = false
    showToast(t('courseDetail.enrollSuccess'))
  } catch (error) {
    enrollmentError.value = error instanceof Error ? error.message : t('courseDetail.enrollmentSubmitError')
  } finally {
    enrollmentSubmitting.value = false
  }
}

function handleConsult() {
  window.dispatchEvent(new CustomEvent('open-openedu-chatbot', {
    detail: { prompt: t('courseDetail.consultPrompt', { title: course.value.title }) },
  }))
  showToast(t('courseDetail.consultSuccess'))
}

// ── 视频课程 & 进度同步 ──────────────────────────────────────

interface Lesson {
  id: string
  episode: number
  title: string
  duration: string
  summary: string | null
  chapterTitle: string
  contentUrl: string | null
}

const lessons = computed<Lesson[]>(() => {
  let episode = 0
  return (outline.value?.chapters ?? []).flatMap((chapter) => chapter.lessons.map((lesson) => ({
    id: lesson.id,
    episode: ++episode,
    title: lesson.title,
    duration: t('courseDetail.minutesCount', { count: lesson.durationMinutes }),
    summary: lesson.summary,
    chapterTitle: chapter.title,
    contentUrl: lesson.contentUrl,
  })))
})

const selectedLesson = computed(() => lessons.value.find((l) => l.id === selectedLessonId.value) ?? null)

function normalizeLessonResourceUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value
  if (value.startsWith('/')) return value
  if (/^BV[\w]+$/i.test(value)) return `https://www.bilibili.com/video/${value}`
  return `https://www.youtube.com/watch?v=${encodeURIComponent(value)}`
}

function lessonEmbedUrl(value: string) {
  const normalized = normalizeLessonResourceUrl(value)
  const youtube = normalized.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/i)
  if (youtube?.[1]) return `https://www.youtube.com/embed/${youtube[1]}`
  const bilibili = normalized.match(/(?:video\/|bvid=)(BV[\w]+)/i)
  if (bilibili?.[1]) return `https://player.bilibili.com/player.html?bvid=${bilibili[1]}&high_quality=1`
  return null
}

const selectedLessonResourceUrl = computed(() => selectedLesson.value?.contentUrl
  ? normalizeLessonResourceUrl(selectedLesson.value.contentUrl)
  : null)
const selectedLessonEmbedUrl = computed(() => selectedLesson.value?.contentUrl
  ? lessonEmbedUrl(selectedLesson.value.contentUrl)
  : null)
const selectedLessonDirectVideoUrl = computed(() => {
  const url = selectedLessonResourceUrl.value
  return url && /\.(mp4|webm|ogg)(?:[?#].*)?$/i.test(url) ? url : null
})
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
.enroll-btn:disabled {
  cursor: not-allowed;
  transform: none;
  background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
  box-shadow: none;
  opacity: 0.82;
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
