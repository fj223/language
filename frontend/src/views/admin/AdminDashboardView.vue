<template>
  <main class="admin-page">
    <div class="admin-shell">
      <AdminNav />

      <section v-if="deniedPermission" class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="alert">
        {{ $t('admin.dashboard.denied', { page: permissionLabel }) }}
      </section>

      <section class="admin-page-header">
        <div>
          <h1 class="text-2xl font-bold">{{ $t('admin.dashboard.title') }}</h1>
          <p class="text-sm text-slate-600 mt-1">{{ $t('admin.dashboard.subtitle') }}</p>
        </div>
        <div class="flex gap-2">
          <button
            v-if="canWrite"
            class="admin-button-primary"
            type="button"
            @click="openCreateDrawer"
          >
            {{ $t('admin.dashboard.createCourse') }}
          </button>
        </div>
      </section>

      <section class="admin-panel flex flex-wrap items-center gap-3 p-4">
        <input
          v-model="searchInput"
          class="border rounded px-3 py-2 text-sm min-w-[280px]"
          :placeholder="$t('admin.dashboard.searchPlaceholder')"
          type="text"
          @keydown.enter="applyFilters"
        />
        <button class="px-3 py-2 rounded border text-sm" type="button" @click="applyFilters">{{ $t('admin.common.search') }}</button>
        <button class="px-3 py-2 rounded border text-sm" type="button" @click="clearFilters">{{ $t('admin.common.clear') }}</button>

        <select v-model="selectedType" class="border rounded px-3 py-2 text-sm">
          <option value="">{{ $t('admin.dashboard.allResourceTypes') }}</option>
          <option value="local">local</option>
          <option value="youtube">youtube</option>
          <option value="bilibili">bilibili</option>
          <option value="external_link">external_link</option>
        </select>

        <select v-model="selectedArchive" class="border rounded px-3 py-2 text-sm" @change="applyFilters">
          <option value="active">{{ $t('admin.course.archiveActive') }}</option>
          <option value="archived">{{ $t('admin.course.archiveArchived') }}</option>
          <option value="all">{{ $t('admin.course.archiveAll') }}</option>
        </select>

        <select v-model.number="pagination.pageSize" class="border rounded px-3 py-2 text-sm" @change="onPageSizeChange">
          <option :value="10">{{ $t('admin.dashboard.perPage', { count: 10 }) }}</option>
          <option :value="20">{{ $t('admin.dashboard.perPage', { count: 20 }) }}</option>
          <option :value="50">{{ $t('admin.dashboard.perPage', { count: 50 }) }}</option>
        </select>
      </section>

      <section v-if="error" class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
        {{ error }}
      </section>

      <section class="admin-panel p-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-base font-bold text-slate-800">{{ $t('admin.dashboard.integrationTitle') }}</h2>
            <p class="mt-1 text-xs text-slate-500">{{ $t('admin.dashboard.integrationHint') }}</p>
          </div>
          <button
            type="button"
            class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:opacity-50"
            :disabled="integrationLoading"
            @click="loadIntegrationStatus"
          >
            {{ integrationLoading ? $t('admin.common.checking') : $t('admin.dashboard.refreshStatus') }}
          </button>
        </div>

        <p v-if="integrationError" class="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700" role="alert">
          {{ integrationError }}
        </p>
        <div v-else-if="integrationStatus" class="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <article class="rounded-lg bg-indigo-50 p-3">
            <p class="text-xs text-indigo-600">{{ $t('admin.dashboard.dataSource') }}</p>
            <p class="mt-1 text-lg font-black text-indigo-700">{{ integrationStatus.provider === 'mock' ? $t('admin.dashboard.demoData') : $t('admin.dashboard.externalData') }}</p>
            <p class="mt-1 text-[11px] text-indigo-500">{{ integrationStatus.provider }}</p>
          </article>
          <article class="rounded-lg p-3" :class="integrationStatus.configured ? 'bg-emerald-50' : 'bg-rose-50'">
            <p class="text-xs" :class="integrationStatus.configured ? 'text-emerald-600' : 'text-rose-600'">{{ $t('admin.dashboard.configStatus') }}</p>
            <p class="mt-1 text-lg font-black" :class="integrationStatus.configured ? 'text-emerald-700' : 'text-rose-700'">
              {{ integrationStatus.configured ? $t('admin.dashboard.available') : $t('admin.dashboard.notConfigured') }}
            </p>
            <p class="mt-1 text-[11px] text-slate-500">{{ $t('admin.dashboard.checkedAt', { time: formatDate(integrationStatus.checkedAt) }) }}</p>
          </article>
          <article class="rounded-lg bg-sky-50 p-3">
            <p class="text-xs text-sky-600">{{ $t('admin.dashboard.externalRequests') }}</p>
            <p class="mt-1 text-lg font-black text-sky-700">
              {{ $t('admin.dashboard.requestResult', { success: integrationStatus.telemetry.successCount, failure: integrationStatus.telemetry.failureCount }) }}
            </p>
            <p class="mt-1 text-[11px] text-sky-500">
              {{ $t('admin.dashboard.requestStats', { total: integrationStatus.telemetry.requestCount, retries: integrationStatus.telemetry.retryCount }) }}
            </p>
          </article>
          <article class="rounded-lg bg-amber-50 p-3">
            <p class="text-xs text-amber-600">{{ $t('admin.dashboard.courseCache') }}</p>
            <p class="mt-1 text-lg font-black text-amber-700">{{ cacheStateLabel(integrationStatus.courseCache.state) }}</p>
            <p class="mt-1 text-[11px] text-amber-600">
              {{ $t('admin.dashboard.cacheItems', { count: integrationStatus.courseCache.itemCount }) }}<span v-if="integrationStatus.telemetry.lastLatencyMs !== null"> · {{ integrationStatus.telemetry.lastLatencyMs }} ms</span>
            </p>
          </article>
        </div>
        <p
          v-if="integrationStatus?.telemetry.lastError"
          class="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
        >
          {{ $t('admin.dashboard.lastFailure', { error: integrationStatus.telemetry.lastError, time: formatDate(integrationStatus.telemetry.lastFailureAt) }) }}
        </p>
      </section>

      <section v-if="feedbackSummary" class="admin-panel p-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-base font-bold text-slate-800">{{ $t('admin.dashboard.feedbackTitle') }}</h2>
            <p class="mt-1 text-xs text-slate-500">{{ $t('admin.dashboard.feedbackHint', { days: feedbackSummary.windowDays }) }}</p>
          </div>
          <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {{ $t('admin.dashboard.lifetimeFeedback', { count: feedbackSummary.lifetimeTotal }) }}
          </span>
        </div>
        <div class="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <article class="rounded-lg bg-indigo-50 p-3">
            <p class="text-xs text-indigo-600">{{ $t('admin.dashboard.recentFeedback') }}</p>
            <p class="mt-1 text-2xl font-black text-indigo-700">{{ feedbackSummary.total }}</p>
          </article>
          <article class="rounded-lg bg-emerald-50 p-3">
            <p class="text-xs text-emerald-600">{{ $t('admin.dashboard.helpfulRate') }}</p>
            <p class="mt-1 text-2xl font-black text-emerald-700">{{ feedbackSummary.helpfulRate ?? '—' }}{{ feedbackSummary.helpfulRate === null ? '' : '%' }}</p>
          </article>
          <article class="rounded-lg bg-sky-50 p-3">
            <p class="text-xs text-sky-600">{{ $t('admin.dashboard.helpful') }}</p>
            <p class="mt-1 text-2xl font-black text-sky-700">{{ feedbackSummary.helpful }}</p>
          </article>
          <article class="rounded-lg bg-rose-50 p-3">
            <p class="text-xs text-rose-600">{{ $t('admin.dashboard.needsImprovement') }}</p>
            <p class="mt-1 text-2xl font-black text-rose-700">{{ feedbackSummary.unhelpful }}</p>
          </article>
        </div>
        <div v-if="feedbackSummary.byIntent.length" class="mt-4 flex flex-wrap gap-2">
          <span
            v-for="item in feedbackSummary.byIntent"
            :key="item.intent"
            class="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600"
          >
            {{ item.intent }} · {{ item.total }} · {{ item.helpfulRate ?? '—' }}{{ item.helpfulRate === null ? '' : '%' }}
          </span>
        </div>
      </section>

      <section class="admin-panel overflow-x-auto">
        <table class="w-full min-w-[675px] text-left">
          <thead class="bg-slate-50 text-xs text-slate-500 uppercase">
            <tr>
              <th class="px-4 py-3">{{ $t('admin.dashboard.cover') }}</th>
              <th class="px-4 py-3">{{ $t('admin.dashboard.courseInfo') }}</th>
              <th class="px-4 py-3">{{ $t('admin.dashboard.resourceCount') }}</th>
              <th class="px-4 py-3">{{ $t('admin.dashboard.updatedAt') }}</th>
              <th class="px-4 py-3 text-right">{{ $t('admin.common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td class="px-4 py-8 text-sm text-slate-500" colspan="5">{{ $t('admin.common.loading') }}</td>
            </tr>
            <tr v-else-if="courses.length === 0">
              <td class="px-4 py-8 text-sm text-slate-500" colspan="5">{{ $t('admin.dashboard.noCourses') }}</td>
            </tr>
            <tr v-for="c in courses" :key="c.id" class="border-t" :class="c.isArchived ? 'bg-slate-50/80 text-slate-500' : ''">
              <td class="px-4 py-3">
                <div class="w-20 h-12 rounded bg-slate-100 overflow-hidden">
                  <img v-if="c.coverUrl" :src="c.coverUrl" alt="cover" class="w-full h-full object-cover" />
                </div>
              </td>
              <td class="px-4 py-3">
                <router-link v-if="c.editable && !c.isArchived" class="font-semibold text-primary hover:underline" :to="`/admin/courses/${c.id}/edit`">
                  {{ c.title }}
                </router-link>
                <span v-else class="font-semibold text-slate-800">{{ c.title }}</span>
                <p class="mt-1 text-xs text-slate-500 line-clamp-1">{{ c.language }} · {{ c.level || $t('courseList.levelPending') }} · {{ c.teacher || $t('courseList.teacherPending') }}</p>
                <div class="mt-1 flex flex-wrap gap-1.5">
                  <span class="inline-flex rounded-full px-2 py-0.5 text-[10px] font-black" :class="sourceBadge(c.catalogSource).className">
                    {{ sourceBadge(c.catalogSource).label }}
                  </span>
                  <span class="inline-flex rounded-full px-2 py-0.5 text-[10px] font-black" :class="c.isArchived ? 'bg-slate-800 text-white' : c.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'">
                    {{ c.isArchived ? $t('admin.course.archived') : c.isPublished ? $t('admin.course.visibleToStudents') : $t('admin.course.draft') }}
                  </span>
                </div>
              </td>
              <td class="px-4 py-3 text-sm">{{ c.resources.length }}</td>
              <td class="px-4 py-3 text-sm">{{ formatDate(c.updatedAt) }}</td>
              <td class="px-4 py-3">
                <div class="flex justify-end gap-2">
                  <router-link
                    v-if="canWrite && c.editable && !c.isArchived"
                    class="px-3 py-1.5 rounded border border-primary/30 bg-primary-container text-xs font-bold text-primary"
                    :to="`/admin/courses/${c.id}/edit`"
                  >
                    {{ $t('admin.common.edit') }}
                  </router-link>
                  <router-link v-if="!c.isArchived && c.isPublished" class="px-3 py-1.5 rounded border text-xs" :to="`/courses/${c.id}`">{{ $t('admin.common.preview') }}</router-link>
                  <span
                    v-else-if="!c.isArchived"
                    class="cursor-not-allowed rounded border border-dashed border-slate-300 bg-slate-50 px-3 py-1.5 text-xs text-slate-400"
                    :title="$t('admin.course.previewAfterPublishHint')"
                  >
                    {{ $t('admin.course.previewAfterPublish') }}
                  </span>
                  <button
                    v-if="canWrite && c.catalogSource === 'demo'"
                    class="px-3 py-1.5 rounded border border-primary/30 bg-primary-container text-xs font-bold text-primary disabled:opacity-50"
                    type="button"
                    :disabled="importingId === c.id"
                    @click="onImport(c.id)"
                  >
                    {{ importingId === c.id ? $t('admin.course.importing') : $t('admin.course.importDemo') }}
                  </button>
                  <button v-if="canWrite && c.editable && !c.isArchived" class="px-3 py-1.5 rounded border border-amber-300 text-xs font-bold text-amber-700" type="button" :disabled="archivingId === c.id" @click="onArchive(c.id)">{{ archivingId === c.id ? $t('admin.course.archiving') : $t('admin.course.archive') }}</button>
                  <button v-if="canWrite && c.editable && c.isArchived" class="px-3 py-1.5 rounded border border-emerald-300 text-xs font-bold text-emerald-700" type="button" :disabled="restoringId === c.id" @click="onRestore(c.id)">{{ restoringId === c.id ? $t('admin.course.restoring') : $t('admin.course.restore') }}</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="flex items-center justify-between text-sm text-slate-600">
        <div>{{ $t('admin.dashboard.pagination', { total: pagination.total, pages: pagination.totalPages, page: pagination.page }) }}</div>
        <div class="flex items-center gap-2">
          <button class="px-3 py-1.5 rounded border" type="button" :disabled="pagination.page <= 1" @click="changePage(pagination.page - 1)">
            {{ $t('admin.common.previous') }}
          </button>
          <button class="px-3 py-1.5 rounded border" type="button" :disabled="pagination.page >= pagination.totalPages" @click="changePage(pagination.page + 1)">
            {{ $t('admin.common.next') }}
          </button>
        </div>
      </section>

      <div v-if="isDrawerOpen" class="fixed inset-0 z-50 bg-black/20 flex justify-end">
        <div class="w-full max-w-lg h-full bg-white flex flex-col">
          <div class="p-5 border-b flex items-center justify-between">
            <h3 class="font-semibold">{{ $t('admin.dashboard.createCourse') }}</h3>
            <button type="button" class="text-sm" @click="isDrawerOpen = false">{{ $t('admin.common.close') }}</button>
          </div>
          <div class="p-5 flex-1 overflow-y-auto">
            <form class="space-y-4" @submit.prevent="onSubmit">
              <div>
                <label class="text-xs text-slate-500">{{ $t('admin.course.titleZh') }}</label>
                <input v-model="form.title" class="mt-1 w-full border rounded px-3 py-2 text-sm" type="text" />
                <p v-if="formErrors.title" class="text-xs text-red-600 mt-1">{{ formErrors.title }}</p>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <label class="text-xs text-slate-500">{{ $t('admin.course.language') }} *
                  <input v-model="form.language" required maxlength="50" class="mt-1 w-full border rounded px-3 py-2 text-sm" type="text" />
                  <span v-if="formErrors.language" class="mt-1 block text-xs text-red-600">{{ formErrors.language }}</span>
                </label>
                <label class="text-xs text-slate-500">{{ $t('admin.course.level') }}
                  <input v-model="form.level" maxlength="20" class="mt-1 w-full border rounded px-3 py-2 text-sm" type="text" :placeholder="$t('admin.course.levelPlaceholder')" />
                </label>
                <label class="text-xs text-slate-500">{{ $t('admin.course.teacherZh') }}
                  <input v-model="form.teacher" maxlength="100" class="mt-1 w-full border rounded px-3 py-2 text-sm" type="text" />
                </label>
                <label class="text-xs text-slate-500">{{ $t('admin.course.scheduleZh') }}
                  <input v-model="form.schedule" maxlength="200" class="mt-1 w-full border rounded px-3 py-2 text-sm" type="text" />
                </label>
              </div>
              <div>
                <label class="text-xs text-slate-500">{{ $t('admin.course.coverUrl') }}</label>
                <input v-model="form.coverUrl" class="mt-1 w-full border rounded px-3 py-2 text-sm" type="text" />
              </div>
              <div>
                <label class="text-xs text-slate-500">{{ $t('admin.course.descriptionZh') }}</label>
                <textarea v-model="form.description" class="mt-1 w-full border rounded px-3 py-2 text-sm" rows="4"></textarea>
              </div>
              <label class="flex items-center gap-2 text-sm font-bold text-slate-600">
                <input v-model="form.isPublished" type="checkbox" class="h-4 w-4 accent-primary" />
                {{ $t('admin.course.publishAfterCreate') }}
              </label>
              <div class="space-y-3 rounded-xl border border-slate-200 p-4">
                <p class="text-sm font-black text-slate-700">{{ $t('admin.course.localizedContent') }}</p>
                <div v-for="item in translationLocales" :key="item.code" class="space-y-3 rounded-lg bg-slate-50 p-3">
                  <p class="text-xs font-black text-slate-600">{{ item.label }}</p>
                  <input v-model="form.translations[item.code].title" maxlength="200" class="w-full border rounded px-3 py-2 text-sm" type="text" :placeholder="$t('admin.course.localizedTitle')" />
                  <input v-model="form.translations[item.code].teacher" maxlength="100" class="w-full border rounded px-3 py-2 text-sm" type="text" :placeholder="$t('admin.course.localizedTeacher')" />
                  <input v-model="form.translations[item.code].schedule" maxlength="200" class="w-full border rounded px-3 py-2 text-sm" type="text" :placeholder="$t('admin.course.localizedSchedule')" />
                  <textarea v-model="form.translations[item.code].description" class="w-full border rounded px-3 py-2 text-sm" rows="2" :placeholder="$t('admin.course.localizedDescription')"></textarea>
                </div>
              </div>
              <div>
                <label class="text-xs text-slate-500">{{ $t('admin.course.resourceType') }}</label>
                <select v-model="form.resource_type" class="mt-1 w-full border rounded px-3 py-2 text-sm">
                  <option value="local">local</option>
                  <option value="youtube">youtube</option>
                  <option value="bilibili">bilibili</option>
                  <option value="external_link">external_link</option>
                </select>
              </div>
              <div>
                <label class="text-xs text-slate-500">{{ $t('admin.course.sourceUrl') }}</label>
                <input v-model="form.source_url" class="mt-1 w-full border rounded px-3 py-2 text-sm" type="text" :placeholder="$t('admin.course.sourcePlaceholder')" />
                <p class="mt-1 text-xs leading-5 text-slate-400">{{ resourceSourceHint }}</p>
                <p v-if="formErrors.source_url" class="text-xs text-red-600 mt-1">{{ formErrors.source_url }}</p>
              </div>
            </form>
          </div>
          <div class="p-5 border-t flex gap-2">
            <button class="flex-1 px-3 py-2 rounded bg-primary text-on-primary text-sm" type="button" :disabled="submitting" @click="onSubmit">
              {{ submitting ? $t('admin.common.saving') : $t('admin.common.save') }}
            </button>
            <button class="px-3 py-2 rounded border text-sm" type="button" @click="isDrawerOpen = false">{{ $t('admin.common.cancel') }}</button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { archiveCourse, createCourse, getCourses, importDemoCourse, restoreCourse, type CourseDto, type VideoResourceType } from '@/api/course'
import { getAdminIntegrationStatus } from '@/api/admin'
import type { IntegrationStatus } from '@/api/gateway'
import { http } from '@/api/http'
import { useAdminAuth } from '@/composables/useAdminAuth'
import AdminNav from '@/components/admin/AdminNav.vue'
import { useI18n } from 'vue-i18n'
import { confirmAction } from '@/utils/confirmAction'

type FeedbackSummary = {
  windowDays: number
  lifetimeTotal: number
  total: number
  helpful: number
  unhelpful: number
  helpfulRate: number | null
  byIntent: Array<{
    intent: string
    total: number
    helpful: number
    helpfulRate: number | null
  }>
}

const isDrawerOpen = ref(false)
const loading = ref(false)
const error = ref('')
const courses = ref<CourseDto[]>([])
const submitting = ref(false)
const archivingId = ref('')
const restoringId = ref('')
const importingId = ref('')
const searchInput = ref('')
const selectedType = ref('' as '' | VideoResourceType)
const selectedArchive = ref<'active' | 'archived' | 'all'>('active')
const feedbackSummary = ref<FeedbackSummary | null>(null)
const integrationStatus = ref<IntegrationStatus | null>(null)
const integrationLoading = ref(false)
const integrationError = ref('')
const route = useRoute()
const router = useRouter()
const { can } = useAdminAuth()
const { t, locale } = useI18n()
const canWrite = computed(() => can('course.write'))
const resourceSourceHint = computed(() => t(`admin.course.sourceHint.${form.resource_type}`))
const translationLocales = [
  { code: 'en' as const, label: 'English' },
  { code: 'ru' as const, label: 'Русский' },
]
const deniedPermission = computed(() => typeof route.query.denied === 'string' ? route.query.denied : '')
const permissionLabel = computed(() => ({
  'course.write': t('admin.nav.courses'),
  'enrollment.read': t('admin.nav.enrollments'),
  'policy.read': t('admin.nav.policies'),
  'admin.manage': t('admin.nav.users'),
}[deniedPermission.value] ?? t('admin.common.thisPage')))

const pagination = reactive({
  page: 1,
  pageSize: 10 as 10 | 20 | 50,
  total: 0,
  totalPages: 1,
})

const form = reactive({
  title: '',
  language: '英语',
  level: '',
  teacher: '',
  schedule: '',
  coverUrl: '',
  description: '',
  translations: {
    en: { title: '', teacher: '', schedule: '', description: '' },
    ru: { title: '', teacher: '', schedule: '', description: '' },
  },
  isPublished: true,
  resource_type: 'local' as VideoResourceType,
  source_url: '',
})

const formErrors = reactive({
  title: '',
  language: '',
  source_url: '',
})

function resetForm() {
  form.title = ''
  form.language = '英语'
  form.level = ''
  form.teacher = ''
  form.schedule = ''
  form.coverUrl = ''
  form.description = ''
  for (const { code } of translationLocales) {
    form.translations[code].title = ''
    form.translations[code].teacher = ''
    form.translations[code].schedule = ''
    form.translations[code].description = ''
  }
  form.isPublished = true
  form.resource_type = 'local'
  form.source_url = ''
  formErrors.title = ''
  formErrors.language = ''
  formErrors.source_url = ''
}

function openCreateDrawer() {
  resetForm()
  isDrawerOpen.value = true
}

function validateForm() {
  formErrors.title = ''
  formErrors.language = ''
  formErrors.source_url = ''

  const title = form.title.trim()
  if (!title) formErrors.title = t('admin.course.titleRequired')
  if (!form.language.trim()) formErrors.language = t('admin.course.languageRequired')

  const source = form.source_url.trim()
  if (!source) {
    formErrors.source_url = t('admin.course.sourceRequired')
  } else if (form.resource_type === 'external_link') {
    try {
      const u = new URL(source)
      if (u.protocol !== 'http:' && u.protocol !== 'https:') formErrors.source_url = t('admin.course.httpRequired')
    } catch {
      formErrors.source_url = t('admin.course.invalidUrl')
    }
  } else if (form.resource_type === 'youtube') {
    const isId = /^[a-zA-Z0-9_-]{6,}$/.test(source)
    const isUrl = /^https?:\/\//.test(source)
    if (!isId && !isUrl) formErrors.source_url = t('admin.course.youtubeRequired')
  } else if (form.resource_type === 'bilibili') {
    const isBv = /^BV[0-9A-Za-z]{10,}$/.test(source)
    const isUrl = /^https?:\/\//.test(source)
    if (!isBv && !isUrl) formErrors.source_url = t('admin.course.bilibiliRequired')
  }

  return !formErrors.title && !formErrors.language && !formErrors.source_url
}

async function refresh() {
  error.value = ''
  loading.value = true
  try {
    const data = await getCourses({
      q: searchInput.value.trim() || undefined,
      resource_type: selectedType.value || undefined,
      archive_status: selectedArchive.value,
      locale: locale.value,
      page: pagination.page,
      pageSize: pagination.pageSize,
    })
    courses.value = data.items
    pagination.page = data.pagination.page
    pagination.pageSize = data.pagination.pageSize as 10 | 20 | 50
    pagination.total = data.pagination.total
    pagination.totalPages = data.pagination.totalPages
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('admin.course.loadFailed')
  } finally {
    loading.value = false
  }
}

async function loadFeedbackSummary() {
  try {
    const response = await http.get<{ ok: true; data: FeedbackSummary }>('/api/admin/chatbot/feedback-summary')
    feedbackSummary.value = response.data.data
  } catch {
    feedbackSummary.value = null
  }
}

function sourceBadge(source: CourseDto['catalogSource']) {
  return {
    managed: { label: t('admin.course.sourceManaged'), className: 'bg-indigo-50 text-indigo-700' },
    demo: { label: t('admin.course.sourceDemo'), className: 'bg-amber-50 text-amber-700' },
    external: { label: t('admin.course.sourceExternal'), className: 'bg-sky-50 text-sky-700' },
  }[source ?? 'managed']
}

async function loadIntegrationStatus() {
  if (integrationLoading.value) return
  integrationLoading.value = true
  integrationError.value = ''
  try {
    integrationStatus.value = await getAdminIntegrationStatus()
  } catch (e) {
    integrationStatus.value = null
    integrationError.value = e instanceof Error ? e.message : t('admin.dashboard.integrationFailed')
  } finally {
    integrationLoading.value = false
  }
}

function cacheStateLabel(state: IntegrationStatus['courseCache']['state']) {
  return {
    empty: t('admin.dashboard.cacheEmpty'),
    fresh: t('admin.dashboard.cacheFresh'),
    stale: t('admin.dashboard.cacheStale'),
    expired: t('admin.dashboard.cacheExpired'),
  }[state]
}

function formatDate(s: string | null | undefined) {
  if (!s) return '-'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString(locale.value === 'ru' ? 'ru-RU' : locale.value === 'en' ? 'en-US' : 'zh-CN')
}

function applyFilters() {
  pagination.page = 1
  refresh()
}

function clearFilters() {
  searchInput.value = ''
  selectedType.value = ''
  selectedArchive.value = 'active'
  pagination.page = 1
  refresh()
}

function changePage(nextPage: number) {
  pagination.page = nextPage
  refresh()
}

function onPageSizeChange() {
  pagination.page = 1
  refresh()
}

async function onSubmit() {
  if (submitting.value) return
  if (!validateForm()) return

  submitting.value = true
  try {
    await createCourse({
      title: form.title.trim(),
      language: form.language.trim(),
      level: form.level.trim() || undefined,
      teacher: form.teacher.trim() || undefined,
      schedule: form.schedule.trim() || undefined,
      coverUrl: form.coverUrl.trim() || undefined,
      description: form.description.trim() || undefined,
      translations: {
        en: {
          title: form.translations.en.title.trim() || undefined,
          teacher: form.translations.en.teacher.trim() || undefined,
          schedule: form.translations.en.schedule.trim() || undefined,
          description: form.translations.en.description.trim() || undefined,
        },
        ru: {
          title: form.translations.ru.title.trim() || undefined,
          teacher: form.translations.ru.teacher.trim() || undefined,
          schedule: form.translations.ru.schedule.trim() || undefined,
          description: form.translations.ru.description.trim() || undefined,
        },
      },
      isPublished: form.isPublished,
      resources: [
        {
          resource_type: form.resource_type,
          source_url: form.source_url.trim(),
          sortOrder: 0,
        },
      ],
    })
    pagination.page = 1
    await refresh()
    isDrawerOpen.value = false
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('admin.course.createFailed')
  } finally {
    submitting.value = false
  }
}

async function onArchive(courseId: string) {
  if (archivingId.value) return
  const ok = await confirmAction(t('admin.course.archiveConfirm'), {
    title: t('admin.common.confirm'),
    confirmText: t('admin.course.archive'),
    cancelText: t('admin.common.cancel'),
    danger: false,
  })
  if (!ok) return

  archivingId.value = courseId
  try {
    await archiveCourse(courseId)
    await refresh()
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('admin.course.archiveFailed')
  } finally {
    archivingId.value = ''
  }
}

async function onRestore(courseId: string) {
  if (restoringId.value) return
  restoringId.value = courseId
  try {
    await restoreCourse(courseId)
    await refresh()
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('admin.course.restoreFailed')
  } finally {
    restoringId.value = ''
  }
}

async function onImport(courseId: string) {
  if (importingId.value) return
  const ok = await confirmAction(t('admin.course.importConfirm'), {
    title: t('admin.common.confirm'),
    confirmText: t('admin.common.confirm'),
    cancelText: t('admin.common.cancel'),
  })
  if (!ok) return

  importingId.value = courseId
  error.value = ''
  try {
    const imported = await importDemoCourse(courseId)
    await router.push(`/admin/courses/${imported.id}/edit`)
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('admin.course.importFailed')
  } finally {
    importingId.value = ''
  }
}

watch(
  () => form.resource_type,
  () => {
    form.source_url = ''
    formErrors.source_url = ''
  },
)

watch(locale, () => {
  pagination.page = 1
  void refresh()
})

onMounted(async () => {
  await Promise.allSettled([refresh(), loadFeedbackSummary(), loadIntegrationStatus()])
})

</script>
