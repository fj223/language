<template>
  <main class="p-8 bg-[#f8f9fa] min-h-screen">
    <div class="max-w-7xl mx-auto space-y-6">
      <section class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">管理后台（课程列表）</h1>
          <p class="text-sm text-slate-600 mt-1">支持课程搜索、筛选、分页与快捷操作</p>
        </div>
        <div class="flex gap-2">
          <button
            class="px-3 py-2 rounded border text-sm"
            type="button"
            @click="configureToken"
          >
            配置令牌
          </button>
          <button
            class="px-4 py-2 rounded bg-primary text-on-primary text-sm"
            type="button"
            @click="openCreateDrawer"
          >
            创建课程
          </button>
        </div>
      </section>

      <section class="bg-white rounded-xl shadow p-4 flex flex-wrap gap-3 items-center">
        <input
          v-model="searchInput"
          class="border rounded px-3 py-2 text-sm min-w-[280px]"
          placeholder="按课程标题搜索，回车触发"
          type="text"
          @keydown.enter="applyFilters"
        />
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

      <section v-if="authError" class="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm">
        {{ authError }}
      </section>
      <section v-if="error" class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
        {{ error }}
      </section>

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
            <tr v-if="loading">
              <td class="px-4 py-8 text-sm text-slate-500" colspan="5">加载中...</td>
            </tr>
            <tr v-else-if="courses.length === 0">
              <td class="px-4 py-8 text-sm text-slate-500" colspan="5">暂无课程</td>
            </tr>
            <tr v-for="c in courses" :key="c.id" class="border-t">
              <td class="px-4 py-3">
                <div class="w-20 h-12 rounded bg-slate-100 overflow-hidden">
                  <img v-if="c.coverUrl" :src="c.coverUrl" alt="cover" class="w-full h-full object-cover" />
                </div>
              </td>
              <td class="px-4 py-3">
                <router-link class="font-semibold text-primary hover:underline" :to="`/admin/courses/${c.id}/edit`">
                  {{ c.title }}
                </router-link>
                <p class="text-xs text-slate-500 line-clamp-1">{{ c.description || '-' }}</p>
              </td>
              <td class="px-4 py-3 text-sm">{{ c.resources.length }}</td>
              <td class="px-4 py-3 text-sm">{{ formatDate(c.updatedAt) }}</td>
              <td class="px-4 py-3">
                <div class="flex justify-end gap-2">
                  <router-link class="px-3 py-1.5 rounded border text-xs" :to="`/courses/${c.id}`">预览</router-link>
                  <button class="px-3 py-1.5 rounded border text-xs" type="button" @click="onDelete(c.id)">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="flex items-center justify-between text-sm text-slate-600">
        <div>共 {{ pagination.total }} 条，{{ pagination.totalPages }} 页，当前第 {{ pagination.page }} 页</div>
        <div class="flex items-center gap-2">
          <button class="px-3 py-1.5 rounded border" type="button" :disabled="pagination.page <= 1" @click="changePage(pagination.page - 1)">
            上一页
          </button>
          <button class="px-3 py-1.5 rounded border" type="button" :disabled="pagination.page >= pagination.totalPages" @click="changePage(pagination.page + 1)">
            下一页
          </button>
        </div>
      </section>

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
                <input v-model="form.title" class="mt-1 w-full border rounded px-3 py-2 text-sm" type="text" />
                <p v-if="formErrors.title" class="text-xs text-red-600 mt-1">{{ formErrors.title }}</p>
              </div>
              <div>
                <label class="text-xs text-slate-500">封面 URL</label>
                <input v-model="form.coverUrl" class="mt-1 w-full border rounded px-3 py-2 text-sm" type="text" />
              </div>
              <div>
                <label class="text-xs text-slate-500">描述</label>
                <textarea v-model="form.description" class="mt-1 w-full border rounded px-3 py-2 text-sm" rows="4"></textarea>
              </div>
              <div>
                <label class="text-xs text-slate-500">资源类型</label>
                <select v-model="form.resource_type" class="mt-1 w-full border rounded px-3 py-2 text-sm">
                  <option value="local">local</option>
                  <option value="youtube">youtube</option>
                  <option value="bilibili">bilibili</option>
                  <option value="external_link">external_link</option>
                </select>
              </div>
              <div>
                <label class="text-xs text-slate-500">来源 URL/ID</label>
                <input v-model="form.source_url" class="mt-1 w-full border rounded px-3 py-2 text-sm" type="text" />
                <p v-if="formErrors.source_url" class="text-xs text-red-600 mt-1">{{ formErrors.source_url }}</p>
              </div>
            </form>
          </div>
          <div class="p-5 border-t flex gap-2">
            <button class="flex-1 px-3 py-2 rounded bg-primary text-on-primary text-sm" type="button" :disabled="submitting" @click="onSubmit">
              {{ submitting ? '保存中...' : '保存' }}
            </button>
            <button class="px-3 py-2 rounded border text-sm" type="button" @click="isDrawerOpen = false">取消</button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import axios from 'axios'
import { createCourse, deleteCourse, getCourses, type CourseDto, type VideoResourceType } from '@/api/course'

const isDrawerOpen = ref(false)
const loading = ref(false)
const error = ref('')
const authError = ref('')
const courses = ref<CourseDto[]>([])
const submitting = ref(false)
const deletingId = ref('')
const searchInput = ref('')
const selectedType = ref('' as '' | VideoResourceType)

const pagination = reactive({
  page: 1,
  pageSize: 10 as 10 | 20 | 50,
  total: 0,
  totalPages: 1,
})

const form = reactive({
  title: '',
  coverUrl: '',
  description: '',
  resource_type: 'local' as VideoResourceType,
  source_url: '',
})

const formErrors = reactive({
  title: '',
  source_url: '',
})

function resetForm() {
  form.title = ''
  form.coverUrl = ''
  form.description = ''
  form.resource_type = 'local'
  form.source_url = ''
  formErrors.title = ''
  formErrors.source_url = ''
}

function openCreateDrawer() {
  resetForm()
  isDrawerOpen.value = true
}

function validateForm() {
  formErrors.title = ''
  formErrors.source_url = ''

  const title = form.title.trim()
  if (!title) formErrors.title = '课程标题不能为空'

  const source = form.source_url.trim()
  if (!source) {
    formErrors.source_url = 'URL/Path 不能为空'
  } else if (form.resource_type === 'external_link') {
    try {
      const u = new URL(source)
      if (u.protocol !== 'http:' && u.protocol !== 'https:') formErrors.source_url = '外链必须是 http/https'
    } catch {
      formErrors.source_url = '外链 URL 格式不正确'
    }
  } else if (form.resource_type === 'youtube') {
    const isId = /^[a-zA-Z0-9_-]{6,}$/.test(source)
    const isUrl = /^https?:\/\//.test(source)
    if (!isId && !isUrl) formErrors.source_url = '请输入 YouTube 视频 ID 或完整链接'
  } else if (form.resource_type === 'bilibili') {
    const isBv = /^BV[0-9A-Za-z]{10,}$/.test(source)
    const isUrl = /^https?:\/\//.test(source)
    if (!isBv && !isUrl) formErrors.source_url = '请输入 BV 号或完整链接'
  }

  return !formErrors.title && !formErrors.source_url
}

async function refresh() {
  authError.value = ''
  error.value = ''
  loading.value = true
  try {
    const data = await getCourses({
      q: searchInput.value.trim() || undefined,
      resource_type: selectedType.value || undefined,
      page: pagination.page,
      pageSize: pagination.pageSize,
    })
    courses.value = data.items
    pagination.page = data.pagination.page
    pagination.pageSize = data.pagination.pageSize as 10 | 20 | 50
    pagination.total = data.pagination.total
    pagination.totalPages = data.pagination.totalPages
  } catch (e) {
    if (axios.isAxiosError(e) && (e.response?.status === 401 || e.response?.status === 403)) {
      authError.value = '管理员令牌无效或已过期，请重新配置 ADMIN_TOKEN 后重试。'
    } else {
      error.value = e instanceof Error ? e.message : '加载课程失败'
    }
  } finally {
    loading.value = false
  }
}

function formatDate(s: string) {
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString()
}

function configureToken() {
  const current = localStorage.getItem('ADMIN_TOKEN') || ''
  const next = window.prompt('请输入管理员令牌（Admin Token）', current)
  if (next === null) return
  localStorage.setItem('ADMIN_TOKEN', next.trim())
  refresh()
}

function applyFilters() {
  pagination.page = 1
  refresh()
}

function clearFilters() {
  searchInput.value = ''
  selectedType.value = ''
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
      coverUrl: form.coverUrl.trim() || undefined,
      description: form.description.trim() || undefined,
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
    if (axios.isAxiosError(e) && (e.response?.status === 401 || e.response?.status === 403)) {
      authError.value = '管理员令牌无效或已过期，请重新配置 ADMIN_TOKEN 后重试。'
    } else {
      error.value = e instanceof Error ? e.message : '创建课程失败'
    }
  } finally {
    submitting.value = false
  }
}

async function onDelete(courseId: string) {
  if (deletingId.value) return
  const ok = window.confirm('确认删除该课程？删除后不可恢复。')
  if (!ok) return

  deletingId.value = courseId
  try {
    await deleteCourse(courseId)
    await refresh()
  } catch (e) {
    if (axios.isAxiosError(e) && (e.response?.status === 401 || e.response?.status === 403)) {
      authError.value = '管理员令牌无效或已过期，请重新配置 ADMIN_TOKEN 后重试。'
    } else {
      error.value = e instanceof Error ? e.message : '删除课程失败'
    }
  } finally {
    deletingId.value = ''
  }
}

watch(
  () => form.resource_type,
  () => {
    form.source_url = ''
    formErrors.source_url = ''
  },
)

onMounted(async () => {
  await refresh()
})
</script>
