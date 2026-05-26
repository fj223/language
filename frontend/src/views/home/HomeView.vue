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
                style="background: linear-gradient(90deg, #fde68a 0%, #fb923c 100%);">
                OpenEdu
              </span>
            </h1>
            <p class="text-xl text-blue-100 font-light leading-relaxed mb-4 max-w-lg mx-auto lg:mx-0">
              {{ $t('home.sub') }}
            </p>
            <p class="text-blue-200/70 text-sm leading-relaxed mb-10 max-w-md mx-auto lg:mx-0">
              {{ $t('home.desc') }}
            </p>

            <div class="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
              <router-link
                to="/courses"
                class="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 shadow-lg"
                style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); color: white; box-shadow: 0 8px 24px rgba(249,115,22,0.35);"
              >
                <span class="material-symbols-outlined text-base" aria-hidden="true">menu_book</span>
                <span>{{ $t('home.btnCourses') }}</span>
              </router-link>
              <router-link
                to="/dashboard"
                class="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200"
                style="background: rgba(255,255,255,0.12); border: 1.5px solid rgba(255,255,255,0.25); color: white;"
              >
                <span class="material-symbols-outlined text-base" aria-hidden="true">smart_toy</span>
                <span>{{ $t('home.btnDashboard') }}</span>
              </router-link>
            </div>
          </div>

          <div class="hidden lg:grid grid-cols-2 gap-4 shrink-0 w-80">
            <div
              v-for="stat in STATS"
              :key="stat.label"
              class="rounded-2xl p-5 flex flex-col gap-2"
              style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); backdrop-filter: blur(12px);"
            >
              <span class="material-symbols-outlined text-2xl" :style="{ color: stat.color }" aria-hidden="true">{{ stat.icon }}</span>
              <p class="text-2xl font-black text-white">{{ stat.value }}</p>
              <p class="text-xs text-blue-200/70 font-medium">{{ stat.label }}</p>
            </div>
          </div>

        </div>
      </div>

      <div class="absolute bottom-0 left-0 right-0 h-12 overflow-hidden">
        <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full" preserveAspectRatio="none">
          <path d="M0 48L60 42.7C120 37.3 240 26.7 360 21.3C480 16 600 16 720 21.3C840 26.7 960 37.3 1080 40C1200 42.7 1320 37.3 1380 34.7L1440 32V48H1380C1320 48 1200 48 1080 48C960 48 840 48 720 48C600 48 480 48 360 48C240 48 120 48 60 48H0Z" fill="#f5f7fa"/>
        </svg>
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
        <router-link
          v-for="card in QUICK_CARDS"
          :key="card.title"
          :to="card.to"
          class="entry-card group"
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
        <router-link
          to="/dashboard"
          class="shrink-0 flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all duration-200"
          style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); box-shadow: 0 4px 16px rgba(249,115,22,0.4);"
        >
          <span class="material-symbols-outlined text-base" aria-hidden="true">dashboard</span>
          {{ $t('home.bannerBtn') }}
        </router-link>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// 这里的数组转成了 computed，这样每次切换语言时，数组里的 t() 函数都会重新执行并更新内容
const STATS = computed(() => [
  { icon: 'menu_book', value: '20+', label: t('home.stat1'), color: '#fbbf24' },
  { icon: 'language', value: '7', label: t('home.stat2'), color: '#60a5fa' },
  { icon: 'group', value: '500+', label: t('home.stat3'), color: '#34d399' },
  { icon: 'smart_toy', value: 'AI', label: t('home.stat4'), color: '#a78bfa' },
])

const QUICK_CARDS = computed(() => [
  {
    to: '/dashboard',
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

const LANGUAGES = computed(() => [
  { name: t('home.langEn'), emoji: '🇬🇧', sub: t('home.langEnSub') },
  { name: t('home.langRu'), emoji: '🇷🇺', sub: t('home.langRuSub') },
  { name: t('home.langFr'), emoji: '🇫🇷', sub: t('home.langFrSub') },
  { name: t('home.langJa'), emoji: '🇯🇵', sub: t('home.langJaSub') },
  { name: t('home.langDe'), emoji: '🇩🇪', sub: t('home.langDeSub') },
  { name: t('home.langEs'), emoji: '🇪🇸', sub: t('home.langEsSub') },
  { name: t('home.langKo'), emoji: '🇰🇷', sub: t('home.langKoSub') },
])
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
</style>