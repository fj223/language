<template>
  <main class="min-h-screen" style="background: #f5f7fa;">
    <div class="max-w-screen-xl mx-auto px-6 py-12">

      <div class="mb-10 text-center">
        <h1 class="text-4xl font-extrabold text-on-surface tracking-tight font-headline mb-2">
          {{ $t('courseList.title') }}
        </h1>
        <p class="text-on-surface-variant font-body text-sm">
          {{ $t('courseList.totalPrefix') }} <span class="font-bold text-primary">{{ courses.length }}</span> {{ $t('courseList.totalSuffix') }}
        </p>
      </div>

      <div class="flex justify-center mb-8">
        <nav
          class="inline-flex items-center gap-1 p-1.5 rounded-2xl bg-white shadow-sm border border-outline-variant/20"
          aria-label="语种分类"
          role="tablist"
        >
          <button
            v-for="tab in LANGUAGE_TABS"
            :key="tab.value"
            type="button"
            role="tab"
            :aria-selected="selectedLanguage === tab.value"
            :disabled="loading"
            class="tab-btn"
            :class="selectedLanguage === tab.value ? 'tab-btn-active' : 'tab-btn-inactive'"
            @click="onLanguageChange(tab.value)"
          >
            <span v-if="tab.emoji" class="text-base leading-none" aria-hidden="true">{{ tab.emoji }}</span>
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <div class="mb-10 flex items-center justify-center gap-3">
        <div class="relative w-full max-w-lg">
          <span
            class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl pointer-events-none"
            aria-hidden="true"
          >search</span>
          <input
            v-model="searchInput"
            type="text"
            :placeholder="$t('courseList.searchPlaceholder')"
            class="w-full pl-12 pr-4 py-3 rounded-2xl border border-outline-variant/30 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all font-body shadow-sm"
            :disabled="loading"
            aria-label="搜索课程"
          />
        </div>
        <button
          v-if="selectedLanguage || searchInput"
          type="button"
          class="text-xs text-on-surface-variant hover:text-primary underline transition-colors whitespace-nowrap"
          :disabled="loading"
          @click="resetAll"
        >
          {{ $t('courseList.clearFilter') }}
        </button>
      </div>

      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div
          v-for="n in 8"
          :key="n"
          class="bg-white rounded-3xl overflow-hidden shadow-sm animate-pulse"
          aria-hidden="true"
        >
          <div class="aspect-video bg-slate-200" />
          <div class="p-5 space-y-3">
            <div class="h-3 bg-slate-200 rounded-full w-1/3" />
            <div class="h-5 bg-slate-200 rounded-full w-4/5" />
            <div class="h-3 bg-slate-200 rounded-full w-2/3" />
            <div class="h-3 bg-slate-200 rounded-full w-1/2" />
            <div class="h-9 bg-slate-100 rounded-xl mt-2" />
          </div>
        </div>
      </div>

      <div
        v-else-if="error"
        class="flex flex-col items-center justify-center py-24 gap-4 text-center"
        role="alert"
      >
        <div class="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <span class="material-symbols-outlined text-4xl text-error opacity-70">error_outline</span>
        </div>
        <p class="text-base font-medium text-on-surface">{{ error }}</p>
        <button
          type="button"
          class="mt-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          @click="loadCourses"
        >
          {{ $t('courseList.retry') }}
        </button>
      </div>

      <div
        v-else-if="courses.length === 0"
        class="flex flex-col items-center justify-center py-24 gap-4 text-center text-on-surface-variant"
      >
        <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
          <span class="material-symbols-outlined text-4xl opacity-40">search_off</span>
        </div>
        <p class="text-base font-medium text-on-surface">{{ $t('courseList.emptyTitle') }}</p>
        <p class="text-sm opacity-60">{{ $t('courseList.emptyDesc') }}</p>
        <button
          type="button"
          class="mt-2 text-primary text-sm font-semibold underline"
          @click="resetAll"
        >
          {{ $t('courseList.clearAllFilters') }}
        </button>
      </div>

      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <article
          v-for="course in pagedCourses"
          :key="course.id"
          class="course-card bg-white flex flex-col group cursor-pointer"
          @click="router.push(`/courses/${course.id}`)"
        >
          <div class="aspect-video overflow-hidden bg-slate-100 relative rounded-t-3xl">
            <img
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              :src="course.coverUrl || defaultCover"
              :alt="course.title"
              loading="lazy"
            />
            <span
              class="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-sm"
              :class="languageBadgeClass(course.language)"
            >
              {{ getLangLabel(course.language) }}
            </span>
          </div>

          <div class="p-5 flex flex-col flex-1 gap-3">

            <div class="flex items-center gap-2">
              <span
                class="level-badge"
                :class="levelBadgeClass(course.level)"
              >
                {{ course.level ?? $t('courseList.levelPending') }}
              </span>
            </div>

            <h3 class="text-base font-bold text-on-surface leading-snug group-hover:text-primary transition-colors font-headline line-clamp-2">
              {{ course.title }}
            </h3>

            <dl class="space-y-1.5 text-sm text-on-surface-variant font-body mt-auto">
              <div class="flex items-start gap-2">
                <span class="material-symbols-outlined text-base shrink-0 mt-0.5 text-primary/60" aria-hidden="true">schedule</span>
                <dd>{{ course.schedule ?? $t('courseList.timePending') }}</dd>
              </div>
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-base shrink-0 text-primary/60" aria-hidden="true">person</span>
                <dd>{{ course.teacher ?? $t('courseList.teacherPending') }}</dd>
              </div>
            </dl>

            <button
              type="button"
              class="mt-3 w-full py-2.5 rounded-xl border-2 border-primary text-primary text-sm font-bold hover:bg-primary hover:text-white transition-all duration-200 group-hover:bg-primary group-hover:text-white"
              @click.stop="router.push(`/courses/${course.id}`)"
            >
              {{ $t('courseList.viewDetails') }}
            </button>
          </div>
        </article>
      </div>

      <div v-if="totalPages > 1" class="mt-14 flex justify-center">
        <nav class="flex items-center gap-1 font-body text-sm font-medium" aria-label="分页导航">
          <button
            type="button"
            class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm text-on-surface-variant transition-all disabled:opacity-40"
            :disabled="loading || page <= 1"
            :aria-label="$t('courseList.prevPage')"
            @click="goToPage(page - 1)"
          >
            <span class="material-symbols-outlined text-lg">chevron_left</span>
          </button>

          <template v-for="p in pageNumbers" :key="p">
            <span
              v-if="p === '...'"
              class="w-10 h-10 flex items-center justify-center text-on-surface-variant"
              aria-hidden="true"
            >…</span>
            <button
              v-else
              type="button"
              class="w-10 h-10 flex items-center justify-center rounded-xl transition-all"
              :class="p === page
                ? 'bg-primary text-white shadow-sm shadow-primary/30'
                : 'hover:bg-white hover:shadow-sm text-on-surface-variant'"
              :aria-current="p === page ? 'page' : undefined"
              :disabled="loading"
              @click="goToPage(p as number)"
            >
              {{ p }}
            </button>
          </template>

          <button
            type="button"
            class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm text-on-surface-variant transition-all disabled:opacity-40"
            :disabled="loading || page >= totalPages"
            :aria-label="$t('courseList.nextPage')"
            @click="goToPage(page + 1)"
          >
            <span class="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </nav>
      </div>

    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getGatewayCourses, type GatewayCourse } from '@/api/gateway'
import defaultCover from '@/assets/hero.png'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const PAGE_SIZE = 12
const DEBOUNCE_MS = 400

const LANGUAGE_TABS = computed(() => [
  { label: t('courseList.langAll'), value: '', emoji: '' },
  { label: t('courseList.langEn'), value: '英语', emoji: '🇬🇧' },
  { label: t('courseList.langRu'), value: '俄语', emoji: '🇷🇺' },
  { label: t('courseList.langFr'), value: '法语', emoji: '🇫🇷' },
  { label: t('courseList.langJa'), value: '日语', emoji: '🇯🇵' },
  { label: t('courseList.langDe'), value: '德语', emoji: '🇩🇪' },
  { label: t('courseList.langEs'), value: '西班牙语', emoji: '🇪🇸' },
  { label: t('courseList.langKo'), value: '韩语', emoji: '🇰🇷' },
])

// ===== 状态 =====
const courses = ref<GatewayCourse[]>([])
const loading = ref(false)
const error = ref('')

const page = ref(Number(route.query.page) || 1)
const selectedLanguage = ref<string>((route.query.language as string) || '')
const searchInput = ref((route.query.q as string) || '')

let debounceTimer: ReturnType<typeof setTimeout> | null = null

// ===== API =====
async function loadCourses() {
  loading.value = true
  error.value = ''
  try {
    courses.value = await getGatewayCourses({
      language: selectedLanguage.value || undefined,
      q: searchInput.value.trim() || undefined,
    })
    if (page.value > totalPages.value && totalPages.value > 0) {
      page.value = totalPages.value
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('courseList.loadError')
  } finally {
    loading.value = false
  }
}

// ===== URL 同步 =====
function syncUrl() {
  const query: Record<string, string> = {}
  if (page.value > 1) query.page = String(page.value)
  if (selectedLanguage.value) query.language = selectedLanguage.value
  if (searchInput.value.trim()) query.q = searchInput.value.trim()
  router.replace({ query })
}

// ===== 分页 =====
function goToPage(p: number) {
  if (p < 1 || p > totalPages.value || loading.value) return
  page.value = p
  syncUrl()
}

// ===== 筛选 =====
function onLanguageChange(lang: string) {
  selectedLanguage.value = lang
  page.value = 1
  syncUrl()
  loadCourses()
}

function resetAll() {
  selectedLanguage.value = ''
  searchInput.value = ''
  page.value = 1
  syncUrl()
  loadCourses()
}

// ===== 防抖搜索 =====
watch(searchInput, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    page.value = 1
    syncUrl()
    loadCourses()
  }, DEBOUNCE_MS)
})

// ===== 计算属性 =====
const totalPages = computed(() => Math.max(1, Math.ceil(courses.value.length / PAGE_SIZE)))

const pagedCourses = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return courses.value.slice(start, start + PAGE_SIZE)
})

const pageNumbers = computed<(number | '...')[]>(() => {
  const total = totalPages.value
  const cur = page.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = [1]
  if (cur > 3) pages.push('...')
  for (let p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) pages.push(p)
  if (cur < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

// ===== 样式辅助 =====
const LANGUAGE_BADGE_CLASSES: Record<string, string> = {
  英语: 'bg-blue-100/90 text-blue-700',
  俄语: 'bg-red-100/90 text-red-700',
  法语: 'bg-purple-100/90 text-purple-700',
  日语: 'bg-orange-100/90 text-orange-700',
  德语: 'bg-yellow-100/90 text-yellow-700',
  西班牙语: 'bg-rose-100/90 text-rose-700',
  韩语: 'bg-pink-100/90 text-pink-700',
}

function languageBadgeClass(lang: string): string {
  return LANGUAGE_BADGE_CLASSES[lang] ?? 'bg-slate-100/90 text-slate-600'
}

// 动态将后端返回的语言字段转为当前环境语言（如果匹配）
function getLangLabel(langValue: string): string {
  const found = LANGUAGE_TABS.value.find(tab => tab.value === langValue)
  return found && found.value !== '' ? found.label : langValue
}

// 级别 Badge：更鲜明的彩色设计
const LEVEL_BADGE_CLASSES: Record<string, string> = {
  A1: 'level-a1',
  A2: 'level-a2',
  B1: 'level-b1',
  B2: 'level-b2',
  C1: 'level-c1',
  C2: 'level-c2',
}

function levelBadgeClass(level: string | null): string {
  if (!level) return 'level-unknown'
  return LEVEL_BADGE_CLASSES[level] ?? 'level-unknown'
}

onMounted(loadCourses)
</script>

<style scoped>
/* ===== 语种 Tab 按钮 ===== */
.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1.125rem;
  border-radius: 0.875rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;
}

.tab-btn-inactive {
  background: transparent;
  color: var(--color-on-surface-variant);
}

.tab-btn-inactive:hover:not(:disabled) {
  background: var(--color-surface-container-low);
  color: var(--color-primary);
}

.tab-btn-active {
  background: linear-gradient(135deg, var(--color-primary) 0%, #4f7fd4 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(51, 94, 161, 0.3);
}

.tab-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ===== 课程卡片 ===== */
.course-card {
  border-radius: 1.5rem;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
}

.course-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 24px rgba(51, 94, 161, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* ===== 级别 Badge ===== */
.level-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.625rem;
  border-radius: 0.375rem;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.level-a1 { background: #dcfce7; color: #15803d; }
.level-a2 { background: #d1fae5; color: #047857; }
.level-b1 { background: #fef9c3; color: #a16207; }
.level-b2 { background: #ffedd5; color: #c2410c; }
.level-c1 { background: #fee2e2; color: #b91c1c; }
.level-c2 { background: #fce7f3; color: #9d174d; }
.level-unknown { background: #f1f5f9; color: #64748b; }
</style>