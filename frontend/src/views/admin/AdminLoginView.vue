<template>
  <main class="relative min-h-screen bg-slate-950 px-6 py-12 text-slate-900">
    <div class="absolute right-6 top-5 z-10 rounded-xl bg-white/10">
      <LanguageSwitcher inverse />
    </div>
    <div class="mx-auto grid min-h-[calc(100vh-6rem)] max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl lg:grid-cols-2">
      <section class="hidden bg-gradient-to-br from-indigo-700 via-blue-700 to-cyan-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <router-link to="/" class="inline-flex items-center gap-3 text-xl font-black">
          <span class="material-symbols-outlined rounded-xl bg-white/15 p-2">school</span>
          OpenEdu
        </router-link>
        <div>
          <p class="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-cyan-100">{{ $t('admin.login.eyebrow') }}</p>
          <h1 class="text-4xl font-black leading-tight">{{ $t('admin.login.heroTitle') }}</h1>
          <p class="mt-5 max-w-md text-sm leading-7 text-blue-100">{{ $t('admin.login.heroDescription') }}</p>
        </div>
        <p class="text-xs text-blue-100">{{ $t('admin.login.sessionHint') }}</p>
      </section>

      <section class="flex items-center p-8 sm:p-14">
        <form class="w-full" @submit.prevent="submit">
          <router-link to="/" class="mb-10 inline-flex items-center gap-2 text-sm font-bold text-indigo-700 lg:hidden">
            <span class="material-symbols-outlined">arrow_back</span> {{ $t('admin.login.back') }}
          </router-link>
          <p class="text-sm font-bold text-indigo-600">{{ $t('admin.login.console') }}</p>
          <h2 class="mt-2 text-3xl font-black text-slate-900">{{ $t('admin.login.welcome') }}</h2>
          <p class="mt-2 text-sm text-slate-500">{{ $t('admin.login.description') }}</p>

          <div v-if="route.query.reason === 'expired' || route.query.reason === 'disabled'" class="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="status">
            {{ route.query.reason === 'disabled' ? $t('admin.login.disabled') : $t('admin.login.expired') }}
          </div>
          <div v-if="error" class="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
            {{ error }}
          </div>

          <label class="mt-8 block text-sm font-bold text-slate-700">
            {{ $t('admin.login.email') }}
            <input v-model.trim="form.email" type="email" autocomplete="username" required class="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" placeholder="admin@institution.edu" />
          </label>
          <label class="mt-5 block text-sm font-bold text-slate-700">
            {{ $t('admin.login.password') }}
            <input v-model="form.password" type="password" autocomplete="current-password" required class="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" :placeholder="$t('admin.login.passwordPlaceholder')" />
          </label>

          <button type="submit" :disabled="loading" class="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60">
            <span v-if="loading" class="material-symbols-outlined animate-spin">progress_activity</span>
            {{ loading ? $t('admin.login.validating') : $t('admin.login.submit') }}
          </button>
          <p class="mt-6 text-center text-xs text-slate-400">{{ $t('admin.login.rateLimit') }}</p>
        </form>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminAuth } from '@/composables/useAdminAuth'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from '@/components/layout/LanguageSwitcher.vue'

const router = useRouter()
const route = useRoute()
const { login } = useAdminAuth()
const { t } = useI18n()
const form = reactive({ email: '', password: '' })
const loading = ref(false)
const error = ref('')

async function submit() {
  loading.value = true
  error.value = ''
  try {
    await login(form)
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/admin')
      ? route.query.redirect
      : '/admin'
    await router.replace(redirect)
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : t('admin.login.failed')
  } finally {
    loading.value = false
  }
}
</script>
