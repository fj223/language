<template>
  <main class="admin-page">
    <div class="admin-shell admin-shell-narrow">
      <AdminNav />

      <!-- Header -->
      <section class="admin-page-header">
        <div>
          <h1 class="text-2xl font-bold">{{ $t('admin.course.editTitle') }}</h1>
          <p v-if="form.title" class="text-sm text-slate-500 mt-0.5">{{ form.title }}</p>
        </div>
        <div class="flex gap-2">
          <router-link class="admin-button-secondary" to="/admin">{{ $t('admin.common.backToList') }}</router-link>
          <router-link class="admin-button-secondary" :to="`/admin/courses/${courseId}/learning`">{{ $t('admin.course.learningLoop') }}</router-link>
          <button class="admin-button-secondary" type="button" :disabled="saving" @click="reload">{{ $t('admin.common.discard') }}</button>
          <button
            v-if="canWrite"
            class="admin-button-primary"
            type="button"
            :disabled="saving"
            @click="saveCourseInfo"
          >
            {{ saving ? $t('admin.common.saving') : $t('admin.course.saveInfo') }}
          </button>
        </div>
      </section>

      <!-- Alerts -->
      <section v-if="authError" class="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm">
        {{ authError }}
        <button class="ml-2 underline text-xs" type="button" @click="returnToLogin">{{ $t('admin.common.loginAgain') }}</button>
      </section>
      <section v-if="error" class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{{ error }}</section>
      <section v-if="success" class="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-sm">{{ success }}</section>

      <!-- Course Info Card -->
      <section class="bg-white rounded-xl shadow p-5 space-y-4">
        <h2 class="font-semibold">{{ $t('admin.course.baseInfo') }}</h2>
        <div>
          <label class="text-xs text-slate-500">{{ $t('admin.course.titleZh') }} *</label>
          <input v-model="form.title" class="mt-1 w-full border rounded px-3 py-2 text-sm" type="text" />
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="text-xs text-slate-500">{{ $t('admin.course.language') }} *
            <input v-model="form.language" required maxlength="50" class="mt-1 w-full border rounded px-3 py-2 text-sm" type="text" />
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
        <label class="flex items-center gap-2 rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-700">
          <input v-model="form.isPublished" :disabled="!canWrite" type="checkbox" class="h-4 w-4 accent-primary" />
          {{ $t('admin.course.publish') }}
          <span class="ml-auto text-xs font-normal text-slate-400">{{ form.isPublished ? $t('admin.course.publishedHint') : $t('admin.course.draftHint') }}</span>
        </label>
      </section>

      <section class="bg-white rounded-xl shadow p-5 space-y-4">
        <div>
          <h2 class="font-semibold">{{ $t('admin.course.localizedContent') }}</h2>
          <p class="mt-1 text-xs text-slate-500">{{ $t('admin.course.localizedHint') }}</p>
        </div>
        <div v-for="item in translationLocales" :key="item.code" class="rounded-xl border border-slate-200 p-4">
          <h3 class="mb-4 text-sm font-black text-slate-700">{{ item.label }}</h3>
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="text-xs text-slate-500">{{ $t('admin.course.localizedTitle') }}
              <input v-model="form.translations[item.code].title" maxlength="200" class="mt-1 w-full border rounded px-3 py-2 text-sm" type="text" />
            </label>
            <label class="text-xs text-slate-500">{{ $t('admin.course.localizedTeacher') }}
              <input v-model="form.translations[item.code].teacher" maxlength="100" class="mt-1 w-full border rounded px-3 py-2 text-sm" type="text" />
            </label>
          </div>
          <label class="mt-4 block text-xs text-slate-500">{{ $t('admin.course.localizedSchedule') }}
            <input v-model="form.translations[item.code].schedule" maxlength="200" class="mt-1 w-full border rounded px-3 py-2 text-sm" type="text" />
          </label>
          <label class="mt-4 block text-xs text-slate-500">{{ $t('admin.course.localizedDescription') }}
            <textarea v-model="form.translations[item.code].description" class="mt-1 w-full border rounded px-3 py-2 text-sm" rows="3"></textarea>
          </label>
        </div>
      </section>

      <!-- Resource Manager Card -->
      <section class="bg-white rounded-xl shadow p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold">{{ $t('admin.course.resources') }}</h2>
          <div class="flex gap-2">
            <button
              v-if="canWrite && orderDirty"
              class="px-3 py-1.5 rounded bg-primary text-on-primary text-sm disabled:opacity-60"
              type="button"
              :disabled="resourceOp"
              @click="saveOrder"
            >
              {{ resourceOp ? $t('admin.common.saving') : $t('admin.course.saveOrder') }}
            </button>
            <button
              v-if="canWrite"
              class="px-3 py-1.5 rounded border text-sm disabled:opacity-60"
              type="button"
              :disabled="resourceOp"
              @click="openAddModal"
            >
              {{ $t('admin.course.addResource') }}
            </button>
          </div>
        </div>

        <div v-if="form.resources.length === 0" class="text-sm text-slate-500 py-4 text-center">{{ $t('admin.course.noResources') }}</div>

        <div v-for="(r, idx) in form.resources" :key="r.id || r.clientKey" class="border rounded-lg p-4 space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-400">#{{ idx + 1 }}</span>
              <span class="text-sm font-medium truncate max-w-[240px]">{{ r.title || $t('admin.course.untitledResource') }}</span>
              <span class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{{ r.resource_type }}</span>
            </div>
            <div class="flex gap-1.5">
              <template v-if="canWrite">
                <button class="px-2 py-1 rounded border text-xs disabled:opacity-40" type="button" :disabled="resourceOp || idx === 0" @click="moveUp(idx)">↑</button>
                <button class="px-2 py-1 rounded border text-xs disabled:opacity-40" type="button" :disabled="resourceOp || idx === form.resources.length - 1" @click="moveDown(idx)">↓</button>
                <button class="px-2 py-1 rounded border text-xs disabled:opacity-40" type="button" :disabled="resourceOp" @click="openEditModal(r)">{{ $t('admin.common.edit') }}</button>
                <button class="px-2 py-1 rounded border text-xs text-red-600 disabled:opacity-40" type="button" :disabled="resourceOp" @click="onDeleteResource(r)">{{ $t('admin.common.delete') }}</button>
              </template>
            </div>
          </div>
          <p class="text-xs text-slate-400 truncate">{{ r.source_url }}</p>
        </div>
      </section>
    </div>

    <!-- Resource Modal -->
    <div v-if="modalOpen" class="fixed inset-0 z-50 bg-black/30 flex items-center justify-center" @click.self="closeModal">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h3 class="font-semibold text-base">{{ editingResource ? $t('admin.course.editResource') : $t('admin.course.addResource') }}</h3>

        <div>
          <label class="text-xs text-slate-500">{{ $t('admin.course.resourceType') }} *</label>
          <select v-model="modalForm.resource_type" class="mt-1 w-full border rounded px-3 py-2 text-sm">
            <option value="local">local</option>
            <option value="youtube">youtube</option>
            <option value="bilibili">bilibili</option>
            <option value="external_link">external_link</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-slate-500">{{ $t('admin.course.sourceUrl') }} *</label>
          <input v-model="modalForm.source_url" class="mt-1 w-full border rounded px-3 py-2 text-sm" type="text" :placeholder="$t('admin.course.sourcePlaceholder')" />
          <p class="mt-1 text-xs leading-5 text-slate-400">{{ modalResourceSourceHint }}</p>
          <p v-if="modalError" class="text-xs text-red-600 mt-1">{{ modalError }}</p>
        </div>
        <div>
          <label class="text-xs text-slate-500">{{ $t('admin.course.resourceTitle') }}</label>
          <input v-model="modalForm.title" class="mt-1 w-full border rounded px-3 py-2 text-sm" type="text" />
        </div>

        <div class="flex gap-2 pt-2">
          <button
            class="flex-1 px-3 py-2 rounded bg-primary text-on-primary text-sm disabled:opacity-60"
            type="button"
            :disabled="resourceOp"
            @click="submitModal"
          >
            {{ resourceOp ? $t('admin.common.saving') : $t('admin.common.confirm') }}
          </button>
          <button class="px-3 py-2 rounded border text-sm" type="button" @click="closeModal">{{ $t('admin.common.cancel') }}</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getCourseById,
  updateCourse,
  addResource,
  updateResource,
  deleteResource,
  sortResources,
  type VideoResourceType,
  type VideoResourceDto,
} from '@/api/course'
import { useI18n } from 'vue-i18n'
import { useAdminAuth } from '@/composables/useAdminAuth'
import AdminNav from '@/components/admin/AdminNav.vue'
import { confirmAction } from '@/utils/confirmAction'

type EditableResource = {
  id: string
  clientKey: string
  resource_type: VideoResourceType
  source_url: string
  title: string
}

const route = useRoute()
const router = useRouter()
const { can, logout } = useAdminAuth()
const { t } = useI18n()
const canWrite = computed(() => can('course.write'))
const translationLocales = [
  { code: 'en' as const, label: 'English' },
  { code: 'ru' as const, label: 'Русский' },
]
const courseId = String(route.params.id || '')

const saving = ref(false)
const resourceOp = ref(false)
const orderDirty = ref(false)
const error = ref('')
const authError = ref('')
const success = ref('')

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
  resources: [] as EditableResource[],
})

// --- Modal state ---
const modalOpen = ref(false)
const editingResource = ref<EditableResource | null>(null)
const modalError = ref('')
const modalForm = reactive<{ resource_type: VideoResourceType; source_url: string; title: string }>({
  resource_type: 'local',
  source_url: '',
  title: '',
})
const modalResourceSourceHint = computed(() => t(`admin.course.sourceHint.${modalForm.resource_type}`))

function dtoToEditable(r: VideoResourceDto): EditableResource {
  return { id: r.id, clientKey: r.id, resource_type: r.resource_type, source_url: r.source_url, title: r.title || '' }
}

function handleAuthError(e: unknown) {
  if (e instanceof Error && /管理会话|权限|登录/.test(e.message)) {
    authError.value = e.message
    return true
  }
  return false
}

function returnToLogin() {
  logout()
  router.replace({ path: '/admin/login', query: { redirect: route.fullPath } })
}

// --- Load ---
async function reload() {
  error.value = ''
  authError.value = ''
  success.value = ''
  orderDirty.value = false
  try {
    const data = await getCourseById(courseId)
    form.title = data.title
    form.language = data.language
    form.level = data.level || ''
    form.teacher = data.teacher || ''
    form.schedule = data.schedule || ''
    form.coverUrl = data.coverUrl || ''
    form.description = data.description || ''
    for (const { code } of translationLocales) {
      form.translations[code].title = data.translations?.[code]?.title || ''
      form.translations[code].teacher = data.translations?.[code]?.teacher || ''
      form.translations[code].schedule = data.translations?.[code]?.schedule || ''
      form.translations[code].description = data.translations?.[code]?.description || ''
    }
    form.isPublished = data.isPublished
    form.resources = data.resources.map(dtoToEditable)
  } catch (e) {
    if (!handleAuthError(e)) error.value = e instanceof Error ? e.message : t('admin.course.loadFailed')
  }
}

// --- Save course info only ---
async function saveCourseInfo() {
  if (saving.value) return
  error.value = ''
  success.value = ''
  authError.value = ''
  if (!form.title.trim() || !form.language.trim()) { error.value = t('admin.course.titleAndLanguageRequired'); return }

  saving.value = true
  try {
    await updateCourse(courseId, {
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
      // resources 不传，仅更新课程信息
    })
    success.value = t('admin.course.saved')
  } catch (e) {
    if (!handleAuthError(e)) error.value = e instanceof Error ? e.message : t('admin.course.saveFailed')
  } finally {
    saving.value = false
  }
}

// --- Resource ordering (local only, mark dirty) ---
function moveUp(idx: number) {
  if (idx === 0) return
  const tmp = form.resources[idx - 1]
  form.resources[idx - 1] = form.resources[idx]
  form.resources[idx] = tmp
  orderDirty.value = true
}

function moveDown(idx: number) {
  if (idx === form.resources.length - 1) return
  const tmp = form.resources[idx + 1]
  form.resources[idx + 1] = form.resources[idx]
  form.resources[idx] = tmp
  orderDirty.value = true
}

async function saveOrder() {
  if (resourceOp.value) return
  error.value = ''
  authError.value = ''
  resourceOp.value = true
  try {
    const updated = await sortResources(courseId, form.resources.map((r) => r.id))
    form.resources = updated.resources.map(dtoToEditable)
    orderDirty.value = false
    success.value = t('admin.course.orderSaved')
  } catch (e) {
    if (!handleAuthError(e)) error.value = e instanceof Error ? e.message : t('admin.course.orderSaveFailed')
  } finally {
    resourceOp.value = false
  }
}

// --- Modal helpers ---
function openAddModal() {
  editingResource.value = null
  modalForm.resource_type = 'local'
  modalForm.source_url = ''
  modalForm.title = ''
  modalError.value = ''
  modalOpen.value = true
}

function openEditModal(r: EditableResource) {
  editingResource.value = r
  modalForm.resource_type = r.resource_type
  modalForm.source_url = r.source_url
  modalForm.title = r.title
  modalError.value = ''
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  editingResource.value = null
  modalError.value = ''
}

async function submitModal() {
  if (resourceOp.value) return
  modalError.value = ''
  if (!modalForm.source_url.trim()) { modalError.value = t('admin.course.sourceRequired'); return }

  const input = {
    resource_type: modalForm.resource_type,
    source_url: modalForm.source_url.trim(),
    title: modalForm.title.trim() || undefined,
  }

  error.value = ''
  authError.value = ''
  resourceOp.value = true
  try {
    if (editingResource.value) {
      // Edit mode
      const updated = await updateResource(courseId, editingResource.value.id, input)
      const idx = form.resources.findIndex((r) => r.id === editingResource.value!.id)
      if (idx !== -1) form.resources[idx] = dtoToEditable(updated)
      success.value = t('admin.course.resourceUpdated')
    } else {
      // Add mode
      const created = await addResource(courseId, input)
      form.resources.push(dtoToEditable(created))
      success.value = t('admin.course.resourceAdded')
    }
    closeModal()
  } catch (e) {
    if (!handleAuthError(e)) modalError.value = e instanceof Error ? e.message : t('admin.course.operationFailed')
  } finally {
    resourceOp.value = false
  }
}

// --- Delete resource (immediate) ---
async function onDeleteResource(r: EditableResource) {
  if (resourceOp.value) return
  const ok = await confirmAction(t('admin.course.deleteResourceConfirm', { title: r.title || r.source_url }), {
    title: t('admin.common.confirm'),
    confirmText: t('admin.common.delete'),
    cancelText: t('admin.common.cancel'),
    danger: true,
  })
  if (!ok) return

  error.value = ''
  authError.value = ''
  resourceOp.value = true
  try {
    await deleteResource(courseId, r.id)
    form.resources = form.resources.filter((res) => res.id !== r.id)
    success.value = t('admin.course.resourceDeleted')
  } catch (e) {
    if (!handleAuthError(e)) error.value = e instanceof Error ? e.message : t('admin.course.deleteFailed')
  } finally {
    resourceOp.value = false
  }
}

onMounted(reload)
</script>
