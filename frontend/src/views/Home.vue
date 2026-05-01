<template>
  <div class="bg-white dark:bg-slate-950">

    <!-- ═══════════════════════════════════════════
         Hero Section
    ═══════════════════════════════════════════ -->
    <section class="relative overflow-hidden bg-gradient-to-br from-[#1a237e] via-[#283593] to-[#1565c0] text-white">
      <!-- 背景装饰圆 -->
      <div class="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
      <div class="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white/5 pointer-events-none" />

      <div class="relative max-w-6xl mx-auto px-6 py-20 flex flex-col lg:flex-row items-center gap-12">
        <!-- 文字区 -->
        <div class="flex-1 text-center lg:text-left">
          <div class="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm text-blue-200 mb-6">
            <span class="material-symbols-outlined text-base">auto_awesome</span>
            AI 驱动的学习平台
          </div>
          <h1 class="text-4xl lg:text-6xl font-black tracking-tight leading-tight mb-5">
            打破教育壁垒，<br />
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">知识连接你我</span>
          </h1>
          <p class="text-blue-100 text-lg leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
            聚合全网优质免费公开课，AI 伴学，随时随地开启学习之旅。
          </p>

          <!-- Hero 搜索框 -->
          <div class="flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-xl max-w-lg mx-auto lg:mx-0">
            <span class="material-symbols-outlined text-slate-400">search</span>
            <input
              v-model="searchInput"
              class="flex-1 bg-transparent text-slate-800 placeholder-slate-400 text-sm outline-none"
              placeholder="搜索"
              type="text"
            />
            <button
              class="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-1.5 rounded-xl transition-colors"
              type="button"
              @click="() => { page = 1; syncUrl(); loadCourses() }"
            >
              搜索
            </button>
          </div>
        </div>

        <!-- 右侧装饰 -->
        <div class="hidden lg:flex flex-col items-center justify-center w-72 h-56 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 shrink-0 gap-3">
          <span class="material-symbols-outlined text-7xl text-white/70" style="font-variation-settings:'FILL' 1;">auto_stories</span>
          <p class="text-white/60 text-sm">探索 · 学习 · 成长</p>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════
         Features — 三大特色
    ═══════════════════════════════════════════ -->
    <section class="max-w-6xl mx-auto px-6 py-16">
      <p class="text-center text-slate-400 text-sm uppercase tracking-widest mb-10">我们为你聚合了...</p>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- 本地精品 -->
        <div class="rounded-2xl border border-slate-100 dark:border-slate-800 p-7 hover:shadow-lg transition-shadow group">
          <div class="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
            <span class="material-symbols-outlined text-blue-600 text-2xl" style="font-variation-settings:'FILL' 1;">auto_stories</span>
          </div>
          <h3 class="font-bold text-slate-800 dark:text-white text-lg mb-2">本地精品</h3>
          <p class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">由 OpenEdu 精心制作的结构化进阶课程，完全免费且无广告。</p>
        </div>
        <!-- YouTube EDU -->
        <div class="rounded-2xl border border-slate-100 dark:border-slate-800 p-7 hover:shadow-lg transition-shadow group">
          <div class="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
            <span class="material-symbols-outlined text-red-500 text-2xl" style="font-variation-settings:'FILL' 1;">language</span>
          </div>
          <h3 class="font-bold text-slate-800 dark:text-white text-lg mb-2">YouTube EDU</h3>
          <p class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">同步全球顶尖学术资源，涵盖科学、工程及人文社科领域。</p>
        </div>
        <!-- MOOC/B站 -->
        <div class="rounded-2xl border border-slate-100 dark:border-slate-800 p-7 hover:shadow-lg transition-shadow group">
          <div class="w-12 h-12 rounded-xl bg-pink-50 dark:bg-pink-900/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
            <span class="material-symbols-outlined text-pink-500 text-2xl" style="font-variation-settings:'FILL' 1;">play_circle</span>
          </div>
          <h3 class="font-bold text-slate-800 dark:text-white text-lg mb-2">MOOC/B站</h3>
          <p class="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">整合国内各大高校与优质创作者资源，打造零门槛学习社区。</p>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════
         课程列表 — 动态数据
    ═══════════════════════════════════════════ -->
    <section class="max-w-6xl mx-auto px-6 pb-16">
      <!-- 区块标题 + 筛选栏 -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 class="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            今日推荐免费资源
          </h2>
          <p class="text-slate-400 text-sm mt-1">
            基于全网学习热度为您实时更新 &nbsp;·&nbsp; 共
            <span class="font-bold text-blue-600">{{ total }}</span> 门课程
          </p>
        </div>

        <!-- 类型筛选 chips -->
        <div class="flex items-center gap-2 flex-wrap">
          <button
            class="px-3 py-1 rounded-full text-xs font-semibold border transition-colors"
            :class="selectedType === '' ? 'bg-blue-700 text-white border-blue-700' : 'border-slate-200 text-slate-500 hover:border-blue-400'"
            type="button"
            @click="() => { selectedType = ''; page = 1; syncUrl(); loadCourses() }"
          >全部</button>
          <button
            v-for="opt in SOURCE_OPTIONS"
            :key="opt.value"
            class="px-3 py-1 rounded-full text-xs font-semibold border transition-colors"
            :class="selectedType === opt.value ? 'bg-blue-700 text-white border-blue-700' : 'border-slate-200 text-slate-500 hover:border-blue-400'"
            type="button"
            @click="onSourceChange(opt.value)"
          >{{ opt.label }}</button>
          <button
            v-if="selectedType || searchInput"
            class="px-3 py-1 rounded-full text-xs font-semibold border border-red-200 text-red-400 hover:bg-red-50 transition-colors"
            type="button"
            @click="resetAll"
          >清空</button>
        </div>
      </div>

      <!-- 错误 -->
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm flex items-center justify-between mb-6">
        <span>{{ error }}</span>
        <button class="underline text-xs ml-4" type="button" @click="loadCourses">重试</button>
      </div>

      <!-- 加载骨架 -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        <div v-for="n in 8" :key="n" class="rounded-2xl bg-slate-100 dark:bg-slate-800 h-64 animate-pulse" />
      </div>

      <!-- 空状态 -->
      <div v-else-if="!error && courses.length === 0" class="flex flex-col items-center justify-center py-24 text-slate-400 gap-4">
        <span class="material-symbols-outlined text-5xl opacity-40">search_off</span>
        <p class="text-base font-medium">暂无符合条件的课程</p>
        <button class="mt-1 text-blue-600 text-sm underline" type="button" @click="resetAll">清空所有筛选</button>
      </div>

      <!-- 课程卡片网格 -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        <div
          v-for="course in courses"
          :key="course.id"
          class="group rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 bg-white dark:bg-slate-900"
        >
          <!-- 封面 -->
          <div class="relative aspect-video overflow-hidden bg-slate-200 dark:bg-slate-700">
            <img
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              :src="course.coverUrl || heroImage"
              :alt="course.title"
            />
            <!-- 类型角标 -->
            <div class="absolute top-2 left-2 flex gap-1 flex-wrap">
              <span
                v-for="t in getCourseTypes(course)"
                :key="t"
                class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm"
                :class="resourceTagClass(t)"
              >{{ resourceLabel(t) }}</span>
            </div>
          </div>

          <!-- 信息 -->
          <div class="p-4">
            <h3 class="font-bold text-slate-800 dark:text-white text-sm leading-snug line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
              {{ course.title }}
            </h3>
            <p class="text-slate-400 text-xs line-clamp-2 mb-4 leading-relaxed">
              {{ course.description || '暂无课程描述' }}
            </p>
            <router-link
              :to="`/courses/${course.id}`"
              class="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-colors"
            >
              <span class="material-symbols-outlined text-sm">play_arrow</span>
              免费学习
            </router-link>
          </div>
        </div>
      </div>

      <!-- 分页器 -->
      <div v-if="totalPages > 1" class="mt-12 flex justify-center">
        <nav class="flex items-center gap-1 text-sm font-medium">
          <button
            class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 disabled:opacity-30 transition-colors"
            type="button"
            :disabled="loading || page <= 1"
            @click="goToPage(page - 1)"
          >
            <span class="material-symbols-outlined text-lg">chevron_left</span>
          </button>
          <template v-for="p in pageNumbers" :key="p">
            <span v-if="p === '...'" class="w-9 h-9 flex items-center justify-center text-slate-400">…</span>
            <button
              v-else
              class="w-9 h-9 flex items-center justify-center rounded-xl transition-colors font-semibold"
              :class="p === page ? 'bg-blue-700 text-white' : 'hover:bg-slate-100 text-slate-600'"
              type="button"
              :disabled="loading"
              @click="goToPage(p as number)"
            >{{ p }}</button>
          </template>
          <button
            class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 disabled:opacity-30 transition-colors"
            type="button"
            :disabled="loading || page >= totalPages"
            @click="goToPage(page + 1)"
          >
            <span class="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </nav>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════
         AI 助教横幅
    ═══════════════════════════════════════════ -->
    <section class="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-16 px-6">
      <div class="max-w-4xl mx-auto flex flex-col lg:flex-row items-center gap-10 text-center lg:text-left">
        <div class="w-20 h-20 rounded-2xl bg-blue-600/30 flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-4xl text-blue-300" style="font-variation-settings:'FILL' 1;">auto_awesome</span>
        </div>
        <div class="flex-1">
          <p class="text-blue-300 text-xs font-bold uppercase tracking-widest mb-2">Powered by AI</p>
          <h2 class="text-2xl font-extrabold mb-3">不仅是课程，更是你的专属 AI 助教。</h2>
          <p class="text-slate-300 text-sm leading-relaxed max-w-xl">
            在学习中遇到难题？随时向 AI 发问。我们的 AI 助教已针对每门课程的知识点进行深度学习，为你提供即时的专业解答。
          </p>
        </div>
        <div class="shrink-0">
          <router-link
            to="/courses"
            class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors"
          >
            <span class="material-symbols-outlined text-base">smart_toy</span>
            Try AI Companion
          </router-link>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import heroImage from '@/assets/hero.png'
import { getCourses, type CourseDto, type VideoResourceType } from '@/api/course'
import { resourceLabel, resourceTagClass } from '@/domain/resourceMeta'

// ── 这是课程大厅页面，只包含课程列表逻辑，不含任何播放器 ──

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

const courses = ref<CourseDto[]>([])
const loading = ref(false)
const error = ref('')
const total = ref(0)
const totalPages = ref(1)
const page = ref(Number(route.query.page) || 1)
const selectedType = ref<VideoResourceType | ''>((route.query.type as VideoResourceType) || '')
const searchInput = ref((route.query.q as string) || '')
let debounceTimer: ReturnType<typeof setTimeout> | null = null

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
    if (page.value > data.pagination.totalPages && data.pagination.totalPages > 0) {
      page.value = data.pagination.totalPages
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载课程失败'
  } finally {
    loading.value = false
  }
}

function syncUrl() {
  const query: Record<string, string> = {}
  if (page.value > 1) query.page = String(page.value)
  if (selectedType.value) query.type = selectedType.value
  if (searchInput.value.trim()) query.q = searchInput.value.trim()
  router.replace({ path: '/', query })
}

function goToPage(p: number) {
  if (p < 1 || p > totalPages.value || loading.value) return
  page.value = p
  syncUrl()
  loadCourses()
}

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

watch(searchInput, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    page.value = 1
    syncUrl()
    loadCourses()
  }, DEBOUNCE_MS)
})

const pageNumbers = computed<(number | '...')[]>(() => {
  const t = totalPages.value
  const cur = page.value
  if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1)
  const pages: (number | '...')[] = [1]
  if (cur > 3) pages.push('...')
  for (let p = Math.max(2, cur - 1); p <= Math.min(t - 1, cur + 1); p++) pages.push(p)
  if (cur < t - 2) pages.push('...')
  pages.push(t)
  return pages
})

function getCourseTypes(course: CourseDto) {
  const set = new Set<VideoResourceType>()
  for (const r of course.resources) set.add(r.resource_type)
  return Array.from(set)
}

onMounted(loadCourses)
</script>
