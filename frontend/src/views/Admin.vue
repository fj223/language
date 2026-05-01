<template>
  <main class="p-8 bg-[#f8f9fa] min-h-screen">
    <!-- LIST MODE -->
    <div v-if="mode === 'list'" class="max-w-7xl mx-auto space-y-6">
      <section class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">管理后台（课程列表）</h1>
          <p class="text-sm text-slate-600 mt-1">支持课程搜索、筛选、分页与快捷操作</p>
        </div>
        <div class="flex gap-2">
          <button class="px-3 py-2 rounded border text-sm" type="button" @click="configureToken">配置令牌</button>
          <button class="px-4 py-2 rounded bg-primary text-on-primary text-sm" type="button" @click="openCreateDrawer">创建课程</button>
        </div>
      </section>

      <section class="bg-white rounded-xl shadow p-4 flex flex-wrap gap-3 items-center">
        <input v-model="searchInput" class="border rounded px-3 py-2 text-sm min-w-[280px]" placeholder="按课程标题搜索，回车触发" type="text" @keydown.enter="applyFilters" />
        <button class="px-3 py-2 rounded border text-sm" type="button" @click="applyFilters">搜索</button>
        <button class="px-3 py-2 rounded border text-sm" type="button" @click="clearFilters">清空</button>
        <select v-model="selectedType" class="border rounded px-3 py-2 text-sm">
          <option value="">资源类型：全部</option>
          <option value="local">local</option>
          <option value="youtube">youtube</option>
          <option value="bilibili">bilibili</option>
          <option value="external_link">external_link</option>
        </select>
        <select v-model.number="pagination.pageSize" class="border rounded px-3 py-2 text-sm" @change="onPageSizeChange">
          <option :value="10">10 / 页</option>
          <option :value="20">20 / 页</option>
          <option :value="50">50 / 页</option>
        </select>
      </section>

      <section v-if="authError" class="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm">{{ authError }}</section>
      <section v-if="listError" class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{{ listError }}</section>

      <section class="bg-white rounded-xl shadow overflow-hidden">
        <table class="w-full text-left">
          <thead class="bg-slate-50 text-xs text-slate-500 uppercase">
            <tr>
              <th class="px-4 py-3">封面</th>
              <th class="px-4 py-3">标题 / 描述</th>
              <th class="px-4 py-3">资源数</th>
              <th class="px-4 py-3">更新时间</th>
              <th class="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td class="px-4 py-8 text-sm text-slate-500" colspan="5">加载中...</td></tr>
            <tr v-else-if="courses.length === 0"><td class="px-4 py-8 text-sm text-slate-500" colspan="5">暂无课程</td></tr>
            <tr v-for="c in courses" :key="c.id" class="border-t">
              <td class="px-4 py-3">
                <div class="w-20 h-12 rounded bg-slate-100 overflow-hidden">
                  <img v-if="c.coverUrl" :src="c.coverUrl" alt="cover" class="w-full h-full object-cover" />
                </div>
              </td>
              <td class="px-4 py-3">
                <button class="font-semibold text-primary hover:underline text-left" type="button" @click="openEdit(c.id)">{{ c.title }}</button>
                <p class="text-xs text-slate-500 line-clamp-1">{{ c.description || '-' }}</p>
              </td>
              <td class="px-4 py-3 text-sm">{{ c.resources.length }}</td>
              <td class="px-4 py-3 text-sm">{{ formatDate(c.updatedAt) }}</td>
              <td class="px-4 py-3">
                <div class="flex justify-end gap-2">
                  <router-link class="px-3 py-1.5 rounded border text-xs" :to="`/courses/${c.id}`">预览</router-link>
                  <button class="px-3 py-1.5 rounded border text-xs" type="button" @click="openEdit(c.id)">编辑</button>
                  <button class="px-3 py-1.5 rounded border text-xs text-red-600" type="button" @click="onDelete(c.id)">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="flex items-center justify-between text-sm text-slate-600">
        <div>共 {{ pagination.total }} 条，{{ pagination.totalPages }} 页，当前第 {{ pagination.page }} 页</div>
        <div class="flex items-center gap-2">
          <button class="px-3 py-1.5 rounded border" type="button" :disabled="pagination.page <= 1" @click="changePage(pagination.page - 1)">上一页</button>
          <button class="px-3 py-1.5 rounded border" type="button" :disabled="pagination.page >= pagination.totalPages" @click="changePage(pagination.page + 1)">下一页</button>
        </div>
      </section>

      <!-- Create drawer -->
      <div v-if="isDrawerOpen" class="fixed inset-0 z-50 bg-black/20 flex justify-end">
        <div class="w-full max-w-lg h-full bg-white flex flex-col">
          <div class="p-5 border-b flex items-center justify-between">
            <h3 class="font-semibold">创建课程</h3>
            <button type="button" class="text-sm" @click="isDrawerOpen = false">关闭</button>
          </div>
          <div class="p-5 flex-1 overflow-y-auto">
            <form class="space-y-4" @submit.prevent="onSubmit">
              <div>
                <label class="text-xs text-slate-500">标题</label>
                <input v-model="createForm.title" class="mt-1 w-full border rounded px-3 py-2 text-sm" type="text" />
                <p v-if="createErrors.title" class="text-xs text-red-600 mt-1">{{ createErrors.title }}</p>
              </div>
              <div>
                <label class="text-xs text-slate-500">封面 URL</label>
                <input v-model="createForm.coverUrl" class="mt-1 w-full border rounded px-3 py-2 text-sm" type="text" />
              </div>
              <div>
                <label class="text-xs text-slate-500">描述</label>
                <textarea v-model="createForm.description" class="mt-1 w-full border rounded px-3 py-2 text-sm" rows="3"></textarea>
              </div>
              <div>
                <label class="text-xs text-slate-500">资源类型</label>
                <select v-model="createForm.resource_type" class="mt-1 w-full border rounded px-3 py-2 text-sm">
                  <option value="local">local</option>
                  <option value="youtube">youtube</option>
                  <option value="bilibili">bilibili</option>
                  <option value="external_link">external_link</option>
                </select>
              </div>
              <div>
                <label class="text-xs text-slate-500">来源 URL/ID</label>
                <input v-model="createForm.source_url" class="mt-1 w-full border rounded px-3 py-2 text-sm" type="text" />
                <p v-if="createErrors.source_url" class="text-xs text-red-600 mt-1">{{ createErrors.source_url }}</p>
              </div>
            </form>
          </div>
          <div class="p-5 border-t flex gap-2">
            <button class="flex-1 px-3 py-2 rounded bg-primary text-on-primary text-sm" type="button" :disabled="submitting" @click="onSubmit">{{ submitting ? '保存中...' : '保存' }}</button>
            <button class="px-3 py-2 rounded border text-sm" type="button" @click="isDrawerOpen = false">取消</button>
          </div>
        </div>
      </div>
    </div>

    <!-- EDIT MODE -->
    <div v-else-if="mode === 'edit'" class="max-w-5xl mx-auto space-y-6">
      <section class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">课程编辑页</h1>
          <p v-if="editForm.title" class="text-sm text-slate-500 mt-0.5">{{ editForm.title }}</p>
        </div>
        <div class="flex gap-2">
          <button class="px-3 py-2 rounded border text-sm" type="button" @click="backToList">返回列表</button>
          <button class="px-3 py-2 rounded border text-sm" type="button" :disabled="saving" @click="reloadEdit">放弃更改</button>
          <button class="px-4 py-2 rounded bg-primary text-on-primary text-sm disabled:opacity-60" type="button" :disabled="saving" @click="saveCourseInfo">{{ saving ? '保存中...' : '保存课程信息' }}</button>
        </div>
      </section>

      <section v-if="editAuthError" class="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm">
        {{ editAuthError }}
        <button class="ml-2 underline text-xs" type="button" @click="configureToken">重新配置令牌</button>
      </section>
      <section v-if="editError" class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{{ editError }}</section>
      <section v-if="editSuccess" class="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-sm">{{ editSuccess }}</section>

      <section class="bg-white rounded-xl shadow p-5 space-y-4">
        <h2 class="font-semibold">课程信息</h2>
        <div><label class="text-xs text-slate-500">标题 *</label><input v-model="editForm.title" class="mt-1 w-full border rounded px-3 py-2 text-sm" type="text" /></div>
        <div><label class="text-xs text-slate-500">封面 URL</label><input v-model="editForm.coverUrl" class="mt-1 w-full border rounded px-3 py-2 text-sm" type="text" /></div>
        <div><label class="text-xs text-slate-500">描述</label><textarea v-model="editForm.description" class="mt-1 w-full border rounded px-3 py-2 text-sm" rows="4"></textarea></div>
      </section>

      <section class="bg-white rounded-xl shadow p-5 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold">资源列表</h2>
          <div class="flex gap-2">
            <button v-if="orderDirty" class="px-3 py-1.5 rounded bg-primary text-on-primary text-sm disabled:opacity-60" type="button" :disabled="resourceOp" @click="saveOrder">{{ resourceOp ? '保存中...' : '保存排序' }}</button>
            <button class="px-3 py-1.5 rounded border text-sm disabled:opacity-60" type="button" :disabled="resourceOp" @click="openAddModal">新增资源</button>
          </div>
        </div>
        <div v-if="editForm.resources.length === 0" class="text-sm text-slate-500 py-4 text-center">暂无资源，点击"新增资源"添加。</div>
        <div v-for="(r, idx) in editForm.resources" :key="r.id || r.clientKey" class="border rounded-lg p-4 space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-400">#{{ idx + 1 }}</span>
              <span class="text-sm font-medium truncate max-w-[240px]">{{ r.title || '未命名资源' }}</span>
              <span class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{{ r.resource_type }}</span>
            </div>
            <div class="flex gap-1.5">
              <button class="px-2 py-1 rounded border text-xs disabled:opacity-40" type="button" :disabled="resourceOp || idx === 0" @click="moveUp(idx)">↑</button>
              <button class="px-2 py-1 rounded border text-xs disabled:opacity-40" type="button" :disabled="resourceOp || idx === editForm.resources.length - 1" @click="moveDown(idx)">↓</button>
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
        <div><label class="text-xs text-slate-500">资源类型 *</label>
          <select v-model="modalForm.resource_type" class="mt-1 w-full border rounded px-3 py-2 text-sm">
            <option value="local">local</option><option value="youtube">youtube</option><option value="bilibili">bilibili</option><option value="external_link">external_link</option>
          </select>
        </div>
        <div><label class="text-xs text-slate-500">来源 URL/ID *</label>
          <input v-model="modalForm.source_url" class="mt-1 w-full border rounded px-3 py-2 text-sm" type="text" placeholder="URL、视频ID 或本地路径" />
          <p v-if="modalError" class="text-xs text-red-600 mt-1">{{ modalError }}</p>
        </div>
        <div><label class="text-xs text-slate-500">资源标题（可选）</label><input v-model="modalForm.title" class="mt-1 w-full border rounded px-3 py-2 text-sm" type="text" /></div>
        <div class="flex gap-2 pt-2">
          <button class="flex-1 px-3 py-2 rounded bg-primary text-on-primary text-sm disabled:opacity-60" type="button" :disabled="resourceOp" @click="submitModal">{{ resourceOp ? '保存中...' : '确认' }}</button>
          <button class="px-3 py-2 rounded border text-sm" type="button" @click="closeModal">取消</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import axios from 'axios'
import { getCourses, getCourseById, createCourse, deleteCourse, updateCourse, addResource, updateResource, deleteResource, sortResources, type CourseDto, type VideoResourceDto, type VideoResourceType } from '@/api/course'

// ── mode ──────────────────────────────────────────────────────
type Mode = 'list' | 'edit'
const mode = ref<Mode>('list')
const editingCourseId = ref('')

function openEdit(id: string) { editingCourseId.value = id; mode.value = 'edit'; reloadEdit() }
function backToList() { mode.value = 'list'; editingCourseId.value = ''; refresh() }

// ── shared ────────────────────────────────────────────────────
function configureToken() {
  const cur = localStorage.getItem('ADMIN_TOKEN') || ''
  const next = window.prompt('请输入管理员令牌（Admin Token）', cur)
  if (next === null) return
  localStorage.setItem('ADMIN_TOKEN', next.trim())
  authError.value = ''; editAuthError.value = ''
  if (mode.value === 'list') refresh(); else reloadEdit()
}

function handleAuth(e: unknown, target: 'list' | 'edit') {
  if (axios.isAxiosError(e) && (e.response?.status === 401 || e.response?.status === 403)) {
    if (target === 'list') authError.value = '管理员令牌无效或已过期，请重新配置 ADMIN_TOKEN 后重试。'
    else editAuthError.value = '管理员令牌无效或已过期，请重新配置 ADMIN_TOKEN。'
    return true
  }
  return false
}

// ── LIST ──────────────────────────────────────────────────────
const loading = ref(false)
const listError = ref('')
const authError = ref('')
const courses = ref<CourseDto[]>([])
const submitting = ref(false)
const searchInput = ref('')
const selectedType = ref<'' | VideoResourceType>('')
const isDrawerOpen = ref(false)
const pagination = reactive({ page: 1, pageSize: 10 as 10 | 20 | 50, total: 0, totalPages: 1 })
const createForm = reactive({ title: '', coverUrl: '', description: '', resource_type: 'local' as VideoResourceType, source_url: '' })
const createErrors = reactive({ title: '', source_url: '' })

async function refresh() {
  authError.value = ''; listError.value = ''; loading.value = true
  try {
    const data = await getCourses({ q: searchInput.value.trim() || undefined, resource_type: selectedType.value || undefined, page: pagination.page, pageSize: pagination.pageSize })
    courses.value = data.items
    pagination.page = data.pagination.page
    pagination.pageSize = data.pagination.pageSize as 10 | 20 | 50
    pagination.total = data.pagination.total
    pagination.totalPages = data.pagination.totalPages
  } catch (e) { if (!handleAuth(e, 'list')) listError.value = e instanceof Error ? e.message : '加载课程失败' }
  finally { loading.value = false }
}

function formatDate(s: string) { const d = new Date(s); return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString() }
function applyFilters() { pagination.page = 1; refresh() }
function clearFilters() { searchInput.value = ''; selectedType.value = ''; pagination.page = 1; refresh() }
function changePage(p: number) { pagination.page = p; refresh() }
function onPageSizeChange() { pagination.page = 1; refresh() }

function openCreateDrawer() {
  createForm.title = ''; createForm.coverUrl = ''; createForm.description = ''; createForm.resource_type = 'local'; createForm.source_url = ''
  createErrors.title = ''; createErrors.source_url = ''
  isDrawerOpen.value = true
}

function validateCreate() {
  createErrors.title = ''; createErrors.source_url = ''
  if (!createForm.title.trim()) createErrors.title = '课程标题不能为空'
  if (!createForm.source_url.trim()) createErrors.source_url = 'URL/Path 不能为空'
  return !createErrors.title && !createErrors.source_url
}

async function onSubmit() {
  if (submitting.value || !validateCreate()) return
  submitting.value = true
  try {
    await createCourse({ title: createForm.title.trim(), coverUrl: createForm.coverUrl.trim() || undefined, description: createForm.description.trim() || undefined, resources: [{ resource_type: createForm.resource_type, source_url: createForm.source_url.trim(), sortOrder: 0 }] })
    pagination.page = 1; await refresh(); isDrawerOpen.value = false
  } catch (e) { if (!handleAuth(e, 'list')) listError.value = e instanceof Error ? e.message : '创建课程失败' }
  finally { submitting.value = false }
}

async function onDelete(courseId: string) {
  if (!window.confirm('确认删除该课程？删除后不可恢复。')) return
  try { await deleteCourse(courseId); await refresh() }
  catch (e) { if (!handleAuth(e, 'list')) listError.value = e instanceof Error ? e.message : '删除课程失败' }
}

watch(() => createForm.resource_type, () => { createForm.source_url = ''; createErrors.source_url = '' })

// ── EDIT ──────────────────────────────────────────────────────
type EditableResource = { id: string; clientKey: string; resource_type: VideoResourceType; source_url: string; title: string }

const saving = ref(false)
const resourceOp = ref(false)
const orderDirty = ref(false)
const editError = ref('')
const editAuthError = ref('')
const editSuccess = ref('')
const editForm = reactive({ title: '', coverUrl: '', description: '', resources: [] as EditableResource[] })
const modalOpen = ref(false)
const editingResource = ref<EditableResource | null>(null)
const modalError = ref('')
const modalForm = reactive<{ resource_type: VideoResourceType; source_url: string; title: string }>({ resource_type: 'local', source_url: '', title: '' })

function dtoToEditable(r: VideoResourceDto): EditableResource {
  return { id: r.id, clientKey: r.id, resource_type: r.resource_type, source_url: r.source_url, title: r.title || '' }
}

async function reloadEdit() {
  editError.value = ''; editAuthError.value = ''; editSuccess.value = ''; orderDirty.value = false
  try {
    const data = await getCourseById(editingCourseId.value)
    editForm.title = data.title; editForm.coverUrl = data.coverUrl || ''; editForm.description = data.description || ''
    editForm.resources = data.resources.map(dtoToEditable)
  } catch (e) { if (!handleAuth(e, 'edit')) editError.value = e instanceof Error ? e.message : '加载课程失败' }
}

async function saveCourseInfo() {
  if (saving.value) return
  editError.value = ''; editSuccess.value = ''; editAuthError.value = ''
  if (!editForm.title.trim()) { editError.value = '课程标题不能为空'; return }
  saving.value = true
  try {
    await updateCourse(editingCourseId.value, { title: editForm.title.trim(), coverUrl: editForm.coverUrl.trim() || undefined, description: editForm.description.trim() || undefined })
    editSuccess.value = '课程信息已保存'
  } catch (e) { if (!handleAuth(e, 'edit')) editError.value = e instanceof Error ? e.message : '保存失败' }
  finally { saving.value = false }
}

function moveUp(idx: number) { if (idx === 0) return; const t = editForm.resources[idx - 1]; editForm.resources[idx - 1] = editForm.resources[idx]; editForm.resources[idx] = t; orderDirty.value = true }
function moveDown(idx: number) { if (idx === editForm.resources.length - 1) return; const t = editForm.resources[idx + 1]; editForm.resources[idx + 1] = editForm.resources[idx]; editForm.resources[idx] = t; orderDirty.value = true }

async function saveOrder() {
  if (resourceOp.value) return
  editError.value = ''; editAuthError.value = ''; resourceOp.value = true
  try {
    const updated = await sortResources(editingCourseId.value, editForm.resources.map((r) => r.id))
    editForm.resources = updated.resources.map(dtoToEditable); orderDirty.value = false; editSuccess.value = '排序已保存'
  } catch (e) { if (!handleAuth(e, 'edit')) editError.value = e instanceof Error ? e.message : '排序保存失败' }
  finally { resourceOp.value = false }
}

function openAddModal() { editingResource.value = null; modalForm.resource_type = 'local'; modalForm.source_url = ''; modalForm.title = ''; modalError.value = ''; modalOpen.value = true }
function openEditModal(r: EditableResource) { editingResource.value = r; modalForm.resource_type = r.resource_type; modalForm.source_url = r.source_url; modalForm.title = r.title; modalError.value = ''; modalOpen.value = true }
function closeModal() { modalOpen.value = false; editingResource.value = null; modalError.value = '' }

async function submitModal() {
  if (resourceOp.value) return
  modalError.value = ''
  if (!modalForm.source_url.trim()) { modalError.value = '来源 URL/ID 不能为空'; return }
  const input = { resource_type: modalForm.resource_type, source_url: modalForm.source_url.trim(), title: modalForm.title.trim() || undefined }
  editError.value = ''; editAuthError.value = ''; resourceOp.value = true
  try {
    if (editingResource.value) {
      const updated = await updateResource(editingCourseId.value, editingResource.value.id, input)
      const idx = editForm.resources.findIndex((r) => r.id === editingResource.value!.id)
      if (idx !== -1) editForm.resources[idx] = dtoToEditable(updated)
      editSuccess.value = '资源已更新'
    } else {
      const created = await addResource(editingCourseId.value, input)
      editForm.resources.push(dtoToEditable(created)); editSuccess.value = '资源已新增'
    }
    closeModal()
  } catch (e) { if (!handleAuth(e, 'edit')) modalError.value = e instanceof Error ? e.message : '操作失败' }
  finally { resourceOp.value = false }
}

async function onDeleteResource(r: EditableResource) {
  if (resourceOp.value || !window.confirm(`确认删除资源「${r.title || r.source_url}」？`)) return
  editError.value = ''; editAuthError.value = ''; resourceOp.value = true
  try { await deleteResource(editingCourseId.value, r.id); editForm.resources = editForm.resources.filter((res) => res.id !== r.id); editSuccess.value = '资源已删除' }
  catch (e) { if (!handleAuth(e, 'edit')) editError.value = e instanceof Error ? e.message : '删除失败' }
  finally { resourceOp.value = false }
}

onMounted(refresh)
</script>
