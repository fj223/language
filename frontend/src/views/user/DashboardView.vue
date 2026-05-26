<template>
  <div class="text-on-background min-h-screen" style="background: #f5f7fa;">

    <aside
      class="fixed left-0 top-0 h-full w-[220px] flex flex-col py-8 z-50"
      style="background: #ffffff; border-right: 1px solid rgba(171,179,183,0.15); box-shadow: 2px 0 16px rgba(51,94,161,0.05);"
      aria-label="侧边导航"
    >
      <div class="px-6 mb-10">
        <router-link
          to="/"
          class="flex items-center gap-2 group"
        >
          <div class="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <span class="material-symbols-outlined text-white text-sm" aria-hidden="true">school</span>
          </div>
          <div class="leading-none">
            <span class="text-base font-extrabold tracking-tight text-primary font-headline">新言教育</span>
          </div>
        </router-link>
        <p class="text-[10px] text-on-surface-variant mt-1.5 font-medium tracking-widest uppercase font-body pl-9">
          OpenEdu
        </p>
      </div>

      <nav class="flex flex-col gap-1 flex-grow font-body px-3">
        <a
          class="sidebar-link sidebar-link-active"
          href="#"
          aria-current="page"
        >
          <span class="material-symbols-outlined text-xl" aria-hidden="true">dashboard</span>
          <span class="text-sm">{{ $t('dashboard.title') }}</span>
        </a>
        <router-link
          to="/courses"
          class="sidebar-link"
        >
          <span class="material-symbols-outlined text-xl" aria-hidden="true">menu_book</span>
          <span class="text-sm">{{ $t('dashboard.courseList') }}</span>
        </router-link>
        <router-link
          to="/review-hall"
          class="sidebar-link"
        >
          <span class="material-symbols-outlined text-xl" aria-hidden="true">style</span>
          <span class="text-sm">{{ $t('navbar.reviewHall') }}</span>
        </router-link>
        <a
          class="sidebar-link"
          href="#timetable"
        >
          <span class="material-symbols-outlined text-xl" aria-hidden="true">calendar_month</span>
          <span class="text-sm">{{ $t('dashboard.myTimetable') }}</span>
        </a>
        <a
          class="sidebar-link"
          href="#grades"
        >
          <span class="material-symbols-outlined text-xl" aria-hidden="true">grade</span>
          <span class="text-sm">{{ $t('dashboard.myGrades') }}</span>
        </a>
      </nav>

      <div class="mt-auto px-3 flex flex-col gap-2 font-body">
        <div class="pt-4 border-t border-outline-variant/15 flex flex-col gap-1">
          <a class="sidebar-link text-sm" href="#">
            <span class="material-symbols-outlined text-base" aria-hidden="true">settings</span>
            <span>{{ $t('dashboard.settings') }}</span>
          </a>
          <a class="sidebar-link text-sm" href="#">
            <span class="material-symbols-outlined text-base" aria-hidden="true">help_outline</span>
            <span>{{ $t('dashboard.help') }}</span>
          </a>
        </div>
      </div>
    </aside>

    <header
      class="fixed top-0 left-[220px] right-0 h-16 z-40 flex justify-between items-center px-8"
      style="background: rgba(255,255,255,0.92); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-bottom: 1px solid rgba(171,179,183,0.15); box-shadow: 0 2px 12px rgba(51,94,161,0.05);"
    >
      <div class="flex items-center gap-6">
        <nav class="flex gap-1" aria-label="顶部导航">
          <router-link
            to="/courses"
            class="top-nav-link top-nav-link-active"
          >
            {{ $t('dashboard.explore') }}
          </router-link>
          <a class="top-nav-link" href="#">
            {{ $t('dashboard.archive') }}
          </a>
          <a class="top-nav-link" href="#">
            {{ $t('dashboard.community') }}
          </a>
        </nav>
      </div>
      <div class="flex items-center gap-4">
        <button class="text-on-surface-variant hover:text-primary transition-all p-2 rounded-lg hover:bg-surface-container" aria-label="通知">
          <span class="material-symbols-outlined">notifications</span>
        </button>
        <div class="flex items-center gap-3 pl-4 border-l border-outline-variant/20">
          <div class="text-right">
            <p class="text-sm font-bold text-on-surface font-body">{{ studentName ?? '同学' }}</p>
            <p class="text-[10px] text-on-surface-variant tracking-wider uppercase font-body">{{ $t('dashboard.studentRole') }}</p>
          </div>
          <div
            class="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
            style="background: linear-gradient(135deg, #335ea1 0%, #60a5fa 100%);"
            aria-label="用户头像"
          >
            李
          </div>
        </div>
      </div>
    </header>

    <main class="ml-[220px] pt-16 min-h-screen">
      <div class="max-w-5xl mx-auto px-8 py-10">

        <section class="mb-10 pt-4">
          <div class="flex items-center gap-4 mb-1">
            <div
              class="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-md"
              style="background: linear-gradient(135deg, #335ea1 0%, #60a5fa 100%);"
            >
              {{ (studentName ?? '同')[0] }}
            </div>
            <div>
              <h1 class="text-3xl font-extrabold text-on-surface tracking-tight font-headline">
                {{ $t('dashboard.welcome') }}{{ studentName ?? '同学' }} 👋
              </h1>
              <p class="text-on-surface-variant font-body text-sm mt-0.5">
                {{ $t('dashboard.subtitle') }}
              </p>
            </div>
          </div>
        </section>

        <section id="timetable" class="mb-12">
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-xl font-bold text-on-surface font-headline flex items-center gap-2">
              <span class="material-symbols-outlined text-primary" aria-hidden="true">calendar_month</span>
              {{ $t('dashboard.myTimetable') }}
            </h2>
            <span class="text-xs text-on-surface-variant font-body">{{ $t('dashboard.thisWeek') }}</span>
          </div>

          <div
            v-if="timetableLoading"
            class="flex items-center justify-center py-16 gap-3 text-on-surface-variant"
            role="status"
            aria-live="polite"
          >
            <span class="material-symbols-outlined animate-spin text-primary text-2xl" aria-hidden="true">progress_activity</span>
            <span class="text-sm font-body">{{ $t('dashboard.loadingTimetable') }}</span>
          </div>

          <div
            v-else-if="timetableError"
            class="flex items-center gap-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm"
            role="alert"
          >
            <span class="material-symbols-outlined text-xl shrink-0" aria-hidden="true">error_outline</span>
            <span class="flex-1">{{ timetableError }}</span>
            <button
              type="button"
              class="underline text-xs font-semibold shrink-0 hover:no-underline"
              @click="loadTimetable"
            >
              {{ $t('dashboard.retry') }}
            </button>
          </div>

          <div
            v-else
            class="grid grid-cols-7 gap-3"
            role="grid"
            aria-label="本周课表"
          >
            <div
              v-for="dayInfo in weekDays"
              :key="dayInfo.day"
              class="flex flex-col gap-2"
              role="gridcell"
            >
              <div
                class="text-center py-2 rounded-xl text-xs font-bold uppercase tracking-wider"
                :class="
                  dayInfo.entries.length > 0
                    ? 'text-white'
                    : 'bg-white text-on-surface-variant border border-outline-variant/20'"
                :style="dayInfo.entries.length > 0 ? 'background: linear-gradient(135deg, #335ea1 0%, #4f7fd4 100%);' : ''"
              >
                {{ dayInfo.name }}
              </div>

              <div
                v-if="dayInfo.entries.length === 0"
                class="flex-1 flex items-center justify-center py-6 rounded-xl border border-dashed border-outline-variant/30 bg-white/50 text-on-surface-variant"
              >
                <span class="text-[11px] text-center leading-relaxed opacity-50" v-html="$t('dashboard.noClassToday')"></span>
              </div>

              <div
                v-for="(entry, idx) in dayInfo.entries"
                :key="idx"
                class="rounded-xl p-3 flex flex-col gap-1 border border-primary/10"
                style="background: linear-gradient(135deg, #eef3fc 0%, #f0f4ff 100%);"
              >
                <p class="text-xs font-bold text-on-surface leading-snug line-clamp-2">
                  {{ entry.courseName }}
                </p>
                <p class="text-[11px] text-on-surface-variant flex items-center gap-1">
                  <span class="material-symbols-outlined text-xs text-primary/60" aria-hidden="true">schedule</span>
                  {{ entry.startTime }}–{{ entry.endTime }}
                </p>
                <p class="text-[11px] text-on-surface-variant flex items-center gap-1">
                  <span class="material-symbols-outlined text-xs text-primary/60" aria-hidden="true">location_on</span>
                  {{ entry.location }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="grades">
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-xl font-bold text-on-surface font-headline flex items-center gap-2">
              <span class="material-symbols-outlined text-primary" aria-hidden="true">grade</span>
              {{ $t('dashboard.myGrades') }}
            </h2>
          </div>

          <div
            v-if="gradesLoading"
            class="flex items-center justify-center py-16 gap-3 text-on-surface-variant"
            role="status"
            aria-live="polite"
          >
            <span class="material-symbols-outlined animate-spin text-primary text-2xl" aria-hidden="true">progress_activity</span>
            <span class="text-sm font-body">{{ $t('dashboard.loadingGrades') }}</span>
          </div>

          <div
            v-else-if="gradesError"
            class="flex items-center gap-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm"
            role="alert"
          >
            <span class="material-symbols-outlined text-xl shrink-0" aria-hidden="true">error_outline</span>
            <span class="flex-1">{{ gradesError }}</span>
            <button
              type="button"
              class="underline text-xs font-semibold shrink-0 hover:no-underline"
              @click="loadGrades"
            >
              {{ $t('dashboard.retry') }}
            </button>
          </div>

          <div
            v-else
            class="bg-white rounded-2xl overflow-hidden border border-outline-variant/10"
            style="box-shadow: 0 2px 12px rgba(51,94,161,0.06);"
          >
            <el-table
              :data="grades"
              style="width: 100%"
              :header-cell-style="{
                background: '#f8fafc',
                color: '#475569',
                fontWeight: '700',
                fontSize: '13px',
                padding: '16px 20px',
                borderBottom: '1px solid rgba(171,179,183,0.2)',
              }"
              :cell-style="{ padding: '16px 20px', fontSize: '14px' }"
              stripe
            >
              <el-table-column prop="courseName" :label="$t('dashboard.courseName')" min-width="180">
                <template #default="{ row }">
                  <span class="font-semibold text-on-surface">{{ row.courseName }}</span>
                </template>
              </el-table-column>

              <el-table-column prop="semester" :label="$t('dashboard.semester')" width="110">
                <template #default="{ row }">
                  <el-tag size="small" type="info" effect="plain">{{ row.semester }}</el-tag>
                </template>
              </el-table-column>

              <el-table-column prop="grade" :label="$t('dashboard.score')" width="120" align="center">
                <template #default="{ row }">
                  <span
                    v-if="row.grade !== null"
                    class="font-bold text-base"
                    :class="gradeColorClass(row.grade)"
                  >
                    {{ row.grade }}
                  </span>
                  <el-tag v-else size="small" type="warning" effect="light">{{ $t('dashboard.unrated') }}</el-tag>
                </template>
              </el-table-column>

              <el-table-column prop="attendanceRate" :label="$t('dashboard.attendanceRate')" width="200" align="center">
                <template #default="{ row }">
                  <div class="flex items-center gap-3">
                    <div class="flex-1 h-2 rounded-full overflow-hidden" style="background: #e2e8f0; min-width: 80px;">
                      <div
                        class="h-full rounded-full transition-all duration-700"
                        :style="{
                          width: row.attendanceRate + '%',
                          background: attendanceGradient(row.attendanceRate),
                        }"
                      />
                    </div>
                    <span
                      class="text-xs font-bold w-10 text-right"
                      :style="{ color: attendanceTextColor(row.attendanceRate) }"
                    >
                      {{ row.attendanceRate }}%
                    </span>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </section>

      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElTable, ElTableColumn, ElTag } from 'element-plus'
import { getTimetable, getGrades, type TimetableEntry, type GradeEntry } from '@/api/gateway'
import { useStudentAuth } from '@/composables/useStudentAuth'

const { t } = useI18n()
const { studentId, studentName } = useStudentAuth()

const STUDENT_ID = studentId.value ?? 'anonymous'

const DAY_KEYS = ['', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

// ===== 课表状态 =====
const timetable = ref<TimetableEntry[]>([])
const timetableLoading = ref(false)
const timetableError = ref('')

// ===== 成绩状态 =====
const grades = ref<GradeEntry[]>([])
const gradesLoading = ref(false)
const gradesError = ref('')

// ===== 计算属性：周视图 =====
const weekDays = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const day = i + 1
    return {
      day,
      name: t(`dashboard.weekdays.${DAY_KEYS[day]}`),
      entries: timetable.value
        .filter((e) => e.dayOfWeek === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }
  }),
)

// ===== API 调用 =====
async function loadTimetable() {
  timetableLoading.value = true
  timetableError.value = ''
  try {
    timetable.value = await getTimetable(STUDENT_ID)
  } catch (e) {
    timetableError.value = e instanceof Error ? e.message : t('dashboard.loadTimetableError')
  } finally {
    timetableLoading.value = false
  }
}

async function loadGrades() {
  gradesLoading.value = true
  gradesError.value = ''
  try {
    grades.value = await getGrades(STUDENT_ID)
  } catch (e) {
    gradesError.value = e instanceof Error ? e.message : t('dashboard.loadGradesError')
  } finally {
    gradesLoading.value = false
  }
}

// ===== 样式辅助 =====
function gradeColorClass(grade: number): string {
  if (grade >= 90) return 'text-green-600'
  if (grade >= 75) return 'text-blue-600'
  if (grade >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

// 出勤率渐变色（蓝→绿）
function attendanceGradient(rate: number): string {
  if (rate >= 90) return 'linear-gradient(90deg, #3b82f6 0%, #22c55e 100%)'
  if (rate >= 75) return 'linear-gradient(90deg, #60a5fa 0%, #34d399 100%)'
  if (rate >= 60) return 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)'
  return 'linear-gradient(90deg, #f87171 0%, #ef4444 100%)'
}

function attendanceTextColor(rate: number): string {
  if (rate >= 90) return '#16a34a'
  if (rate >= 75) return '#2563eb'
  if (rate >= 60) return '#d97706'
  return '#dc2626'
}

// 异步状态隔离：防止单接口崩溃阻塞全局渲染
onMounted(() => {
  void Promise.allSettled([
    loadTimetable(),
    loadGrades(),
  ])
})
</script>

<style scoped>
/* ===== 侧边栏导航链接 ===== */
.sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  color: var(--color-on-surface-variant);
  text-decoration: none;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}

.sidebar-link:hover {
  color: var(--color-primary);
  background: rgba(51, 94, 161, 0.06);
}

.sidebar-link-active {
  color: var(--color-primary) !important;
  background: rgba(51, 94, 161, 0.1) !important;
  font-weight: 700;
}

/* ===== 顶部导航链接 ===== */
.top-nav-link {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 0.875rem;
  border-radius: 0.625rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-on-surface-variant);
  text-decoration: none;
  transition: all 0.2s ease;
  font-family: var(--font-headline);
  letter-spacing: 0.01em;
}

.top-nav-link:hover {
  color: var(--color-primary);
  background: rgba(51, 94, 161, 0.06);
}

.top-nav-link-active {
  color: var(--color-primary) !important;
  font-weight: 700;
  background: rgba(51, 94, 161, 0.08) !important;
}

/* ===== 课表卡片区域 ===== */
section {
  background: transparent;
}

/* 课表和成绩区域的白色卡片容器 */
#timetable > div:last-child,
#grades > div:last-child {
  background: white;
  border-radius: 1.25rem;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(51, 94, 161, 0.06);
  border: 1px solid rgba(171, 179, 183, 0.12);
}
</style>