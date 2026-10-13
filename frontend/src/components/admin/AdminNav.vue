<template>
  <nav class="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-900 px-5 py-4 text-white shadow-lg shadow-slate-200">
    <div class="flex flex-wrap items-center gap-1.5 text-sm font-bold">
      <router-link to="/admin" class="mr-3 flex items-center gap-2 text-lg font-black">
        <span class="material-symbols-outlined">school</span>
        {{ $t('admin.nav.console') }}
      </router-link>
      <router-link to="/admin" :class="linkClass('/admin')">{{ $t('admin.nav.courses') }}</router-link>
      <router-link v-if="can('enrollment.read')" to="/admin/enrollments" :class="linkClass('/admin/enrollments')">{{ $t('admin.nav.enrollments') }}</router-link>
      <router-link v-if="can('policy.read')" to="/admin/policies" :class="linkClass('/admin/policies')">{{ $t('admin.nav.policies') }}</router-link>
      <router-link v-if="can('admin.manage')" to="/admin/users" :class="linkClass('/admin/users')">{{ $t('admin.nav.users') }}</router-link>
    </div>
    <div class="flex items-center gap-3 text-xs">
      <LanguageSwitcher inverse />
      <span class="rounded-full bg-white/10 px-3 py-1.5">{{ admin?.name }} · {{ roleLabel }}</span>
      <button type="button" class="font-bold text-slate-300 hover:text-white" @click="signOut">{{ $t('admin.nav.logout') }}</button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminAuth } from '@/composables/useAdminAuth'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from '@/components/layout/LanguageSwitcher.vue'

const route = useRoute()
const router = useRouter()
const { admin, can, logout } = useAdminAuth()
const { t } = useI18n()

const roleLabel = computed(() => ({
  SUPER_ADMIN: t('admin.roles.superAdmin'),
  CONTENT_MANAGER: t('admin.roles.contentManager'),
  POLICY_EDITOR: t('admin.roles.policyEditor'),
  ANALYST: t('admin.roles.analyst'),
}[admin.value?.role ?? 'ANALYST']))

function linkClass(path: string) {
  const active = path === '/admin' ? route.path === path : route.path.startsWith(path)
  return [
    'rounded-lg px-3 py-2 transition',
    active ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white',
  ]
}

function signOut() {
  logout()
  void router.replace('/admin/login')
}
</script>
