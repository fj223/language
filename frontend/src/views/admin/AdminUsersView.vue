<template>
  <main class="admin-page">
    <div class="admin-shell">
      <AdminNav />

      <section class="admin-page-header">
        <div>
          <p class="text-sm font-black text-indigo-600">{{ $t('admin.users.eyebrow') }}</p>
          <h1 class="mt-1 text-3xl font-black text-slate-900">{{ $t('admin.users.title') }}</h1>
          <p class="mt-2 text-sm text-slate-500">{{ $t('admin.users.subtitle') }}</p>
        </div>
        <button type="button" class="admin-button-primary" @click="showCreate = true">
          + {{ $t('admin.users.createAdmin') }}
        </button>
      </section>

      <div v-if="notice" class="rounded-xl border px-4 py-3 text-sm" :class="noticeKind === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'" role="status">
        {{ notice }}
      </div>

      <section class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div class="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div class="border-b border-slate-100 px-5 py-4">
            <h2 class="font-black text-slate-800">{{ $t('admin.users.institutionAdmins') }}</h2>
            <p class="mt-1 text-xs text-slate-500">{{ $t('admin.users.listHint') }}</p>
          </div>
          <div v-if="loading" class="p-12 text-center text-sm text-slate-500">{{ $t('admin.users.loading') }}</div>
          <div v-else-if="!users.length" class="p-12 text-center text-sm text-slate-500">{{ $t('admin.users.empty') }}</div>
          <div v-else class="divide-y divide-slate-100">
            <article v-for="user in users" :key="user.id" class="grid gap-4 p-5 lg:grid-cols-[minmax(220px,1fr)_190px_120px_auto] lg:items-center">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <input v-model.trim="drafts[user.id].name" :disabled="savingId === user.id" maxlength="100" class="min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-indigo-500" :aria-label="$t('admin.users.nameLabel', { email: user.email })" />
                  <span v-if="user.id === admin?.id" class="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-black text-indigo-700">{{ $t('admin.users.currentAccount') }}</span>
                  <span v-if="!user.isActive" class="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-black text-rose-700">{{ $t('admin.users.disabled') }}</span>
                </div>
                <p class="mt-2 truncate text-xs text-slate-500">{{ user.email }}</p>
                <p class="mt-1 text-[11px] text-slate-400">{{ $t('admin.users.createdAt', { time: formatDate(user.createdAt) }) }}</p>
              </div>

              <label class="text-xs font-bold text-slate-500">{{ $t('admin.users.role') }}
                <select v-model="drafts[user.id].role" :disabled="user.id === admin?.id || savingId === user.id" class="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 disabled:bg-slate-100">
                  <option v-for="option in roleOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
              </label>

              <label class="flex items-center gap-2 text-sm font-bold text-slate-600">
                <input v-model="drafts[user.id].isActive" type="checkbox" :disabled="user.id === admin?.id || savingId === user.id" class="h-4 w-4 accent-indigo-600" />
                {{ $t('admin.users.enableAccount') }}
              </label>

              <div class="flex flex-wrap gap-2 lg:justify-end">
                <button type="button" :disabled="savingId === user.id || !hasChanges(user)" class="rounded-lg bg-slate-900 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-35" @click="saveUser(user)">
                  {{ savingId === user.id ? $t('admin.common.saving') : $t('admin.common.save') }}
                </button>
                <button v-if="user.id !== admin?.id" type="button" class="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50" @click="openReset(user)">{{ $t('admin.users.resetPassword') }}</button>
              </div>
            </article>
          </div>
        </div>

        <form class="h-fit rounded-2xl bg-white p-6 shadow-sm" @submit.prevent="changePassword">
          <span class="material-symbols-outlined rounded-xl bg-amber-50 p-3 text-amber-600">password</span>
          <h2 class="mt-4 text-lg font-black text-slate-900">{{ $t('admin.users.changeMyPassword') }}</h2>
          <p class="mt-1 text-xs leading-5 text-slate-500">{{ $t('admin.users.passwordHint') }}</p>
          <label class="mt-5 block text-xs font-bold text-slate-600">{{ $t('admin.users.currentPassword') }}
            <input v-model="passwordForm.current" type="password" autocomplete="current-password" required class="field" />
          </label>
          <label class="mt-4 block text-xs font-bold text-slate-600">{{ $t('admin.users.newPassword') }}
            <input v-model="passwordForm.next" type="password" autocomplete="new-password" minlength="10" maxlength="128" required class="field" />
          </label>
          <label class="mt-4 block text-xs font-bold text-slate-600">{{ $t('admin.users.confirmPassword') }}
            <input v-model="passwordForm.confirm" type="password" autocomplete="new-password" minlength="10" maxlength="128" required class="field" />
          </label>
          <button type="submit" :disabled="changingPassword" class="mt-5 w-full rounded-xl bg-amber-500 py-3 text-sm font-black text-white disabled:opacity-50">
            {{ changingPassword ? $t('admin.users.changing') : $t('admin.users.updateMyPassword') }}
          </button>
        </form>
      </section>

      <section class="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 class="font-black text-slate-800">{{ $t('admin.users.auditTitle') }}</h2>
            <p class="mt-1 text-xs text-slate-500">{{ $t('admin.users.auditHint') }}</p>
          </div>
          <button type="button" :disabled="auditLoading" class="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 disabled:opacity-50" @click="loadAuditLogs">
            {{ auditLoading ? $t('admin.users.refreshing') : $t('admin.users.refreshAudit') }}
          </button>
        </div>
        <div v-if="auditLoading && !auditLogs.length" class="p-10 text-center text-sm text-slate-500">{{ $t('admin.users.auditLoading') }}</div>
        <div v-else-if="!auditLogs.length" class="p-10 text-center text-sm text-slate-500">{{ $t('admin.users.auditEmpty') }}</div>
        <div v-else class="divide-y divide-slate-100">
          <article v-for="log in auditLogs" :key="log.id" class="grid gap-2 px-5 py-4 md:grid-cols-[180px_minmax(0,1fr)_180px] md:items-center">
            <div>
              <p class="text-sm font-black text-slate-700">{{ log.actorName }}</p>
              <p class="mt-0.5 truncate text-[11px] text-slate-400">{{ log.actorEmail }}</p>
            </div>
            <p class="text-sm text-slate-600">{{ log.summary }}</p>
            <time class="text-xs text-slate-400 md:text-right" :datetime="log.createdAt">{{ formatAuditDate(log.createdAt) }}</time>
          </article>
        </div>
      </section>
    </div>

    <div v-if="showCreate" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4" @click.self="showCreate = false">
      <form class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" @submit.prevent="createUser">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-black text-slate-900">{{ $t('admin.users.createAdmin') }}</h2>
          <button type="button" class="text-slate-400 hover:text-slate-700" :aria-label="$t('admin.common.close')" @click="showCreate = false"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div class="mt-5 grid gap-4 sm:grid-cols-2">
          <label class="text-xs font-bold text-slate-600">{{ $t('admin.users.name') }}<input v-model.trim="createForm.name" required maxlength="100" class="field" /></label>
          <label class="text-xs font-bold text-slate-600">{{ $t('admin.users.email') }}<input v-model.trim="createForm.email" type="email" required class="field" /></label>
          <label class="text-xs font-bold text-slate-600">{{ $t('admin.users.initialPassword') }}<input v-model="createForm.password" type="password" minlength="10" maxlength="128" required class="field" /></label>
          <label class="text-xs font-bold text-slate-600">{{ $t('admin.users.role') }}
            <select v-model="createForm.role" class="field">
              <option v-for="option in roleOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </label>
        </div>
        <p class="mt-4 rounded-xl bg-indigo-50 p-3 text-xs leading-5 text-indigo-700">{{ roleDescription(createForm.role) }}</p>
        <div class="mt-6 flex justify-end gap-3">
          <button type="button" class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600" @click="showCreate = false">{{ $t('admin.common.cancel') }}</button>
          <button type="submit" :disabled="creating" class="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-black text-white disabled:opacity-50">{{ creating ? $t('admin.users.creating') : $t('admin.users.createAccount') }}</button>
        </div>
      </form>
    </div>

    <div v-if="resetTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4" @click.self="resetTarget = null">
      <form class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" @submit.prevent="resetPassword">
        <h2 class="text-xl font-black text-slate-900">{{ $t('admin.users.resetLoginPassword') }}</h2>
        <p class="mt-2 text-sm text-slate-500">{{ $t('admin.users.resetFor', { name: resetTarget.name, email: resetTarget.email }) }}</p>
        <label class="mt-5 block text-xs font-bold text-slate-600">{{ $t('admin.users.newPassword') }}
          <input v-model="resetValue" type="password" minlength="10" maxlength="128" required autocomplete="new-password" class="field" />
        </label>
        <div class="mt-6 flex justify-end gap-3">
          <button type="button" class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600" @click="resetTarget = null">{{ $t('admin.common.cancel') }}</button>
          <button type="submit" :disabled="resetting" class="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-black text-white disabled:opacity-50">{{ resetting ? $t('admin.users.resetting') : $t('admin.users.confirmReset') }}</button>
        </div>
      </form>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import AdminNav from '@/components/admin/AdminNav.vue'
import {
  changeAdminPassword,
  createAdminUser,
  getAdminAuditLogs,
  getAdminUsers,
  resetAdminPassword,
  updateAdminUser,
  type AdminRole,
  type AdminAuditLog,
  type AdminUserRecord,
} from '@/api/admin'
import { useAdminAuth } from '@/composables/useAdminAuth'
import { useI18n } from 'vue-i18n'

type UserDraft = { name: string; role: AdminRole; isActive: boolean }

const { admin } = useAdminAuth()
const { t, locale } = useI18n()
const users = ref<AdminUserRecord[]>([])
const auditLogs = ref<AdminAuditLog[]>([])
const drafts = reactive<Record<string, UserDraft>>({})
const loading = ref(false)
const auditLoading = ref(false)
const savingId = ref('')
const notice = ref('')
const noticeKind = ref<'success' | 'error'>('success')
const showCreate = ref(false)
const creating = ref(false)
const changingPassword = ref(false)
const resetting = ref(false)
const resetTarget = ref<AdminUserRecord | null>(null)
const resetValue = ref('')
const createForm = reactive({ name: '', email: '', password: '', role: 'CONTENT_MANAGER' as AdminRole })
const passwordForm = reactive({ current: '', next: '', confirm: '' })

const roleOptions = computed<Array<{ value: AdminRole; label: string }>>(() => [
  { value: 'SUPER_ADMIN', label: t('admin.roles.superAdmin') },
  { value: 'CONTENT_MANAGER', label: t('admin.roles.contentManager') },
  { value: 'POLICY_EDITOR', label: t('admin.roles.policyEditor') },
  { value: 'ANALYST', label: t('admin.roles.analyst') },
])

function syncDraft(user: AdminUserRecord) {
  drafts[user.id] = { name: user.name, role: user.role, isActive: user.isActive }
}

async function load() {
  loading.value = true
  try {
    users.value = await getAdminUsers()
    users.value.forEach(syncDraft)
  } catch (error) {
    showNotice(error instanceof Error ? error.message : t('admin.users.loadFailed'), 'error')
  } finally {
    loading.value = false
  }
}

async function loadAuditLogs() {
  auditLoading.value = true
  try {
    auditLogs.value = await getAdminAuditLogs()
  } catch (error) {
    showNotice(error instanceof Error ? error.message : t('admin.users.auditLoadFailed'), 'error')
  } finally {
    auditLoading.value = false
  }
}

function hasChanges(user: AdminUserRecord) {
  const draft = drafts[user.id]
  return Boolean(draft && (draft.name !== user.name || draft.role !== user.role || draft.isActive !== user.isActive))
}

async function saveUser(user: AdminUserRecord) {
  const draft = drafts[user.id]
  if (!draft || !hasChanges(user)) return
  savingId.value = user.id
  try {
    const updated = await updateAdminUser(user.id, draft)
    users.value = users.value.map((item) => item.id === updated.id ? updated : item)
    syncDraft(updated)
    showNotice(t('admin.users.accountSaved', { name: updated.name }))
  } catch (error) {
    syncDraft(user)
    showNotice(error instanceof Error ? error.message : t('admin.users.accountSaveFailed'), 'error')
  } finally {
    savingId.value = ''
  }
}

async function createUser() {
  creating.value = true
  try {
    const created = await createAdminUser(createForm)
    users.value.push(created)
    syncDraft(created)
    Object.assign(createForm, { name: '', email: '', password: '', role: 'CONTENT_MANAGER' as AdminRole })
    showCreate.value = false
    showNotice(t('admin.users.adminCreated', { name: created.name }))
  } catch (error) {
    showNotice(error instanceof Error ? error.message : t('admin.users.createFailed'), 'error')
  } finally {
    creating.value = false
  }
}

function openReset(user: AdminUserRecord) {
  resetTarget.value = user
  resetValue.value = ''
}

async function resetPassword() {
  if (!resetTarget.value) return
  resetting.value = true
  try {
    await resetAdminPassword(resetTarget.value.id, resetValue.value)
    showNotice(t('admin.users.passwordReset', { name: resetTarget.value.name }))
    resetTarget.value = null
    resetValue.value = ''
  } catch (error) {
    showNotice(error instanceof Error ? error.message : t('admin.users.resetFailed'), 'error')
  } finally {
    resetting.value = false
  }
}

async function changePassword() {
  if (passwordForm.next !== passwordForm.confirm) {
    showNotice(t('admin.users.passwordMismatch'), 'error')
    return
  }
  changingPassword.value = true
  try {
    await changeAdminPassword({ currentPassword: passwordForm.current, newPassword: passwordForm.next })
    Object.assign(passwordForm, { current: '', next: '', confirm: '' })
    showNotice(t('admin.users.passwordUpdated'))
  } catch (error) {
    showNotice(error instanceof Error ? error.message : t('admin.users.changeFailed'), 'error')
  } finally {
    changingPassword.value = false
  }
}

function roleDescription(role: AdminRole) {
  return {
    SUPER_ADMIN: t('admin.users.roleSuperDescription'),
    CONTENT_MANAGER: t('admin.users.roleContentDescription'),
    POLICY_EDITOR: t('admin.users.rolePolicyDescription'),
    ANALYST: t('admin.users.roleAnalystDescription'),
  }[role]
}

function showNotice(message: string, kind: 'success' | 'error' = 'success') {
  notice.value = message
  noticeKind.value = kind
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(locale.value === 'ru' ? 'ru-RU' : locale.value === 'en' ? 'en-US' : 'zh-CN')
}

function formatAuditDate(value: string) {
  return new Date(value).toLocaleString(locale.value === 'ru' ? 'ru-RU' : locale.value === 'en' ? 'en-US' : 'zh-CN')
}

onMounted(() => {
  void Promise.allSettled([load(), loadAuditLogs()])
})
</script>

<style scoped>
.field {
  margin-top: 0.5rem;
  display: block;
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 0.75rem 0.875rem;
  font-size: 0.875rem;
  outline: none;
}
.field:focus { border-color: #6366f1; box-shadow: 0 0 0 4px #eef2ff; }
</style>
