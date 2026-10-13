<template>
  <main class="admin-page">
    <div class="admin-shell">
      <AdminNav />

      <section class="admin-page-header">
        <div>
          <p class="text-sm font-black text-indigo-600">{{ $t('admin.enrollment.eyebrow') }}</p>
          <h1 class="mt-1 text-3xl font-black text-slate-900">{{ $t('admin.enrollment.title') }}</h1>
          <p class="mt-2 text-sm text-slate-500">{{ $t('admin.enrollment.subtitle') }}</p>
        </div>
        <span v-if="!canWrite" class="rounded-full bg-sky-100 px-4 py-2 text-xs font-black text-sky-700">{{ $t('admin.enrollment.readOnly') }}</span>
      </section>

      <section class="admin-panel flex flex-wrap gap-2 p-3" :aria-label="$t('admin.enrollment.filterLabel')">
        <button v-for="option in filters" :key="option.value" type="button" class="rounded-xl px-4 py-2 text-sm font-bold transition" :class="filter === option.value ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'" @click="selectFilter(option.value)">
          {{ option.label }}
          <span v-if="option.value === 'PENDING' && pendingCount" class="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">{{ pendingCount }}</span>
        </button>
      </section>

      <div v-if="notice" class="rounded-xl border px-4 py-3 text-sm" :class="noticeKind === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'" role="status">
        {{ notice }}
        <button v-if="noticeKind === 'error'" type="button" class="ml-2 font-black underline" @click="load">{{ $t('admin.enrollment.retry') }}</button>
      </div>

      <section v-if="loading" class="rounded-2xl bg-white p-14 text-center text-sm text-slate-500">{{ $t('admin.enrollment.loading') }}</section>
      <section v-else-if="!applications.length" class="rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center">
        <span class="material-symbols-outlined text-5xl text-slate-300">inbox</span>
        <h2 class="mt-3 font-black text-slate-700">{{ $t('admin.enrollment.emptyTitle') }}</h2>
        <p class="mt-1 text-sm text-slate-500">{{ $t('admin.enrollment.emptyHint') }}</p>
      </section>

      <section v-else class="grid gap-5 lg:grid-cols-2">
        <article v-for="item in applications" :key="item.id" class="flex flex-col rounded-2xl bg-white p-5 shadow-sm">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <h2 class="truncate text-lg font-black text-slate-900">{{ item.courseTitle }}</h2>
              <p class="mt-1 text-xs text-slate-500">{{ item.language }} · {{ item.level ?? $t('courseList.levelPending') }} · {{ item.teacher ?? $t('courseList.teacherPending') }}</p>
            </div>
            <span class="shrink-0 rounded-full px-3 py-1 text-xs font-black" :class="statusMeta(item.status).className">{{ statusMeta(item.status).label }}</span>
          </div>

          <dl class="mt-5 grid grid-cols-[72px_minmax(0,1fr)] gap-x-3 gap-y-2 rounded-xl bg-slate-50 p-4 text-xs">
            <dt class="text-slate-400">{{ $t('admin.enrollment.student') }}</dt><dd class="font-bold text-slate-700">{{ item.student.name }}</dd>
            <dt class="text-slate-400">{{ $t('admin.enrollment.email') }}</dt><dd class="break-all text-slate-600">{{ item.student.email }}</dd>
            <dt class="text-slate-400">{{ $t('admin.enrollment.submittedAt') }}</dt><dd class="text-slate-600">{{ formatDate(item.createdAt) }}</dd>
            <dt v-if="item.schedule" class="text-slate-400">{{ $t('admin.enrollment.schedule') }}</dt><dd v-if="item.schedule" class="text-slate-600">{{ item.schedule }}</dd>
          </dl>

          <div v-if="item.studentNote" class="mt-4 rounded-xl border border-slate-100 p-4">
            <p class="text-[11px] font-black uppercase tracking-wider text-slate-400">{{ $t('admin.enrollment.studentNote') }}</p>
            <p class="mt-2 text-sm leading-6 text-slate-600">{{ item.studentNote }}</p>
          </div>

          <div v-if="item.adminNote && item.status !== 'PENDING'" class="mt-4 rounded-xl bg-indigo-50 p-4">
            <p class="text-[11px] font-black uppercase tracking-wider text-indigo-400">{{ $t('admin.enrollment.reviewNote') }}</p>
            <p class="mt-2 text-sm leading-6 text-indigo-700">{{ item.adminNote }}</p>
          </div>

          <div v-if="canWrite && item.status !== 'CANCELLED'" class="mt-auto pt-5">
            <label class="text-xs font-bold text-slate-500">{{ $t('admin.enrollment.reviewNoteOptional') }}
              <textarea v-model.trim="notes[item.id]" rows="2" maxlength="500" class="mt-2 block w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50" :placeholder="$t('admin.enrollment.notePlaceholder')" />
            </label>
            <div class="mt-3 grid grid-cols-2 gap-3">
              <button type="button" :disabled="actionId === item.id || item.status === 'APPROVED'" class="rounded-xl bg-emerald-600 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-35" @click="review(item, 'APPROVED')">
                {{ actionId === item.id ? $t('admin.enrollment.processing') : item.status === 'APPROVED' ? $t('admin.enrollment.approved') : $t('admin.enrollment.approve') }}
              </button>
              <button type="button" :disabled="actionId === item.id || item.status === 'REJECTED'" class="rounded-xl bg-rose-600 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-35" @click="review(item, 'REJECTED')">
                {{ actionId === item.id ? $t('admin.enrollment.processing') : item.status === 'REJECTED' ? $t('admin.enrollment.rejected') : $t('admin.enrollment.reject') }}
              </button>
            </div>
          </div>
          <p v-else-if="item.status === 'CANCELLED'" class="mt-auto pt-5 text-xs font-bold text-slate-400">{{ $t('admin.enrollment.cancelledHint') }}</p>
          <p v-else class="mt-auto pt-5 text-xs font-bold text-sky-700">{{ $t('admin.enrollment.readOnlyHint') }}</p>
        </article>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import AdminNav from '@/components/admin/AdminNav.vue'
import {
  getAdminEnrollments,
  reviewEnrollment,
  type AdminEnrollment,
  type EnrollmentStatus,
} from '@/api/admin'
import { useAdminAuth } from '@/composables/useAdminAuth'
import { useI18n } from 'vue-i18n'
import { confirmAction } from '@/utils/confirmAction'

const { can } = useAdminAuth()
const { t, locale } = useI18n()
const canWrite = computed(() => can('enrollment.write'))
const applications = ref<AdminEnrollment[]>([])
const loading = ref(false)
const filter = ref<'' | EnrollmentStatus>('')
const actionId = ref('')
const notice = ref('')
const noticeKind = ref<'success' | 'error'>('success')
const notes = reactive<Record<string, string>>({})
const pendingCount = computed(() => filter.value === 'PENDING' ? applications.value.length : 0)

const filters = computed<Array<{ value: '' | EnrollmentStatus; label: string }>>(() => [
  { value: '', label: t('admin.enrollment.all') },
  { value: 'PENDING', label: t('admin.enrollment.pending') },
  { value: 'APPROVED', label: t('admin.enrollment.approved') },
  { value: 'REJECTED', label: t('admin.enrollment.rejected') },
  { value: 'CANCELLED', label: t('admin.enrollment.cancelled') },
])

async function load() {
  loading.value = true
  notice.value = ''
  try {
    applications.value = await getAdminEnrollments(filter.value || undefined, locale.value)
    applications.value.forEach((item) => {
      notes[item.id] = item.adminNote ?? ''
    })
  } catch (error) {
    showNotice(error instanceof Error ? error.message : t('admin.enrollment.loadFailed'), 'error')
  } finally {
    loading.value = false
  }
}

function selectFilter(value: '' | EnrollmentStatus) {
  filter.value = value
  void load()
}

async function review(item: AdminEnrollment, status: 'APPROVED' | 'REJECTED') {
  if (actionId.value) return
  const verb = status === 'APPROVED' ? t('admin.enrollment.approve') : t('admin.enrollment.reject')
  const confirmed = await confirmAction(
    t('admin.enrollment.confirmReview', { action: verb, student: item.student.name, course: item.courseTitle }),
    {
      title: t('admin.common.confirm'),
      confirmText: verb,
      cancelText: t('admin.common.cancel'),
      danger: status === 'REJECTED',
    },
  )
  if (!confirmed) return
  actionId.value = item.id
  try {
    await reviewEnrollment(item.id, { status, adminNote: notes[item.id] || undefined })
    await load()
    showNotice(t('admin.enrollment.reviewed', { action: verb }))
  } catch (error) {
    showNotice(error instanceof Error ? error.message : t('admin.enrollment.reviewFailed'), 'error')
  } finally {
    actionId.value = ''
  }
}

function statusMeta(status: EnrollmentStatus) {
  return {
    PENDING: { label: t('admin.enrollment.pending'), className: 'bg-amber-100 text-amber-700' },
    APPROVED: { label: t('admin.enrollment.approved'), className: 'bg-emerald-100 text-emerald-700' },
    REJECTED: { label: t('admin.enrollment.rejected'), className: 'bg-rose-100 text-rose-700' },
    CANCELLED: { label: t('admin.enrollment.cancelled'), className: 'bg-slate-100 text-slate-600' },
  }[status]
}

function showNotice(message: string, kind: 'success' | 'error' = 'success') {
  notice.value = message
  noticeKind.value = kind
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(locale.value === 'ru' ? 'ru-RU' : locale.value === 'en' ? 'en-US' : 'zh-CN')
}

onMounted(load)
watch(locale, () => {
  void load()
})
</script>
