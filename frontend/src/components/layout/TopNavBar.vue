<template>
  <nav
    class="fixed top-0 w-full z-50 h-16"
    :class="scrolled ? 'navbar-scrolled' : 'navbar-top'"
  >
    <div class="h-full flex items-center justify-between px-8 max-w-7xl mx-auto">

      <!-- ===== 品牌 Logo ===== -->
      <a
        href="/"
        class="flex items-center gap-2.5 flex-none group"
        @click.prevent="() => { window.location.href = '/' }"
      >
        <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
          <span class="material-symbols-outlined text-white text-base" aria-hidden="true">school</span>
        </div>
        <div class="leading-none">
          <span class="text-lg font-extrabold tracking-tight text-primary font-headline">{{ $t('navbar.brand') }}</span>
          <span class="text-xs font-medium text-on-surface-variant ml-1.5 font-body opacity-80">{{ $t('navbar.brandSub') }}</span>
        </div>
      </a>

      <!-- ===== 主导航链接 ===== -->
      <nav class="hidden lg:flex items-center gap-1" aria-label="主导航">
        <router-link
          to="/courses"
          class="nav-link"
          active-class="nav-link-active"
        >
          <span class="material-symbols-outlined text-base" aria-hidden="true">menu_book</span>
          {{ $t('navbar.courses') }}
        </router-link>
        <router-link
          to="/dashboard"
          class="nav-link"
          active-class="nav-link-active"
        >
          <span class="material-symbols-outlined text-base" aria-hidden="true">dashboard</span>
          {{ $t('navbar.dashboard') }}
        </router-link>
        <router-link
          to="/review-hall"
          class="nav-link"
          active-class="nav-link-active"
        >
          <span class="material-symbols-outlined text-base" aria-hidden="true">style</span>
          {{ $t('navbar.reviewHall') }}
        </router-link>
      </nav>

      <!-- ===== 右侧操作区 ===== -->
      <div class="flex items-center gap-2 flex-none">

        <!-- 语言切换器 -->
        <div class="relative" ref="langDropdownRef">
          <button
            type="button"
            class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-surface-container transition-colors duration-200 text-on-surface-variant"
            :aria-expanded="langDropdownOpen"
            aria-haspopup="true"
            @click="langDropdownOpen = !langDropdownOpen"
            title="切换语言 / Switch Language"
          >
            <span class="material-symbols-outlined text-base" aria-hidden="true">language</span>
            <span class="text-xs font-bold tracking-wide uppercase">{{ langStore.lang }}</span>
            <span
              class="material-symbols-outlined text-sm transition-transform duration-200"
              :class="langDropdownOpen ? 'rotate-180' : ''"
              aria-hidden="true"
            >expand_more</span>
          </button>

          <Transition name="dropdown">
            <div
              v-if="langDropdownOpen"
              class="absolute right-0 top-full mt-2 w-44 bg-white rounded-2xl shadow-xl border border-outline-variant/20 overflow-hidden py-1.5"
              role="menu"
            >
              <button
                v-for="opt in LANG_OPTIONS"
                :key="opt.code"
                type="button"
                class="lang-option w-full"
                :class="{ 'lang-option-active': langStore.lang === opt.code }"
                role="menuitem"
                @click="selectLang(opt.code)"
              >
                <span class="text-base" aria-hidden="true">{{ opt.flag }}</span>
                <span class="flex-1 text-left text-sm">{{ opt.label }}</span>
                <span
                  v-if="langStore.lang === opt.code"
                  class="material-symbols-outlined text-sm text-primary"
                  aria-hidden="true"
                >check</span>
              </button>
            </div>
          </Transition>
        </div>

        <!-- 管理员入口 -->
        <router-link
          to="/admin"
          class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors text-xs font-bold tracking-wide"
          title="管理员后台"
        >
          <span class="material-symbols-outlined text-sm">admin_panel_settings</span>
          Admin
        </router-link>

        <!-- 未登录：显示登录按钮 -->
        <router-link
          v-if="!isLoggedIn"
          to="/auth"
          class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border-2 border-primary text-primary text-sm font-bold hover:bg-primary hover:text-white transition-all duration-200"
        >
          <span class="material-symbols-outlined text-base">login</span>
          {{ $t('navbar.login') }}
        </router-link>

        <!-- 已登录：用户头像下拉菜单 -->
        <div v-else class="relative" ref="dropdownRef">
          <button
            type="button"
            class="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-xl hover:bg-surface-container transition-colors duration-200 group"
            :aria-expanded="dropdownOpen"
            aria-haspopup="true"
            @click="dropdownOpen = !dropdownOpen"
          >
            <div class="text-right hidden sm:block">
              <p class="text-sm font-bold text-on-surface font-body leading-none">{{ studentName }}</p>
              <p class="text-[10px] text-on-surface-variant tracking-wider uppercase font-body mt-0.5">{{ $t('navbar.student') }}</p>
            </div>
            <div
              class="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:shadow-md transition-shadow"
              aria-hidden="true"
            >
              {{ studentName?.charAt(0) ?? '学' }}
            </div>
            <span
              class="material-symbols-outlined text-on-surface-variant text-base transition-transform duration-200"
              :class="dropdownOpen ? 'rotate-180' : ''"
              aria-hidden="true"
            >expand_more</span>
          </button>

          <!-- 下拉菜单 -->
          <Transition name="dropdown">
            <div
              v-if="dropdownOpen"
              class="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-outline-variant/20 overflow-hidden py-1.5"
              role="menu"
            >
              <!-- 用户信息头部 -->
              <div class="px-4 py-3 border-b border-outline-variant/10">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-white font-bold">
                    {{ studentName?.charAt(0) ?? '学' }}
                  </div>
                  <div>
                    <p class="text-sm font-bold text-on-surface">{{ studentName }}</p>
                    <p class="text-xs text-on-surface-variant">{{ $t('navbar.studentRole') }}</p>
                  </div>
                </div>
              </div>

              <!-- 菜单项 -->
              <router-link
                to="/dashboard"
                class="dropdown-item"
                role="menuitem"
                @click="dropdownOpen = false"
              >
                <span class="material-symbols-outlined text-base" aria-hidden="true">dashboard</span>
                {{ $t('navbar.dashboard') }}
              </router-link>
              <a class="dropdown-item" href="#" role="menuitem">
                <span class="material-symbols-outlined text-base" aria-hidden="true">settings</span>
                {{ $t('navbar.accountSettings') }}
              </a>

              <div class="border-t border-outline-variant/10 mt-1 pt-1">
                <button
                  type="button"
                  class="dropdown-item w-full text-left text-red-500 hover:bg-red-50"
                  role="menuitem"
                  @click="handleLogout"
                >
                  <span class="material-symbols-outlined text-base" aria-hidden="true">logout</span>
                  {{ $t('navbar.logout') }}
                </button>
              </div>
            </div>
          </Transition>
        </div>

      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStudentAuth } from '@/composables/useStudentAuth'
import { useLangStore, type Lang } from '@/stores/useLangStore'

const router = useRouter()
const { isLoggedIn, studentName, logout } = useStudentAuth()
const langStore = useLangStore()

const LANG_OPTIONS: { code: Lang; label: string; flag: string }[] = [
  { code: 'zh', label: '简体中文', flag: '🇨🇳' },
  { code: 'ru', label: 'Русский',  flag: '🇷🇺' },
  { code: 'en', label: 'English',  flag: '🇬🇧' },
]

const scrolled = ref(false)
const dropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const langDropdownOpen = ref(false)
const langDropdownRef = ref<HTMLElement | null>(null)

function selectLang(code: Lang) {
  langStore.setLang(code)
  langDropdownOpen.value = false
}

// 滚动监听：导航栏背景随滚动变化
function onScroll() {
  scrolled.value = window.scrollY > 8
}

// 点击外部关闭下拉菜单
function onClickOutside(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    dropdownOpen.value = false
  }
  if (langDropdownRef.value && !langDropdownRef.value.contains(e.target as Node)) {
    langDropdownOpen.value = false
  }
}

function handleLogout() {
  logout()
  dropdownOpen.value = false
  router.push('/auth')
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  document.removeEventListener('click', onClickOutside)
})
</script>

<style scoped>
/* 导航栏背景状态 */
.navbar-top {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid transparent;
  transition: all 0.3s ease;
}

.navbar-scrolled {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-bottom: 1px solid rgba(171, 179, 183, 0.2);
  box-shadow: 0 2px 20px rgba(51, 94, 161, 0.06);
  transition: all 0.3s ease;
}

/* 导航链接 */
.nav-link {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  border-radius: 0.625rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-on-surface-variant);
  text-decoration: none;
  transition: all 0.2s ease;
  position: relative;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%) scaleX(0);
  width: 60%;
  height: 2px;
  background: linear-gradient(90deg, var(--color-primary), #60a5fa);
  border-radius: 1px;
  transition: transform 0.25s ease;
}

.nav-link:hover {
  color: var(--color-primary);
  background: var(--color-primary-container);
}

.nav-link:hover::after {
  transform: translateX(-50%) scaleX(1);
}

.nav-link-active {
  color: var(--color-primary) !important;
  background: var(--color-primary-container) !important;
  font-weight: 700;
}

.nav-link-active::after {
  transform: translateX(-50%) scaleX(1) !important;
}

/* 下拉菜单项 */
.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  color: var(--color-on-surface);
  text-decoration: none;
  transition: background 0.15s ease;
  cursor: pointer;
  border: none;
  background: none;
}

.dropdown-item:hover {
  background: var(--color-surface-container-low);
}

/* 下拉动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: top right;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: scale(0.92) translateY(-6px);
}

/* 语言选项 */
.lang-option {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  border: none;
  background: none;
  transition: background 0.15s ease;
  color: var(--color-on-surface);
}

.lang-option:hover {
  background: var(--color-surface-container-low);
}

.lang-option-active {
  background: var(--color-primary-container);
  font-weight: 700;
}
</style>
