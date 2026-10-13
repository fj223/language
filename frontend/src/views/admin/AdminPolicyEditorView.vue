<template>
  <main class="admin-page">
    <div class="admin-shell">
      <AdminNav />
      <div class="admin-page-header">
        <div>
          <p class="text-sm font-bold text-indigo-600">{{ $t('admin.policy.eyebrow') }}</p>
          <h1 class="mt-1 text-3xl font-black text-slate-900">{{ $t('admin.policy.title') }}</h1>
          <p class="mt-2 text-sm text-slate-500">{{ $t('admin.policy.subtitle') }}</p>
        </div>
        <button v-if="canWrite" type="button" class="admin-button-primary" @click="createNew">
          + {{ $t('admin.policy.create') }}
        </button>
      </div>

      <div v-if="notice" class="mb-5 rounded-xl border px-4 py-3 text-sm" :class="noticeKind === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'" role="status">
        {{ notice }}
      </div>

      <div class="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <section class="admin-panel p-3">
          <div v-if="loading" class="p-8 text-center text-sm text-slate-500">{{ $t('admin.policy.loading') }}</div>
          <div v-else-if="!policies.length" class="p-8 text-center">
            <span class="material-symbols-outlined text-4xl text-slate-300">policy</span>
            <p class="mt-2 text-sm font-bold text-slate-600">{{ $t('admin.policy.empty') }}</p>
          </div>
          <button
            v-for="policy in policies"
            :key="policy.id"
            type="button"
            class="mb-2 w-full rounded-xl border p-4 text-left transition last:mb-0"
            :class="selectedId === policy.id ? 'border-indigo-300 bg-indigo-50' : 'border-transparent hover:bg-slate-50'"
            @click="selectPolicy(policy)"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-black text-slate-800">{{ policy.title }}</p>
                <p class="mt-1 text-xs text-slate-500">{{ policy.owner }} · v{{ policy.version }}</p>
              </div>
              <span class="rounded-full px-2 py-1 text-[11px] font-black" :class="policy.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'">
                {{ policy.isPublished ? $t('admin.policy.published') : $t('admin.course.draft') }}
              </span>
            </div>
            <p class="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">{{ policy.summary }}</p>
          </button>
        </section>

        <section class="admin-panel p-6 sm:p-8">
          <div v-if="!selectedId && !creating" class="flex min-h-[460px] flex-col items-center justify-center text-center">
            <span class="material-symbols-outlined text-6xl text-indigo-200">edit_note</span>
            <h2 class="mt-4 text-xl font-black text-slate-700">{{ $t('admin.policy.selectTitle') }}</h2>
            <p class="mt-2 max-w-md text-sm leading-6 text-slate-500">{{ $t('admin.policy.selectHint') }}</p>
          </div>

          <form v-else class="space-y-5" @submit.prevent="save">
            <div class="flex items-center justify-between gap-4">
              <div>
                <h2 class="text-xl font-black text-slate-900">{{ creating ? $t('admin.policy.create') : $t('admin.policy.edit') }}</h2>
                <p v-if="!creating" class="mt-1 text-xs text-slate-400">{{ $t('admin.policy.lastUpdated', { time: formatDate(selected?.updatedAt) }) }}</p>
              </div>
              <label class="flex cursor-pointer items-center gap-2 text-sm font-bold text-slate-600">
                <input v-model="form.isPublished" type="checkbox" :disabled="!canWrite" class="h-4 w-4 accent-indigo-600" />
                {{ $t('admin.policy.publishToAssistant') }}
              </label>
            </div>

            <div class="grid gap-5 sm:grid-cols-2">
              <label class="text-sm font-bold text-slate-700">{{ $t('admin.policy.id') }}
                <input v-model.trim="form.id" :disabled="!creating || !canWrite" required pattern="[a-z0-9-]{2,64}" class="field" :placeholder="$t('admin.policy.idPlaceholder')" />
              </label>
              <label class="text-sm font-bold text-slate-700">{{ $t('admin.policy.owner') }}
                <input v-model.trim="form.owner" :disabled="!canWrite" required class="field" :placeholder="$t('admin.policy.ownerPlaceholder')" />
              </label>
            </div>
            <label class="text-sm font-bold text-slate-700">{{ $t('admin.policy.policyTitle') }}
              <input v-model.trim="form.title" :disabled="!canWrite" required maxlength="200" class="field" />
            </label>
            <label class="text-sm font-bold text-slate-700">{{ $t('admin.policy.keywords') }}
              <input v-model="keywordText" :disabled="!canWrite" required class="field" :placeholder="$t('admin.policy.keywordsPlaceholder')" />
              <span class="mt-1 block text-xs font-normal text-slate-400">{{ $t('admin.policy.keywordsHint') }}</span>
            </label>
            <label class="text-sm font-bold text-slate-700">{{ $t('admin.policy.summary') }}
              <textarea v-model.trim="form.summary" :disabled="!canWrite" required rows="3" class="field resize-y" />
            </label>
            <label class="text-sm font-bold text-slate-700">{{ $t('admin.policy.guidance') }}
              <textarea v-model.trim="form.guidance" :disabled="!canWrite" required rows="5" class="field resize-y" />
            </label>

            <div class="flex flex-wrap gap-3 border-t border-slate-100 pt-5">
              <button v-if="canWrite" type="submit" :disabled="saving" class="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-black text-white disabled:opacity-50">
                {{ saving ? $t('admin.common.saving') : creating ? $t('admin.policy.createAndSave') : $t('admin.policy.saveVersion') }}
              </button>
              <button v-if="canWrite && !creating && selected?.isPublished" type="button" class="rounded-xl border border-amber-200 px-5 py-3 text-sm font-bold text-amber-700 hover:bg-amber-50" @click="unpublish">
                {{ $t('admin.policy.unpublish') }}
              </button>
              <button type="button" class="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600" @click="cancelEdit">{{ $t('admin.common.cancel') }}</button>
            </div>
          </form>
        </section>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { createPolicy, getPolicies, unpublishPolicy, updatePolicy, type SchoolPolicy } from '@/api/admin'
import { useAdminAuth } from '@/composables/useAdminAuth'
import AdminNav from '@/components/admin/AdminNav.vue'
import { useI18n } from 'vue-i18n'
import { confirmAction } from '@/utils/confirmAction'

const { can } = useAdminAuth()
const { t, locale } = useI18n()
const canWrite = computed(() => can('policy.write'))
const policies = ref<SchoolPolicy[]>([])
const selectedId = ref('')
const creating = ref(false)
const loading = ref(true)
const saving = ref(false)
const notice = ref('')
const noticeKind = ref<'success' | 'error'>('success')
const keywordText = ref('')
const form = reactive({
  id: '',
  title: '',
  keywords: [] as string[],
  summary: '',
  guidance: '',
  owner: '',
  isPublished: true,
})
const selected = computed(() => policies.value.find((policy) => policy.id === selectedId.value))

function fill(policy?: SchoolPolicy) {
  Object.assign(form, policy
    ? { ...policy }
    : { id: '', title: '', keywords: [], summary: '', guidance: '', owner: '', isPublished: true })
  keywordText.value = policy?.keywords.join(', ') ?? ''
}
function selectPolicy(policy: SchoolPolicy) {
  creating.value = false
  selectedId.value = policy.id
  fill(policy)
}
function createNew() {
  creating.value = true
  selectedId.value = ''
  fill()
}
function cancelEdit() {
  if (selected.value) selectPolicy(selected.value)
  else {
    creating.value = false
    fill()
  }
}
async function load() {
  loading.value = true
  try {
    policies.value = await getPolicies()
    if (selectedId.value) {
      const refreshed = policies.value.find((item) => item.id === selectedId.value)
      if (refreshed) selectPolicy(refreshed)
    }
  } catch (error) {
    showNotice(error instanceof Error ? error.message : t('admin.policy.loadFailed'), 'error')
  } finally {
    loading.value = false
  }
}
async function save() {
  if (!canWrite.value) return
  const keywords = keywordText.value.split(/[,，\n]/).map((item) => item.trim()).filter(Boolean)
  if (!keywords.length) {
    showNotice(t('admin.policy.keywordRequired'), 'error')
    return
  }
  saving.value = true
  try {
    const input = { ...form, keywords }
    const saved = creating.value ? await createPolicy(input) : await updatePolicy(form.id, input)
    selectedId.value = saved.id
    creating.value = false
    await load()
    showNotice(t('admin.policy.saved', {
      title: saved.title,
      version: saved.version,
      source: saved.isPublished ? t('admin.policy.thisVersion') : t('admin.policy.previousPublished'),
    }))
  } catch (error) {
    showNotice(error instanceof Error ? error.message : t('admin.policy.saveFailed'), 'error')
  } finally {
    saving.value = false
  }
}
async function unpublish() {
  if (!selected.value) return
  const confirmed = await confirmAction(
    t('admin.policy.unpublishConfirm', { title: selected.value.title }),
    {
      title: t('admin.common.confirm'),
      confirmText: t('admin.policy.unpublish'),
      cancelText: t('admin.common.cancel'),
      danger: true,
    },
  )
  if (!confirmed) return
  await unpublishPolicy(selected.value.id)
  await load()
  showNotice(t('admin.policy.unpublished'))
}
function showNotice(message: string, kind: 'success' | 'error' = 'success') {
  notice.value = message
  noticeKind.value = kind
}
function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString(locale.value === 'ru' ? 'ru-RU' : locale.value === 'en' ? 'en-US' : 'zh-CN') : '—'
}
onMounted(load)
</script>

<style scoped>
.field {
  display: block;
  width: 100%;
  margin-top: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 0.75rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 400;
  outline: none;
  transition: 0.2s;
}
.field:focus { border-color: #6366f1; box-shadow: 0 0 0 4px #eef2ff; }
.field:disabled { background: #f8fafc; color: #64748b; }
</style>
