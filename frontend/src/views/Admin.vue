<template>
  <div class="min-h-screen" style="background: #f5f7fa;">

    <!-- ═══════════════════════════════════════════════════════
         未认证：管理员登录验证卡片
    ═══════════════════════════════════════════════════════ -->
    <div
      v-if="!isAdminAuthenticated"
      class="min-h-screen flex items-center justify-center px-4"
    >
      <div class="w-full max-w-sm">
        <!-- 卡片 -->
        <div class="bg-white rounded-3xl shadow-xl shadow-slate-900/10 border border-slate-200/60 overflow-hidden">

          <!-- 顶部渐变装饰 -->
          <div class="h-2 w-full" style="background: linear-gradient(90deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%);" />

          <div class="px-8 py-8">
            <!-- 图标 + 标题 -->
            <div class="flex flex-col items-center mb-8">
              <div class="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg mb-4">
                <span class="material-symbols-outlined text-white text-3xl"
                  style="font-variation-settings:'FILL' 1;">admin_panel_settings</span>
              </div>
              <h1 class="text-xl font-extrabold text-slate-800 tracking-tight">管理员身份验证</h1>
              <p class="text-xs text-slate-400 mt-1.5 text-center leading-relaxed">
                新言教育 · 课程管理系统<br/>请输入管理员密码以继续
              </p>
            </div>

            <!-- 密码输入 -->
            <form @submit.prevent="verifyAdmin" class="space-y-4">
              <div>
                <label class="form-label" for="admin-pwd">管理员密码</label>
                <div class="relative">
                  <input
                    id="admin-pwd"
                    ref="pwdInputRef"
                    v-model="adminPassword"
                    :type="showPassword ? 'text' : 'password'"
                    class="form-input pr-10"
                    :class="{ 'border-red-400 bg-red-50 focus:border-red-400': authError }"
                    placeholder="请输入管理员密码"
                    autocomplete="current-password"
                    @input="authError = ''"
                  />
                  <!-- 显示/隐藏密码切换 -->
                  <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    :aria-label="showPassword ? '隐藏密码' : '显示密码'"
                    @click="showPassword = !showPassword"
                  >
                    <span class="material-symbols-outlined text-lg">
                      {{ showPassword ? 'visibility_off' : 'visibility' }}
                    </span>
                  </button>
                </div>
                <!-- 错误提示 -->
                <Transition name="err-fade">
                  <p v-if="authError" class="mt-2 text-xs text-red-500 flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm"
                      style="font-variation-settings:'FILL' 1;">error</span>
                    {{ authError }}
                  </p>
                </Transition>
              </div>

              <button
                type="submit"
                class="w-full py-3 rounded-xl font-bold text-sm text-white transition-all duration-200
                       bg-slate-900 hover:bg-slate-700 active:scale-[0.98]
                       shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="!adminPassword.trim()"
              >
                <span class="flex items-center justify-center gap-2">
                  <span class="material-symbols-outlined text-base"
                    style="font-variation-settings:'FILL' 1;">lock_open</span>
                  验证身份
                </span>
              </button>
            </form>
          </div>
        </div>

        <!-- 返回前台链接 -->
        <div class="text-center mt-5">
          <router-link
            to="/"
            class="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600 transition-colors"
          >
            <span class="material-symbols-outlined text-sm">arrow_back</span>
            返回前台首页
          </router-link>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════
         已认证：数据大屏 + 课程管理
    ═══════════════════════════════════════════════════════ -->
    <div v-else class="max-w-5xl mx-auto px-6 py-10">

      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
            <span class="material-symbols-outlined text-white text-xl">admin_panel_settings</span>
          </div>
          <div>
            <h1 class="text-2xl font-extrabold text-on-surface font-headline tracking-tight">管理后台</h1>
            <p class="text-xs text-on-surface-variant font-body">新言教育 · 课程管理系统</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <!-- 退出登录 -->
          <button
            type="button"
            class="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-500 transition-colors"
            @click="logout"
          >
            <span class="material-symbols-outlined text-base">logout</span>
            退出
          </button>
          <router-link
            to="/"
            class="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-blue-600 transition-colors"
          >
            <span class="material-symbols-outlined text-base">arrow_back</span>
            返回前台
          </router-link>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════
           核心数据概览看板
      ═══════════════════════════════════════════════════════ -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div
          v-for="card in STAT_CARDS"
          :key="card.label"
          class="stat-card"
          :style="{ '--card-from': card.from, '--card-to': card.to }"
        >
          <!-- 图标区 -->
          <div class="stat-icon-wrap">
            <span class="material-symbols-outlined text-xl text-white" aria-hidden="true"
              style="font-variation-settings:'FILL' 1;">{{ card.icon }}</span>
          </div>
          <!-- 数值 -->
          <div class="mt-4">
            <div class="flex items-end gap-1.5">
              <span class="text-2xl font-black text-on-surface tracking-tight leading-none">{{ card.value }}</span>
              <span v-if="card.unit" class="text-xs font-semibold text-on-surface-variant mb-0.5">{{ card.unit }}</span>
            </div>
            <p class="text-xs text-on-surface-variant font-medium mt-1.5">{{ card.label }}</p>
          </div>
          <!-- 趋势标签 -->
          <div class="mt-3 flex items-center gap-1">
            <span
              class="inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full"
              :class="card.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'"
            >
              <span class="material-symbols-outlined text-xs" aria-hidden="true"
                style="font-variation-settings:'FILL' 1;">
                {{ card.trendUp ? 'trending_up' : 'trending_flat' }}
              </span>
              {{ card.trend }}
            </span>
          </div>
          <!-- 底部渐变装饰条 -->
          <div class="stat-bar" />
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div class="lg:col-span-1">
          <div class="bg-white rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
            <div class="px-6 py-5 border-b border-outline-variant/10">
              <h2 class="text-base font-bold text-on-surface font-headline flex items-center gap-2">
                <span class="material-symbols-outlined text-blue-600 text-xl">add_circle</span>
                添加新课程
              </h2>
            </div>

            <form class="px-6 py-5 space-y-4" @submit.prevent="handleAdd">
              <div>
                <label class="form-label" for="f-title">课程名称 *</label>
                <input
                  id="f-title"
                  v-model="form.title"
                  type="text"
                  class="form-input"
                  :class="{ 'border-red-500': errors.title }"
                  placeholder="如：雅思 7 分冲刺班"
                  required
                />
              </div>

              <div>
                <label class="form-label" for="f-language">语种 *</label>
                <select id="f-language" v-model="form.language" class="form-input" required>
                  <option value="">请选择语种</option>
                  <option v-for="lang in LANGUAGES" :key="lang" :value="lang">{{ lang }}</option>
                </select>
              </div>

              <div>
                <label class="form-label" for="f-level">级别 *</label>
                <select id="f-level" v-model="form.level" class="form-input" required>
                  <option value="">请选择级别</option>
                  <option v-for="lv in LEVELS" :key="lv" :value="lv">{{ lv }}</option>
                </select>
              </div>

              <div>
                <label class="form-label" for="f-teacher">主讲教师</label>
                <input
                  id="f-teacher"
                  v-model="form.teacher"
                  type="text"
                  class="form-input"
                  placeholder="如：张晓明老师"
                />
              </div>

              <div>
                <label class="form-label" for="f-price">课程价格 (¥)</label>
                <input
                  id="f-price"
                  v-model="form.price"
                  type="number"
                  class="form-input"
                  placeholder="如：1999"
                />
              </div>

              <div class="pt-4">
                <button type="submit" class="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition">
                  确认添加课程
                </button>
              </div>
            </form>
          </div>
        </div>

        <div class="lg:col-span-2">
          <div class="bg-white rounded-2xl shadow-sm p-8 text-center border border-outline-variant/10 h-full flex flex-col justify-center items-center">
            <span class="material-symbols-outlined text-7xl text-gray-200 mb-4">view_list</span>
            <h3 class="text-xl font-bold text-gray-700 mb-2">课程数据同步中</h3>
            <p class="text-sm text-gray-500 max-w-md leading-relaxed">
              在左侧表单中填写并提交新课程后，系统将自动调用教务 API，并在前台页面实时生效。
              <br/><br/>
              <span class="text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-xs font-semibold">演示系统数据将保存在本次运行实例中</span>
            </p>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue'

// ============================================================
// 管理员认证（简单密码锁 + sessionStorage 会话保持）
// ============================================================

const ADMIN_PASSWORD = 'admin123'
const SESSION_KEY = 'xinyanedu_admin_auth'

const isAdminAuthenticated = ref(
  sessionStorage.getItem(SESSION_KEY) === '1'
)

const adminPassword = ref('')
const authError = ref('')
const showPassword = ref(false)
const pwdInputRef = ref<HTMLInputElement | null>(null)

function verifyAdmin() {
  if (adminPassword.value === ADMIN_PASSWORD) {
    sessionStorage.setItem(SESSION_KEY, '1')
    isAdminAuthenticated.value = true
    adminPassword.value = ''
    authError.value = ''
  } else {
    authError.value = '管理员密码错误，请重试。'
    adminPassword.value = ''
    nextTick(() => pwdInputRef.value?.focus())
  }
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY)
  isAdminAuthenticated.value = false
  adminPassword.value = ''
  authError.value = ''
}

// ============================================================
// 数据看板 Mock 数据（原有，未修改）
// ============================================================

const STAT_CARDS = [
  {
    icon: 'group',
    value: '1,284',
    unit: '人',
    label: '累计注册学员',
    trend: '较上月 +8.3%',
    trendUp: true,
    from: '#eff6ff',
    to: '#dbeafe',
  },
  {
    icon: 'payments',
    value: '¥342,000',
    unit: '',
    label: '本月课程营收',
    trend: '较上月 +12.1%',
    trendUp: true,
    from: '#f0fdf4',
    to: '#dcfce7',
  },
  {
    icon: 'smart_toy',
    value: '8,932',
    unit: '次',
    label: 'AI 助手调用量',
    trend: '本月累计',
    trendUp: false,
    from: '#faf5ff',
    to: '#ede9fe',
  },
  {
    icon: 'workspace_premium',
    value: '92%',
    unit: '',
    label: '课程平均完课率',
    trend: '高于行业均值',
    trendUp: true,
    from: '#fff7ed',
    to: '#ffedd5',
  },
]

// ============================================================
// 添加课程表单（原有逻辑，未做任何修改）
// ============================================================

const LANGUAGES = ['英语', '俄语', '法语', '日语', '德语', '西班牙语', '韩语']
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const form = reactive({
  title: '',
  language: '',
  level: '',
  teacher: '',
  price: ''
})

const errors = reactive({
  title: false
})

function handleAdd() {
  if (!form.title || !form.language || !form.level) {
    alert('请填写完整的必填信息！')
    return
  }

  // 模拟提交成功
  alert(`课程【${form.title}】添加成功！这将在周一给老师演示时非常直观。`)

  // 清空表单
  form.title = ''
  form.language = ''
  form.level = ''
  form.teacher = ''
  form.price = ''
}
</script>

<style scoped>
/* ── 数据看板卡片 ─────────────────────────────────────────── */
.stat-card {
  position: relative;
  background: white;
  border-radius: 1.25rem;
  padding: 1.25rem 1.375rem 1.125rem;
  border: 1px solid rgba(148, 163, 184, 0.12);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05), 0 2px 8px rgba(0, 0, 0, 0.03);
  overflow: hidden;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.25s ease;
  cursor: default;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(51, 94, 161, 0.1), 0 4px 12px rgba(0, 0, 0, 0.06);
}

.stat-icon-wrap {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, var(--card-from), var(--card-to));
  display: flex;
  align-items: center;
  justify-content: center;
  /* 图标用深色，与浅色背景形成对比 */
  filter: saturate(1.4) brightness(0.72);
}

.stat-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--card-from), var(--card-to));
  opacity: 0;
  transition: opacity 0.25s ease;
}

.stat-card:hover .stat-bar {
  opacity: 1;
}

/* ── 错误提示淡入 ────────────────────────────────────────── */
.err-fade-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.err-fade-enter-from   { opacity: 0; transform: translateY(-4px); }

/* ── 表单样式（原有，未修改）─────────────────────────────── */
.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.5rem;
}
.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid #cbd5e1;
  background-color: #f8fafc;
  color: #1e293b;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
}
.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>