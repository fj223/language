<template>
  <main class="pt-16 max-w-screen-2xl mx-auto flex">
    <!-- Filter Sidebar -->
    <aside class="h-screen w-80 sticky top-16 bg-slate-50 dark:bg-slate-950 flex flex-col p-6 space-y-8 overflow-y-auto font-body text-sm">
      <div>
        <div class="flex justify-between items-center mb-1">
          <h2 class="text-lg font-bold text-on-surface">Filters</h2>
          <button
            class="text-primary font-medium hover:underline text-xs disabled:opacity-40"
            type="button"
            :disabled="loading"
            @click="resetAll"
          >
            Reset All
          </button>
        </div>
        <p class="text-on-surface-variant text-xs mb-6">Refine your search</p>
      </div>

      <!-- Search -->
      <section>
        <div class="mb-3">
          <span class="uppercase tracking-wider text-[11px] font-bold text-primary">Search</span>
        </div>
        <input
          v-model="searchInput"
          class="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 ring-primary/20 outline-none"
          placeholder="搜索课程标题..."
          type="text"
          :disabled="loading"
        />
      </section>

      <!-- Source filter -->
      <section>
        <div class="mb-4">
          <span class="uppercase tracking-wider text-[11px] font-bold text-primary">Source</span>
        </div>
        <div class="space-y-3">
          <label
            v-for="opt in SOURCE_OPTIONS"
            :key="opt.value"
            class="flex items-center gap-3 cursor-pointer group"
            :class="loading ? 'opacity-50 pointer-events-none' : ''"
          >
            <input
              class="rounded border-outline-variant text-primary focus:ring-primary/20 w-4 h-4"
              type="checkbox"
              :value="opt.value"
              :checked="selectedType === opt.value"
              @change="onSourceChange(opt.value)"
            />
            <span class="text-on-surface-variant group-hover:text-primary transition-colors">{{ opt.label }}</span>
          </label>
        </div>
      </section>

      <div class="mt-auto pt-8">
        <a class="flex items-center gap-3 p-3 text-slate-600 hover:bg-slate-200/50 rounded-lg transition-all" href="#">
          <span class="material-symbols-outlined">help_outline</span>
          <span>Help Center</span>
        </a>
      </div>
    </aside>

    <!-- Main Content -->
    <section class="flex-1 p-10 bg-surface">
      <!-- Header -->
      <div class="flex justify-between items-end mb-10">
        <div>
          <h1 class="text-3xl font-extrabold text-on-surface mb-2 tracking-tight font-headline">Search Results</h1>
          <p class="text-on-surface-variant font-body">
            共 <span class="font-bold text-primary">{{ total }}</span> 门课程
          </p>
        </div>
      </div>

      <!-- Error state -->
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm flex items-center justify-between mb-6">
        <span>{{ error }}</span>
        <button class="underline text-xs ml-4" type="button" @click="loadCourses">重试</button>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="space-y-4">
        <div v-for="n in 3" :key="n" class="bg-surface-container-lowest rounded-xl h-32 animate-pulse" />
      </div>

      <!-- Empty state -->
      <div
        v-else-if="!error && courses.length === 0"
        class="flex flex-col items-center justify-center py-24 text-on-surface-variant gap-4"
      >
        <span class="material-symbols-outlined text-5xl opacity-30">search_off</span>
        <p class="text-base font-medium">暂无符合条件的课程</p>
        <p class="text-sm opacity-60">尝试修改筛选条件或清空搜索关键词</p>
        <button class="mt-2 text-primary text-sm underline" type="button" @click="resetAll">清空所有筛选</button>
      </div>

      <!-- Course list -->
      <div v-else class="space-y-6">
        <div
          v-for="course in courses"
          :key="course.id"
          class="bg-surface-container-lowest p-5 rounded-xl flex gap-8 items-center transition-all hover:translate-y-[-2px] hover:shadow-lg group"
        >
          <div class="w-72 shrink-0 aspect-video rounded-lg overflow-hidden">
            <img
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              :src="course.coverUrl || heroImage"
              :alt="course.title"
            />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2 flex-wrap">
              <span
                v-for="t in getCourseResourceTypes(course)"
                :key="t"
                class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                :class="tagClass(t)"
              >
                {{ tagLabel(t) }}
              </span>
            </div>
            <h3 class="text-xl font-bold text-on-surface mb-2 group-hover:text-primary transition-colors truncate font-headline">
              {{ course.title }}
            </h3>
            <p class="text-on-surface-variant text-sm line-clamp-2 mb-4 font-body leading-relaxed">
              {{ course.description || '暂无课程描述' }}
            </p>
          </div>
          <div class="shrink-0 flex flex-col items-end gap-3 px-4">
            <router-link
              :to="`/courses/${course.id}`"
              class="px-6 py-2 rounded-lg border-2 border-primary text-primary font-bold text-sm hover:bg-primary hover:text-white transition-all whitespace-nowrap"
            >
              免费学习
            </router-link>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="mt-16 flex justify-center">
        <nav class="flex items-center gap-1 font-body text-sm font-medium">
          <button
            class="w-8 h-8 flex items-center justify-center rounded hover:bg-primary-container text-on-surface-variant transition-colors disabled:opacity-40"
            type="button"
            :disabled="loading || page <= 1"
            @click="goToPage(page - 1)"
          >
            <span class="material-symbols-outlined text-lg">chevron_left</span>
          </button>

          <template v-for="p in pageNumbers" :key="p">
            <span
              v-if="p === '...'"
              class="w-8 h-8 flex items-center justify-center text-on-surface-variant"
            >…</span>
            <button
              v-else
              class="w-8 h-8 flex items-center justify-center rounded transition-colors"
              :class="p === page ? 'bg-primary text-white' : 'hover:bg-primary-container'"
              type="button"
              :disabled="loading"
              @click="goToPage(p as number)"
            >
              {{ p }}
            </button>
          </template>

          <button
            class="w-8 h-8 flex items-center justify-center rounded hover:bg-primary-container text-on-surface-variant transition-colors disabled:opacity-40"
            type="button"
            :disabled="loading || page >= totalPages"
            @click="goToPage(page + 1)"
          >
            <span class="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </nav>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import heroImage from '@/assets/hero.png'
import { getCourses, type CourseDto, type VideoResourceType } from '@/api/course'
import { resourceLabel, resourceTagClass } from '@/domain/resourceMeta'

const route = useRoute()
const router = useRouter()

const PAGE_SIZE = 20
const DEBOUNCE_MS = 400

const SOURCE_OPTIONS: { label: string; value: VideoResourceType }[] = [
  { label: 'Local', value: 'local' },
  { label: 'YouTube', value: 'youtube' },
  { label: 'Bilibili', value: 'bilibili' },
  { label: 'External Link', value: 'external_link' },
]

// --- State ---
const courses = ref<CourseDto[]>([])
const loading = ref(false)
const error = ref('')
const total = ref(0)
const totalPages = ref(1)

// Initialise from URL query params so refresh restores state
const page = ref(Number(route.query.page) || 1)
const selectedType = ref<VideoResourceType | ''>((route.query.type as VideoResourceType) || '')
const searchInput = ref((route.query.q as string) || '')

// Debounce timer handle
let debounceTimer: ReturnType<typeof setTimeout> | null = null

// --- API ---
async function loadCourses() {
  loading.value = true
  error.value = ''
  try {
    const data = await getCourses({
      page: page.value,
      pageSize: PAGE_SIZE,
      resource_type: selectedType.value || undefined,
      q: searchInput.value.trim() || undefined,
    })
    courses.value = data.items
    total.value = data.pagination.total
    totalPages.value = data.pagination.totalPages
    // Clamp page if server returned a lower totalPages
    if (page.value > data.pagination.totalPages && data.pagination.totalPages > 0) {
      page.value = data.pagination.totalPages
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载课程失败'
  } finally {
    loading.value = false
  }
}

// --- URL sync ---
function syncUrl() {
  const query: Record<string, string> = {}
  if (page.value > 1) query.page = String(page.value)
  if (selectedType.value) query.type = selectedType.value
  if (searchInput.value.trim()) query.q = searchInput.value.trim()
  router.replace({ query })
}

// --- Pagination ---
function goToPage(p: number) {
  if (p < 1 || p > totalPages.value || loading.value) return
  page.value = p
  syncUrl()
  loadCourses()
}

// --- Filters ---
function onSourceChange(value: VideoResourceType) {
  selectedType.value = selectedType.value === value ? '' : value
  page.value = 1
  syncUrl()
  loadCourses()
}

function resetAll() {
  selectedType.value = ''
  searchInput.value = ''
  page.value = 1
  syncUrl()
  loadCourses()
}

// --- Debounced search ---
watch(searchInput, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    page.value = 1
    syncUrl()
    loadCourses()
  }, DEBOUNCE_MS)
})

// --- Pagination display ---
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

// --- Helpers ---
function getCourseResourceTypes(course: CourseDto) {
  const set = new Set<VideoResourceType>()
  for (const r of course.resources) set.add(r.resource_type)
  return Array.from(set)
}

function tagLabel(t: VideoResourceType) { return resourceLabel(t) }
function tagClass(t: VideoResourceType) { return resourceTagClass(t) }

onMounted(loadCourses)
</script>
