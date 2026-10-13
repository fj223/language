<template>
  <div class="min-h-screen" style="background: #f5f7fa;">

    <section
      class="relative overflow-hidden text-white"
      style="background: linear-gradient(135deg, #0f2557 0%, #1a3a7a 40%, #1e4fa0 70%, #2563c4 100%);"
    >
      <div class="absolute inset-0 pointer-events-none overflow-hidden">
        <div class="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-10"
          style="background: radial-gradient(circle, #60a5fa 0%, transparent 70%);"
        />
        <div class="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full opacity-10"
          style="background: radial-gradient(circle, #818cf8 0%, transparent 70%);"
        />
        <div class="absolute inset-0 opacity-[0.04]"
          style="background-image: linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px); background-size: 40px 40px;"
        />
      </div>

      <div class="relative max-w-6xl mx-auto px-6 py-24 lg:py-32">
        <div class="flex flex-col lg:flex-row items-center gap-16">

          <div class="flex-1 text-center lg:text-left">
            <div class="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold mb-8"
              style="background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);">
              <span class="material-symbols-outlined text-base text-yellow-300" aria-hidden="true">auto_awesome</span>
              <span class="text-blue-100">{{ $t('home.badge') }}</span>
            </div>

            <h1 class="text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6">
              <span class="block text-white">{{ $t('home.title') }}</span>
              <span class="block text-transparent bg-clip-text"
                style="background-image: linear-gradient(90deg, #fde68a 0%, #fb923c 100%);">
                OpenEdu
              </span>
            </h1>
            <p class="text-xl text-blue-100 font-light leading-relaxed mb-4 max-w-lg mx-auto lg:mx-0">
              {{ $t('home.sub') }}
            </p>
            <p class="text-blue-200/70 text-sm leading-relaxed mb-10 max-w-md mx-auto lg:mx-0">
              {{ $t('home.desc') }}
            </p>

            <form class="hero-search mx-auto mb-5 max-w-xl lg:mx-0" role="search" @submit.prevent="submitCourseSearch">
              <span class="material-symbols-outlined text-xl text-slate-400" aria-hidden="true">search</span>
              <input
                v-model="courseSearch"
                type="search"
                :placeholder="$t('home.searchPlaceholder')"
                :aria-label="$t('home.searchPlaceholder')"
              />
              <button type="submit">{{ $t('home.searchButton') }}</button>
            </form>

            <div class="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
              <router-link
                to="/courses"
                class="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 shadow-lg"
                style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); color: white; box-shadow: 0 8px 24px rgba(249,115,22,0.35);"
              >
                <span class="material-symbols-outlined text-base" aria-hidden="true">menu_book</span>
                <span>{{ $t('home.btnCourses') }}</span>
              </router-link>
              <button
                type="button"
                class="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200"
                style="background: rgba(255,255,255,0.12); border: 1.5px solid rgba(255,255,255,0.25); color: white;"
                @click="openChatbot"
              >
                <span class="material-symbols-outlined text-base" aria-hidden="true">smart_toy</span>
                <span>{{ $t('home.btnDashboard') }}</span>
              </button>
            </div>
          </div>

          <div class="hidden lg:block shrink-0 w-[360px]">
            <div class="learning-preview">
              <div class="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200/60">OpenEdu learning path</p>
                  <p class="mt-1 text-base font-extrabold text-white">{{ $t('home.journeyTitle') }}</p>
                </div>
                <span class="material-symbols-outlined rounded-xl bg-white/10 p-2 text-yellow-300">route</span>
              </div>
              <div class="mt-5 grid gap-3">
                <div
                  v-for="item in PROMISES"
                  :key="item.label"
                  class="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3"
                >
                  <span
                    class="material-symbols-outlined grid h-9 w-9 place-items-center rounded-lg text-lg"
                    :style="{ color: item.color, background: item.background }"
                    aria-hidden="true"
                  >{{ item.icon }}</span>
                  <p class="text-sm font-semibold text-blue-50">{{ item.label }}</p>
                  <span class="material-symbols-outlined ml-auto text-base text-emerald-300">check_circle</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

    </section>

    <section class="max-w-6xl mx-auto px-6 py-16">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-extrabold text-on-surface font-headline tracking-tight mb-3">
          {{ $t('home.journeyTitle') }}
        </h2>
        <p class="text-on-surface-variant text-sm max-w-md mx-auto">
          {{ $t('home.journeySub') }}
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <component
          :is="card.action === 'chatbot' ? 'button' : 'router-link'"
          v-for="card in QUICK_CARDS"
          :key="card.title"
          :to="card.to"
          :type="card.action === 'chatbot' ? 'button' : undefined"
          class="entry-card group"
          @click="handleQuickCard(card.action)"
        >
          <div
            class="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
            :style="{ background: card.iconBg }"
          >
            <span class="material-symbols-outlined text-2xl text-white" aria-hidden="true">{{ card.icon }}</span>
          </div>
          <h3 class="text-lg font-bold text-on-surface font-headline mb-2 group-hover:text-primary transition-colors">
            {{ card.title }}
          </h3>
          <p class="text-sm text-on-surface-variant leading-relaxed flex-1">
            {{ card.desc }}
          </p>
          <div class="mt-5 flex items-center gap-1.5 text-primary text-sm font-bold">
            <span>{{ card.cta }}</span>
            <span class="material-symbols-outlined text-base transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">arrow_forward</span>
          </div>
        </component>
      </div>
    </section>

    <section class="max-w-6xl mx-auto px-6 pb-16" aria-labelledby="featured-courses-title">
      <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="eyebrow mb-2">{{ $t('home.featuredEyebrow') }}</p>
          <h2 id="featured-courses-title" class="text-2xl font-extrabold text-on-surface font-headline tracking-tight">
            {{ $t('home.featuredTitle') }}
          </h2>
          <p class="mt-2 max-w-xl text-sm text-on-surface-variant">{{ $t('home.featuredDesc') }}</p>
        </div>
        <router-link to="/courses" class="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">
          {{ $t('home.featuredAll') }}
          <span class="material-symbols-outlined text-base" aria-hidden="true">arrow_forward</span>
        </router-link>
      </div>

      <div v-if="featuredLoading" class="grid gap-6 md:grid-cols-3" aria-hidden="true">
        <div v-for="item in 3" :key="item" class="h-80 animate-pulse rounded-3xl bg-white shadow-sm" />
      </div>
      <div v-else-if="featuredError" class="surface-card px-6 py-8 text-center">
        <p class="text-sm text-on-surface-variant">{{ $t('home.featuredError') }}</p>
        <router-link to="/courses" class="mt-3 inline-flex text-sm font-bold text-primary hover:underline">
          {{ $t('home.featuredAll') }}
        </router-link>
      </div>
      <div v-else class="grid gap-6 md:grid-cols-3">
        <router-link
          v-for="course in featuredCourses"
          :key="course.id"
          :to="`/courses/${course.id}`"
          class="featured-course group"
        >
          <div class="relative aspect-[16/9] overflow-hidden bg-slate-100">
            <img
              :src="course.coverUrl || defaultCover"
              :alt="course.title"
              class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              @error="useDefaultCover"
            />
            <span class="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold text-primary shadow-sm backdrop-blur">
              {{ course.languageLabel || course.language }}
            </span>
          </div>
          <div class="flex flex-1 flex-col p-5">
            <div class="mb-3 flex items-center gap-2 text-xs font-bold text-primary">
              <span class="rounded-full bg-primary/10 px-2.5 py-1">{{ course.level || $t('courseList.levelPending') }}</span>
            </div>
            <h3 class="text-lg font-extrabold leading-snug text-on-surface transition-colors group-hover:text-primary">
              {{ course.title }}
            </h3>
            <div class="mt-4 space-y-2 text-sm text-on-surface-variant">
              <p class="flex items-start gap-2">
                <span class="material-symbols-outlined mt-0.5 text-base text-primary/60" aria-hidden="true">person</span>
                {{ course.teacher || $t('courseList.teacherPending') }}
              </p>
              <p class="flex items-start gap-2">
                <span class="material-symbols-outlined mt-0.5 text-base text-primary/60" aria-hidden="true">schedule</span>
                {{ course.schedule || $t('courseList.timePending') }}
              </p>
            </div>
            <span class="mt-5 inline-flex items-center gap-1 text-sm font-extrabold text-primary">
              {{ $t('courseList.viewDetails') }}
              <span class="material-symbols-outlined text-base transition-transform group-hover:translate-x-1" aria-hidden="true">arrow_forward</span>
            </span>
          </div>
        </router-link>
      </div>
    </section>

    <section class="max-w-6xl mx-auto px-6 pb-16">
      <div class="text-center mb-10">
        <h2 class="text-2xl font-extrabold text-on-surface font-headline tracking-tight mb-2">
          {{ $t('home.langsTitle') }}
        </h2>
        <p class="text-on-surface-variant text-sm">{{ $t('home.langsSub') }}</p>
      </div>

      <div class="flex flex-wrap justify-center gap-3">
        <router-link
          v-for="lang in LANGUAGES"
          :key="lang.name"
          :to="`/courses?language=${lang.name}`"
          class="lang-chip group"
        >
          <span class="text-2xl" aria-hidden="true">{{ lang.emoji }}</span>
          <div class="text-left">
            <p class="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{{ lang.name }}</p>
            <p class="text-[11px] text-on-surface-variant">{{ lang.sub }}</p>
          </div>
        </router-link>
      </div>
    </section>

    <section class="mx-6 mb-16 rounded-3xl overflow-hidden"
      style="background: linear-gradient(135deg, #1e3a6e 0%, #1a3a7a 50%, #0f2557 100%);">
      <div class="max-w-5xl mx-auto px-8 py-12 flex flex-col lg:flex-row items-center gap-10">
        <div
          class="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0"
          style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15);"
        >
          <span class="material-symbols-outlined text-4xl text-yellow-300" style="font-variation-settings:'FILL' 1;" aria-hidden="true">smart_toy</span>
        </div>
        <div class="flex-1 text-center lg:text-left">
          <p class="text-yellow-300 text-xs font-bold uppercase tracking-widest mb-2">{{ $t('home.bannerBadge') }}</p>
          <h2 class="text-2xl font-extrabold text-white mb-3">{{ $t('home.bannerTitle') }}</h2>
          <p class="text-blue-200/80 text-sm leading-relaxed max-w-xl">
            {{ $t('home.bannerDesc') }}
          </p>
        </div>
        <button
          type="button"
          class="shrink-0 flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all duration-200"
          style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); box-shadow: 0 4px 16px rgba(249,115,22,0.4);"
          @click="openChatbot"
        >
          <span class="material-symbols-outlined text-base" aria-hidden="true">forum</span>
          {{ $t('home.bannerBtn') }}
        </button>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { getGatewayCourses, type GatewayCourse } from '@/api/gateway'
import defaultCover from '@/assets/hero.png'

const { t, locale } = useI18n()
const router = useRouter()
const courseSearch = ref('')
const featuredCourses = ref<GatewayCourse[]>([])
const featuredLoading = ref(true)
const featuredError = ref(false)

function submitCourseSearch() {
  const q = courseSearch.value.trim()
  void router.push({ path: '/courses', query: q ? { q } : {} })
}

function useDefaultCover(event: Event) {
  const image = event.currentTarget as HTMLImageElement
  if (image.src !== defaultCover) image.src = defaultCover
}

async function loadFeaturedCourses() {
  featuredLoading.value = true
  featuredError.value = false
  try {
    featuredCourses.value = (await getGatewayCourses({}, locale.value)).slice(0, 3)
  } catch {
    featuredError.value = true
  } finally {
    featuredLoading.value = false
  }
}

// 这里的数组转成了 computed，这样每次切换语言时，数组里的 t() 函数都会重新执行并更新内容
const PROMISES = computed(() => [
  { icon: 'menu_book', label: t('home.stat1'), color: '#fde68a', background: 'rgba(245, 158, 11, 0.14)' },
  { icon: 'translate', label: t('home.stat2'), color: '#93c5fd', background: 'rgba(59, 130, 246, 0.14)' },
  { icon: 'timeline', label: t('dashboard.subtitle'), color: '#6ee7b7', background: 'rgba(16, 185, 129, 0.14)' },
  { icon: 'smart_toy', label: t('home.stat4'), color: '#c4b5fd', background: 'rgba(139, 92, 246, 0.14)' },
])

const QUICK_CARDS = computed(() => [
  {
    action: 'chatbot',
    icon: 'smart_toy',
    iconBg: 'linear-gradient(135deg, #335ea1 0%, #4f7fd4 100%)',
    title: t('home.card1Title'),
    desc: t('home.card1Desc'),
    cta: t('home.card1Btn'),
  },
  {
    to: '/courses',
    icon: 'menu_book',
    iconBg: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
    title: t('home.card2Title'),
    desc: t('home.card2Desc'),
    cta: t('home.card2Btn'),
  },
  {
    to: '/dashboard',
    icon: 'calendar_month',
    iconBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    title: t('home.card3Title'),
    desc: t('home.card3Desc'),
    cta: t('home.card3Btn'),
  },
])

function openChatbot() {
  window.dispatchEvent(new CustomEvent('open-openedu-chatbot'))
}

function handleQuickCard(action?: string) {
  if (action === 'chatbot') openChatbot()
}

const LANGUAGES = computed(() => [
  { name: t('home.langEn'), emoji: '🇬🇧', sub: t('home.langEnSub') },
  { name: t('home.langRu'), emoji: '🇷🇺', sub: t('home.langRuSub') },
  { name: t('home.langFr'), emoji: '🇫🇷', sub: t('home.langFrSub') },
  { name: t('home.langJa'), emoji: '🇯🇵', sub: t('home.langJaSub') },
  { name: t('home.langDe'), emoji: '🇩🇪', sub: t('home.langDeSub') },
  { name: t('home.langEs'), emoji: '🇪🇸', sub: t('home.langEsSub') },
  { name: t('home.langKo'), emoji: '🇰🇷', sub: t('home.langKoSub') },
])

onMounted(() => {
  void loadFeaturedCourses()
})

watch(locale, () => {
  void loadFeaturedCourses()
})
</script>

<style scoped>
/* 快速入口卡片 */
.entry-card {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 1.5rem;
  padding: 1.75rem;
  text-decoration: none;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
  border: 1px solid rgba(171, 179, 183, 0.12);
}

.entry-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 28px rgba(51, 94, 161, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* 语种 chip */
.lang-chip {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  background: white;
  border-radius: 1rem;
  text-decoration: none;
  border: 1px solid rgba(171, 179, 183, 0.15);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.lang-chip:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 16px rgba(51, 94, 161, 0.1);
  border-color: rgba(51, 94, 161, 0.2);
}

.learning-preview {
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 1.75rem;
  padding: 1.4rem;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.13), rgba(255, 255, 255, 0.06));
  box-shadow: 0 28px 70px rgba(2, 12, 38, 0.35);
  backdrop-filter: blur(22px);
  transform: rotate(1.5deg);
}

.hero-search {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.45rem 0.45rem 0.45rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 1.1rem;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 40px rgba(2, 12, 38, 0.22);
}

.hero-search input {
  min-width: 0;
  border: 0;
  background: transparent;
  color: #1e293b;
  font-size: 0.9rem;
}

.hero-search input::placeholder {
  color: #94a3b8;
}

.hero-search button {
  min-height: 2.65rem;
  border-radius: 0.8rem;
  padding-inline: 1.15rem;
  background: #335ea1;
  color: white;
  font-size: 0.82rem;
  font-weight: 800;
}

.featured-course {
  display: flex;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(171, 179, 183, 0.16);
  border-radius: 1.5rem;
  background: white;
  box-shadow: 0 4px 18px rgba(30, 58, 95, 0.07);
  text-decoration: none;
  transition: transform 220ms ease, box-shadow 220ms ease;
}

.featured-course:hover {
  transform: translateY(-5px);
  box-shadow: 0 18px 38px rgba(30, 58, 95, 0.13);
}

@media (max-width: 639px) {
  .hero-search {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .hero-search button {
    grid-column: 1 / -1;
  }
}
</style>
