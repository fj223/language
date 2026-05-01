<template>
  <main class="p-8 bg-[#f8f9fa] min-h-screen">
    <div class="max-w-5xl mx-auto space-y-6">

      <!-- Header -->
      <section class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">课程编辑页</h1>
          <p v-if="form.title" class="text-sm text-slate-500 mt-0.5">{{ form.title }}</p>
        </div>
        <div class="flex gap-2">
          <router-link class="px-3 py-2 rounded border text-sm" to="/admin">返回列表</router-link>
          <button class="px-3 py-2 rounded border text-sm" type="button" :disabled="saving" @click="reload">放弃更改</button>
          <button
            class="px-4 py-2 rounded bg-primary text-on-primary text-sm disabled:opacity-60"
            type="button"
            :disabled="saving"
            @click="saveCourseInfo"
          >
            {{ saving ? '保存中...' : '保存课程信息' }}
          </button>
        </div>
      </section>

      <!-- Alerts -->
      <section v-if="authError" class="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm">
        {{ authError }}
        <button class="ml-2 underline text-xs" type="button" @click="configureToken">重新配置令牌</button>
      </section>
      <section v-if="error" class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{{ error }}</section>
      <section v-if="success" class="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-sm">{{ success }}</section>

      <!-- Course Info Card -->
      <section class="bg-white rounded-xl shadow p-5 space-y-4">
        <h2 class="font-semibold">课程信息</h2>
        <div>
          <label class="text-xs text-slate-500">标题 *</label>
          <input v-model="form.title" class="mt-1 w-full border rounded px-3 py-2 text-sm" type="text" />
        </div>
        <div>
          <label class="text-xs text-slate-500">封面 URL</label>
          <input v-model="form.coverUrl" class="mt-1 w-full border rounded px-3 py-2 text-sm" type="text" />
        </div>
        <div>
          <label class="text-xs text-slate-500">描述</label>
          <textarea v-model="form.description" class="mt-1 w-full border rounded px-3 py-2 text-sm" rows="4"></textarea>
        </div>
      </section>

      <!-- Resource Manager Card -->
      <section class="bg-white rounded-xl shadow p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold">资源列表</h2>
          <div class="flex gap-2">
            <button
              v-if="orderDirty"
              class="px-3 py-1.5 rounded bg-primary text-on-primary text-sm disabled:opacity-60"
              type="button"
              :disabled="resourceOp"
              @click="saveOrder"
            >
              {{ resourceOp ? '保存中...' : '保存排序' }}
            </button>
            <button
              class="px-3 py-1.5 rounded border text-sm disabled:opacity-60"
              type="button"
              :disabled="resourceOp"
              @click="openAddModal"
            >
              新增资源
            </button>
          </div>
        </div>

        <div v-if="form.resources.length === 0" class="text-sm text-slate-500 py-4 text-center">暂无资源，点击"新增资源"添加。</div>

        <div v-for="(r, idx) in form.resources" :key="r.id || r.clientKey" class="border rounded-lg p-4 space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-400">#{{ idx + 1 }}</span>
              <span class="text-sm font-medium truncate max-w-[240px]">{{ r.title || '未命名资源' }}</span>
              <span class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{{ r.resource_type }}</span>
            </div>
            <div class="flex gap-1.5">
              <button class="px-2 py-1 rounded border text-xs disabled:opacity-40" type="button" :disabled="resourceOp || idx === 0" @click="moveUp(idx)">↑</button>
              <button class="px-2 py-1 rounded border text-xs disabled:opacity-40" type="button" :disabled="resourceOp || idx === form.resources.length - 1" @click="moveDown(idx)">↓</button>
              <button class="px-2 py-1 rounded border text-xs disabled:opacity-40" type="button" :disabled="resourceOp" @click="openEditModal(r)">编辑</button>
              <button class="px-2 py-1 rounded border text-xs text-red-600 disabled:opacity-40" type="button" :disabled="resourceOp" @click="onDeleteResource(r)">删除</button>
            </div>
          </div>
          <p class="text-xs text-slate-400 truncate">{{ r.source_url }}</p>
        </div>
      </section>
    </div>

    <!-- Resource Modal -->
    <div v-if="modalOpen" class="fixed inset-0 z-50 bg-black/30 flex items-center justify-center" @click.self="closeModal">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h3 class="font-semibold text-base">{{ editingResource ? '编辑资源' : '新增资源' }}</h3>

        <div>
          <label class="text-xs text-slate-500">资源类型 *</label>
          <select v-model="modalForm.resource_type" class="mt-1 w-full border rounded px-3 py-2 text-sm">
            <option value="local">local</option>
            <option value="youtube">youtube</option>
            <option value="bilibili">bilibili</option>
            <option value="external_link">external_link</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-slate-500">来源 URL/ID *</label>
          <input v-model="modalForm.source_url" class="mt-1 w-full border rounded px-3 py-2 text-sm" type="text" placeholder="URL、视频ID 或本地路径" />
          <p v-if="modalError" class="text-xs text-red-600 mt-1">{{ modalError }}</p>
        </div>
        <div>
          <label class="text-xs text-slate-500">资源标题（可选）</label>
          <input v-model="modalForm.title" class="mt-1 w-full border rounded px-3 py-2 text-sm" type="text" />
        </div>

        <div class="flex gap-2 pt-2">
          <button
            class="flex-1 px-3 py-2 rounded bg-primary text-on-primary text-sm disabled:opacity-60"
            type="button"
            :disabled="resourceOp"
            @click="submitModal"
          >
            {{ resourceOp ? '保存中...' : '确认' }}
          </button>
          <button class="px-3 py-2 rounded border text-sm" type="button" @click="closeModal">取消</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import axios from 'axios'
import { useRoute } from 'vue-router'
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

type EditableResource = {
  id: string
  clientKey: string
  resource_type: VideoResourceType
  source_url: string
  title: string
}

const route = useRoute()
const courseId = String(route.params.id || '')

const saving = ref(false)
const resourceOp = ref(false)
const orderDirty = ref(false)
const error = ref('')
const authError = ref('')
const success = ref('')

const form = reactive({
  title: '',
  coverUrl: '',
  description: '',
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

function mkKey() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function dtoToEditable(r: VideoResourceDto): EditableResource {
  return { id: r.id, clientKey: r.id, resource_type: r.resource_type, source_url: r.source_url, title: r.title || '' }
}

function handleAuthError(e: unknown) {
  if (axios.isAxiosError(e) && (e.response?.status === 401 || e.response?.status === 403)) {
    authError.value = '管理员令牌无效或已过期，请重新配置 ADMIN_TOKEN。'
    return true
  }
  return false
}

function configureToken() {
  const current = localStorage.getItem('ADMIN_TOKEN') || ''
  const next = window.prompt('请输入管理员令牌（Admin Token）', current)
  if (next === null) return
  localStorage.setItem('ADMIN_TOKEN', next.trim())
  authError.value = ''
  reload()
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
    form.coverUrl = data.coverUrl || ''
    form.description = data.description || ''
    form.resources = data.resources.map(dtoToEditable)
  } catch (e) {
    if (!handleAuthError(e)) error.value = e instanceof Error ? e.message : '加载课程失败'
  }
}

// --- Save course info only ---
async function saveCourseInfo() {
  if (saving.value) return
  error.value = ''
  success.value = ''
  authError.value = ''
  if (!form.title.trim()) { error.value = '课程标题不能为空'; return }

  saving.value = true
  try {
    await updateCourse(courseId, {
      title: form.title.trim(),
      coverUrl: form.coverUrl.trim() || undefined,
      description: form.description.trim() || undefined,
      // resources 不传，仅更新课程信息
    })
    success.value = '课程信息已保存'
  } catch (e) {
    if (!handleAuthError(e)) error.value = e instanceof Error ? e.message : '保存失败'
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
    success.value = '排序已保存'
  } catch (e) {
    if (!handleAuthError(e)) error.value = e instanceof Error ? e.message : '排序保存失败'
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
  if (!modalForm.source_url.trim()) { modalError.value = '来源 URL/ID 不能为空'; return }

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
      success.value = '资源已更新'
    } else {
      // Add mode
      const created = await addResource(courseId, input)
      form.resources.push(dtoToEditable(created))
      success.value = '资源已新增'
    }
    closeModal()
  } catch (e) {
    if (!handleAuthError(e)) modalError.value = e instanceof Error ? e.message : '操作失败'
  } finally {
    resourceOp.value = false
  }
}

// --- Delete resource (immediate) ---
async function onDeleteResource(r: EditableResource) {
  if (resourceOp.value) return
  const ok = window.confirm(`确认删除资源「${r.title || r.source_url}」？`)
  if (!ok) return

  error.value = ''
  authError.value = ''
  resourceOp.value = true
  try {
    await deleteResource(courseId, r.id)
    form.resources = form.resources.filter((res) => res.id !== r.id)
    success.value = '资源已删除'
  } catch (e) {
    if (!handleAuthError(e)) error.value = e instanceof Error ? e.message : '删除失败'
  } finally {
    resourceOp.value = false
  }
}

onMounted(reload)
</script>
