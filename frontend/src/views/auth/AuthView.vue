<template>
  <main class="flex-grow flex flex-col md:flex-row min-h-screen">
    <div class="fixed right-4 top-4 z-50 rounded-xl bg-white/90 shadow-sm backdrop-blur">
      <LanguageSwitcher />
    </div>
    <!-- Left Column: Branding & Promotion -->
    <section class="hidden md:flex md:w-5/12 lg:w-1/2 relative bg-primary items-center justify-center p-12 overflow-hidden">
      <!-- Decorative Background Elements -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-white blur-3xl"></div>
        <div class="absolute bottom-[-5%] right-[-5%] w-80 h-80 rounded-full bg-primary-container blur-3xl"></div>
      </div>
      <div class="relative z-10 max-w-lg text-center md:text-left">
        <div class="mb-8 inline-flex items-center space-x-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
          <span class="material-symbols-outlined text-white">school</span>
          <span class="text-white font-headline font-bold tracking-tight text-xl">OpenEdu</span>
        </div>
        <h1 class="text-white text-5xl lg:text-6xl font-headline font-extrabold leading-tight mb-6">
          OpenEdu<br/><span class="text-primary-container">{{ $t('auth.heroTitle') }}</span>
        </h1>
        <p class="text-on-primary/80 text-lg font-body leading-relaxed mb-12 max-w-md">
          {{ $t('auth.heroDescription') }}
        </p>
        <!-- Visual Element: Abstract Card or Illustration -->
        <div class="relative group">
          <div class="absolute -inset-1 bg-gradient-to-r from-primary-fixed to-tertiary-fixed rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div class="relative bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-xl shadow-2xl">
            <div class="flex items-center space-x-4 mb-6">
              <div class="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center">
                <span class="material-symbols-outlined text-primary">auto_awesome</span>
              </div>
              <div>
                <h3 class="text-white font-headline font-semibold">{{ $t('auth.serviceTitle') }}</h3>
                <p class="text-on-primary/60 text-sm">{{ $t('auth.serviceDescription') }}</p>
              </div>
            </div>
            <div class="space-y-3">
              <div class="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div class="h-full w-2/3 bg-primary-container"></div>
              </div>
              <div class="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div class="h-full w-1/2 bg-tertiary-fixed"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Right Column: Forms Section -->
    <section class="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-24 bg-surface">
      <!-- Mobile Logo -->
      <div class="md:hidden mb-8 flex items-center space-x-2">
        <span class="material-symbols-outlined text-primary text-3xl">school</span>
        <span class="text-primary font-headline font-bold text-2xl tracking-tight">OpenEdu</span>
      </div>
      <div class="w-full max-w-md">
        <div v-if="route.query.reason === 'expired'" class="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="status">
          {{ $t('auth.sessionExpired') }}
        </div>
        <!-- Tabs Container -->
        <div class="bg-surface-container-low p-1 rounded-xl mb-10 flex space-x-1">
          <button
            @click="isLogin = true"
            :class="[
              'flex-1 py-3 text-sm font-headline rounded-lg transition-all duration-300',
              isLogin ? 'bg-surface-container-lowest text-primary shadow-sm font-bold' : 'text-on-surface-variant font-medium hover:text-on-surface'
            ]"
          >
            {{ $t('auth.loginTab') }}
          </button>
          <button
            @click="isLogin = false"
            :class="[
              'flex-1 py-3 text-sm font-headline rounded-lg transition-all duration-300',
              !isLogin ? 'bg-surface-container-lowest text-primary shadow-sm font-bold' : 'text-on-surface-variant font-medium hover:text-on-surface'
            ]"
          >
            {{ $t('auth.registerTab') }}
          </button>
        </div>

        <!-- Form Card -->
        <div class="bg-surface-container-lowest rounded-2xl p-8 lg:p-10 shadow-[0px_12px_32px_rgba(43,52,55,0.06)] relative">
          <!-- Login Form -->
          <div v-if="isLogin">
            <header class="mb-8">
              <h2 class="text-2xl font-headline font-bold text-on-surface">{{ $t('auth.welcomeBack') }}</h2>
              <p class="text-on-surface-variant text-sm mt-2">{{ $t('auth.loginDescription') }}</p>
            </header>
            <form class="space-y-6" @submit.prevent="handleLogin">
              <!-- Error banner -->
              <div
                v-if="loginError"
                class="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm"
                role="alert"
              >
                <span class="material-symbols-outlined text-base mt-0.5 shrink-0">error_outline</span>
                <span>{{ loginError }}</span>
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 ml-1">{{ $t('auth.email') }}</label>
                <div class="relative group">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">mail</span>
                  <input
                    v-model="loginEmail"
                    class="w-full pl-12 pr-4 py-3.5 bg-surface-container-high border-none rounded-lg font-body text-on-surface placeholder:text-outline/60 focus:ring-0 transition-all"
                    placeholder="name@example.com"
                    type="email"
                    autocomplete="email"
                    required
                    :disabled="submitting"
                  />
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 ml-1">{{ $t('auth.password') }}</label>
                <div class="relative group">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">lock</span>
                  <input
                    v-model="loginPassword"
                    class="w-full pl-12 pr-4 py-3.5 bg-surface-container-high border-none rounded-lg font-body text-on-surface placeholder:text-outline/60 focus:ring-0 transition-all"
                    placeholder="••••••••"
                    type="password"
                    autocomplete="current-password"
                    required
                    :disabled="submitting"
                  />
                </div>
              </div>
              <div class="flex items-center gap-2 text-xs text-on-surface-variant">
                <span class="material-symbols-outlined text-base text-primary" aria-hidden="true">shield_lock</span>
                {{ $t('auth.localSession') }}
              </div>
              <button
                class="w-full bg-primary hover:bg-primary-dim text-on-primary font-headline font-bold py-4 rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                type="submit"
                :disabled="submitting"
              >
                <span v-if="submitting" class="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                <span>{{ submitting ? $t('auth.loggingIn') : $t('auth.loginNow') }}</span>
                <span v-if="!submitting" class="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </form>
          </div>

          <!-- Register Form -->
          <div v-else>
            <header class="mb-8">
              <h2 class="text-2xl font-headline font-bold text-on-surface">{{ $t('auth.createAccount') }}</h2>
              <p class="text-on-surface-variant text-sm mt-2">{{ $t('auth.registerDescription') }}</p>
            </header>
            <form class="space-y-5" @submit.prevent="handleRegister">
              <!-- Error banner -->
              <div
                v-if="registerError"
                class="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm"
                role="alert"
              >
                <span class="material-symbols-outlined text-base mt-0.5 shrink-0">error_outline</span>
                <span>{{ registerError }}</span>
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 ml-1">{{ $t('auth.name') }}</label>
                <div class="relative group">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">person</span>
                  <input
                    v-model="registerName"
                    class="w-full pl-12 pr-4 py-3 bg-surface-container-high border-none rounded-lg font-body text-on-surface placeholder:text-outline/60 focus:ring-0 transition-all"
                    :placeholder="$t('auth.namePlaceholder')"
                    type="text"
                    required
                    :disabled="submitting"
                  />
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 ml-1">{{ $t('auth.email') }}</label>
                <div class="relative group">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">mail</span>
                  <input
                    v-model="registerEmail"
                    class="w-full pl-12 pr-4 py-3 bg-surface-container-high border-none rounded-lg font-body text-on-surface placeholder:text-outline/60 focus:ring-0 transition-all"
                    placeholder="edu@example.com"
                    type="email"
                    autocomplete="email"
                    required
                    :disabled="submitting"
                  />
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 ml-1">{{ $t('auth.setPassword') }}</label>
                <div class="relative group">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">lock</span>
                  <input
                    v-model="registerPassword"
                    class="w-full pl-12 pr-4 py-3 bg-surface-container-high border-none rounded-lg font-body text-on-surface placeholder:text-outline/60 focus:ring-0 transition-all"
                    :placeholder="$t('auth.passwordPlaceholder')"
                    type="password"
                    autocomplete="new-password"
                    required
                    :disabled="submitting"
                  />
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 ml-1">{{ $t('auth.confirmPassword') }}</label>
                <div class="relative group">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">verified_user</span>
                  <input
                    v-model="registerConfirmPassword"
                    class="w-full pl-12 pr-4 py-3 bg-surface-container-high border-none rounded-lg font-body text-on-surface placeholder:text-outline/60 focus:ring-0 transition-all"
                    :placeholder="$t('auth.confirmPasswordPlaceholder')"
                    type="password"
                    autocomplete="new-password"
                    required
                    :disabled="submitting"
                  />
                </div>
              </div>
              <button
                class="w-full bg-primary hover:bg-primary-dim text-on-primary font-headline font-bold py-4 rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98] mt-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                type="submit"
                :disabled="submitting"
              >
                {{ submitting ? $t('auth.registering') : $t('auth.registerNow') }}
              </button>
              <p class="text-center text-[10px] sm:text-xs text-on-surface-variant leading-relaxed px-4">
                {{ $t('auth.agreement') }}
              </p>
            </form>
          </div>
        </div>

        <p class="mt-8 text-center text-xs text-on-surface-variant">
          {{ $t('auth.noGoal') }}
          <router-link to="/courses" class="font-bold text-primary hover:underline">{{ $t('auth.browseCourses') }}</router-link>
        </p>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useStudentAuth } from '@/composables/useStudentAuth'
import LanguageSwitcher from '@/components/layout/LanguageSwitcher.vue'

const isLogin = ref(true)
const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const { login, register } = useStudentAuth()

const submitting = ref(false)

// ── Login form state ──
const loginEmail = ref('')
const loginPassword = ref('')
const loginError = ref('')

// ── Register form state ──
const registerName = ref('')
const registerEmail = ref('')
const registerPassword = ref('')
const registerConfirmPassword = ref('')
const registerError = ref('')

async function handleLogin() {
  loginError.value = ''
  const email = loginEmail.value.trim()
  const password = loginPassword.value

  if (!email || !password) {
    loginError.value = t('auth.emailPasswordRequired')
    return
  }

  submitting.value = true
  try {
    await login({ email, password })
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
      ? route.query.redirect
      : '/dashboard'
    router.push(redirect)
  } catch (e) {
    loginError.value = e instanceof Error ? e.message : t('auth.loginFailed')
  } finally {
    submitting.value = false
  }
}

async function handleRegister() {
  registerError.value = ''
  const name = registerName.value.trim()
  const email = registerEmail.value.trim()
  const password = registerPassword.value
  const confirm = registerConfirmPassword.value

  if (!name || !email || !password || !confirm) {
    registerError.value = t('auth.allFieldsRequired')
    return
  }
  if (password.length < 8) {
    registerError.value = t('auth.passwordTooShort')
    return
  }
  if (password !== confirm) {
    registerError.value = t('auth.passwordMismatch')
    return
  }

  submitting.value = true
  try {
    await register({ email, name, password })
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
      ? route.query.redirect
      : '/dashboard'
    router.push(redirect)
  } catch (e) {
    registerError.value = e instanceof Error ? e.message : t('auth.registerFailed')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
input:focus {
  border-bottom-width: 2px;
  border-color: var(--color-primary);
  outline: none;
}
</style>
