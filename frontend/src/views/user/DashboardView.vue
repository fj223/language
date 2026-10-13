<template>
  <div class="text-on-background min-h-screen" style="background: #f5f7fa;">

    <aside
      class="fixed left-0 top-0 h-full w-[240px] hidden lg:flex flex-col py-8 z-50"
      style="background: #ffffff; border-right: 1px solid rgba(171,179,183,0.15); box-shadow: 2px 0 16px rgba(51,94,161,0.05);"
      :aria-label="$t('dashboard.sidebarNav')"
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
            <span class="text-base font-extrabold tracking-tight text-primary font-headline">{{ $t('navbar.brand') }}</span>
          </div>
        </router-link>
        <p class="text-[10px] text-on-surface-variant mt-1.5 font-medium tracking-widest uppercase font-body pl-9">
          OpenEdu
        </p>
      </div>

      <nav class="flex flex-col gap-1 flex-grow font-body px-3">
        <a
          class="sidebar-link sidebar-link-active"
          href="#overview"
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
          href="#enrollments"
        >
          <span class="material-symbols-outlined text-xl" aria-hidden="true">assignment_turned_in</span>
          <span class="text-sm">{{ $t('dashboard.enrollments') }}</span>
        </a>
        <a
          class="sidebar-link"
          href="#favorites"
        >
          <span class="material-symbols-outlined text-xl" aria-hidden="true">favorite</span>
          <span class="text-sm">{{ $t('dashboard.favorites') }}</span>
        </a>
        <a
          class="sidebar-link"
          href="#reminders"
        >
          <span class="material-symbols-outlined text-xl" aria-hidden="true">notifications_active</span>
          <span class="text-sm">{{ $t('dashboard.reminders') }}</span>
        </a>
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

      <div class="mt-auto px-3 font-body">
        <div class="pt-4 border-t border-outline-variant/15">
          <button class="sidebar-link text-sm" type="button" @click="handleLogout">
            <span class="material-symbols-outlined text-base" aria-hidden="true">logout</span>
            <span>{{ $t('navbar.logout') }}</span>
          </button>
        </div>
      </div>
    </aside>

    <header
      class="fixed top-0 left-0 lg:left-[240px] right-0 h-16 z-40 flex justify-between items-center px-4 sm:px-8"
      style="background: rgba(255,255,255,0.92); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-bottom: 1px solid rgba(171,179,183,0.15); box-shadow: 0 2px 12px rgba(51,94,161,0.05);"
    >
      <div class="flex items-center gap-6">
        <router-link to="/" class="lg:hidden flex items-center gap-2 font-headline font-extrabold text-primary">
          <span class="material-symbols-outlined">school</span>
          OpenEdu
        </router-link>
        <nav class="hidden lg:flex gap-1" :aria-label="$t('dashboard.topNav')">
          <router-link
            to="/courses"
            class="top-nav-link top-nav-link-active"
          >
            {{ $t('dashboard.explore') }}
          </router-link>
        </nav>
      </div>
      <div class="flex items-center gap-4">
        <LanguageSwitcher />
        <div class="flex items-center gap-3">
          <div class="text-right">
            <p class="text-sm font-bold text-on-surface font-body">{{ studentName ?? $t('dashboard.studentFallback') }}</p>
            <p class="text-[10px] text-on-surface-variant tracking-wider uppercase font-body">{{ $t('dashboard.studentRole') }}</p>
          </div>
          <div
            class="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
            style="background: linear-gradient(135deg, #335ea1 0%, #60a5fa 100%);"
            :aria-label="$t('dashboard.avatar')"
          >
            {{ (studentName ?? $t('dashboard.avatarFallback'))[0] }}
          </div>
        </div>
      </div>
    </header>

    <main class="ml-0 lg:ml-[240px] pt-16 min-h-screen">
      <div class="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-10">

        <section id="overview" class="mb-10 scroll-mt-24 pt-4">
          <div class="flex items-center gap-4 mb-1">
            <div
              class="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-md"
              style="background: linear-gradient(135deg, #335ea1 0%, #60a5fa 100%);"
            >
              {{ (studentName ?? $t('dashboard.avatarFallback'))[0] }}
            </div>
            <div>
              <h1 class="text-3xl font-extrabold text-on-surface tracking-tight font-headline">
                {{ $t('dashboard.welcome') }}{{ studentName ?? $t('dashboard.studentFallback') }} 👋
              </h1>
              <p class="text-on-surface-variant font-body text-sm mt-0.5">
                {{ $t('dashboard.subtitle') }}
              </p>
              <div
                class="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
                :class="integrationStatus?.provider === 'external' && integrationStatus.configured
                  ? 'bg-emerald-50 text-emerald-700'
                  : integrationStatus?.provider === 'mock'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-slate-100 text-slate-600'"
                :title="integrationStatus?.checkedAt"
              >
                <span class="material-symbols-outlined text-sm" aria-hidden="true">
                  {{ integrationStatus?.provider === 'external' && integrationStatus.configured ? 'cloud_done' : 'database' }}
                </span>
                {{ integrationStatusLabel }}
              </div>
            </div>
          </div>
        </section>

        <section class="mb-10 grid grid-cols-1 sm:grid-cols-3 gap-4" :aria-label="$t('dashboard.learningOverview')">
          <article v-for="metric in overviewMetrics" :key="metric.label" class="overview-card">
            <div class="grid h-10 w-10 place-items-center rounded-xl" :style="{ background: metric.background, color: metric.color }">
              <span class="material-symbols-outlined text-xl" aria-hidden="true">{{ metric.icon }}</span>
            </div>
            <div>
              <p class="text-2xl font-black text-on-surface leading-none">{{ metric.value }}</p>
              <p class="mt-1 text-xs font-semibold text-on-surface-variant">{{ metric.label }}</p>
            </div>
          </article>
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

          <div v-else class="overflow-x-auto pb-2">
            <div
              class="grid min-w-[840px] grid-cols-7 gap-3"
              role="grid"
              :aria-label="$t('dashboard.weekSchedule')"
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
          </div>
        </section>

        <section id="enrollments" class="mb-12 scroll-mt-24">
          <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="flex items-center gap-2 text-xl font-bold text-on-surface font-headline">
                <span class="material-symbols-outlined text-indigo-500" aria-hidden="true">assignment_turned_in</span>
                {{ $t('dashboard.myEnrollments') }}
              </h2>
              <p class="mt-1 text-xs text-on-surface-variant">{{ $t('dashboard.enrollmentDescription') }}</p>
            </div>
            <router-link to="/courses" class="rounded-xl border border-primary/20 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/5">{{ $t('dashboard.chooseCourse') }}</router-link>
          </div>
          <div v-if="enrollmentsLoading" class="rounded-2xl bg-white p-10 text-center text-sm text-on-surface-variant">{{ $t('dashboard.loadingEnrollments') }}</div>
          <div v-else-if="enrollmentsError" class="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {{ enrollmentsError }}
            <button type="button" class="ml-2 font-bold underline" @click="loadEnrollments">{{ $t('dashboard.retry') }}</button>
          </div>
          <div v-else-if="!enrollments.length" class="rounded-2xl border border-dashed border-outline-variant/30 bg-white p-10 text-center">
            <span class="material-symbols-outlined text-5xl text-slate-300">assignment_add</span>
            <p class="mt-3 font-bold text-on-surface">{{ $t('dashboard.noEnrollments') }}</p>
            <p class="mt-1 text-sm text-on-surface-variant">{{ $t('dashboard.noEnrollmentsHint') }}</p>
          </div>
          <div v-else class="grid gap-4 md:grid-cols-2">
            <article v-for="item in enrollments" :key="item.id" class="rounded-2xl border border-outline-variant/20 bg-white p-5 shadow-sm">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="font-black text-on-surface">{{ item.courseTitle }}</p>
                  <p class="mt-1 text-xs text-on-surface-variant">{{ item.language }} · {{ item.level ?? $t('courseList.levelPending') }} · {{ item.teacher ?? $t('courseList.teacherPending') }}</p>
                </div>
                <span class="shrink-0 rounded-full px-3 py-1 text-xs font-black" :class="enrollmentStatusMeta(item.status).className">
                  {{ enrollmentStatusMeta(item.status).label }}
                </span>
              </div>
              <p class="mt-4 text-xs text-on-surface-variant">{{ $t('dashboard.submittedAt', { date: formatFullDate(item.createdAt) }) }}</p>
              <p v-if="item.studentNote" class="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">{{ $t('dashboard.myNote') }}：{{ item.studentNote }}</p>
              <p v-if="item.adminNote" class="mt-3 rounded-xl bg-indigo-50 p-3 text-xs leading-5 text-indigo-700">{{ $t('dashboard.reviewNote') }}：{{ item.adminNote }}</p>
              <div class="mt-4 flex gap-3">
                <router-link :to="item.status === 'APPROVED' ? `/learn/${item.courseId}` : `/courses/${item.courseId}`" class="flex-1 rounded-xl bg-primary/10 py-2.5 text-center text-sm font-bold text-primary">{{ item.status === 'APPROVED' ? $t('dashboard.startLearning') : $t('dashboard.viewCourse') }}</router-link>
                <button
                  v-if="item.status === 'PENDING' || item.status === 'APPROVED'"
                  type="button"
                  class="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-600 disabled:opacity-50"
                  :disabled="enrollmentActionId === item.id"
                  @click="cancelEnrollmentItem(item)"
                >
                  {{ enrollmentActionId === item.id ? $t('dashboard.processing') : $t('dashboard.cancelApplication') }}
                </button>
              </div>
            </article>
          </div>
        </section>

        <section id="favorites" class="mb-12 scroll-mt-24">
          <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="flex items-center gap-2 text-xl font-bold text-on-surface font-headline">
                <span class="material-symbols-outlined text-rose-500" aria-hidden="true">favorite</span>
                {{ $t('dashboard.myFavorites') }}
              </h2>
              <p class="mt-1 text-xs text-on-surface-variant">{{ $t('dashboard.favoritesDescription') }}</p>
            </div>
            <router-link to="/courses" class="rounded-xl border border-primary/20 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/5">{{ $t('dashboard.browseCourses') }}</router-link>
          </div>
          <div v-if="favoritesLoading" class="rounded-2xl bg-white p-10 text-center text-sm text-on-surface-variant">{{ $t('dashboard.loadingFavorites') }}</div>
          <div v-else-if="favoritesError" class="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {{ favoritesError }}
            <button type="button" class="ml-2 font-bold underline" @click="loadFavorites">{{ $t('dashboard.retry') }}</button>
          </div>
          <div v-else-if="!favorites.length" class="rounded-2xl border border-dashed border-outline-variant/30 bg-white p-10 text-center">
            <span class="material-symbols-outlined text-5xl text-slate-300">bookmark_add</span>
            <p class="mt-3 font-bold text-on-surface">{{ $t('dashboard.noFavorites') }}</p>
            <p class="mt-1 text-sm text-on-surface-variant">{{ $t('dashboard.noFavoritesHint') }}</p>
          </div>
          <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <article v-for="item in favorites" :key="item.id" class="overflow-hidden rounded-2xl bg-white shadow-sm">
              <img :src="item.coverUrl || fallbackCover" :alt="item.title" class="aspect-video w-full object-cover" />
              <div class="p-4">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="font-black text-on-surface">{{ item.title }}</p>
                    <p class="mt-1 text-xs text-on-surface-variant">{{ item.language }} · {{ item.level ?? $t('courseList.levelPending') }}</p>
                  </div>
                  <button type="button" :disabled="favoriteRemovingId === item.courseId" class="text-slate-400 hover:text-rose-500 disabled:opacity-40" :aria-label="$t('dashboard.removeFavoriteLabel', { title: item.title })" @click="removeSavedCourse(item.courseId)">
                    <span class="material-symbols-outlined">delete</span>
                  </button>
                </div>
                <router-link :to="`/courses/${item.courseId}`" class="mt-4 flex w-full items-center justify-center rounded-xl bg-primary/10 py-2.5 text-sm font-bold text-primary hover:bg-primary/15">{{ $t('dashboard.viewCourse') }}</router-link>
              </div>
            </article>
          </div>
        </section>

        <section id="reminders" class="mb-12 scroll-mt-24">
          <div class="mb-5">
            <h2 class="flex items-center gap-2 text-xl font-bold text-on-surface font-headline">
              <span class="material-symbols-outlined text-amber-500" aria-hidden="true">notifications_active</span>
              {{ $t('dashboard.studyReminders') }}
            </h2>
            <p class="mt-1 text-xs text-on-surface-variant">{{ $t('dashboard.remindersDescription') }}</p>
          </div>
          <div class="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
            <form class="rounded-2xl bg-white p-5 shadow-sm" @submit.prevent="submitReminder">
              <h3 class="font-black text-on-surface">{{ $t('dashboard.createReminder') }}</h3>
              <label class="mt-4 block text-xs font-bold text-on-surface-variant">{{ $t('dashboard.reminderContent') }}
                <input v-model.trim="reminderForm.title" required maxlength="160" class="reminder-field" :placeholder="$t('dashboard.reminderPlaceholder')" />
              </label>
              <label class="mt-4 block text-xs font-bold text-on-surface-variant">{{ $t('dashboard.reminderTime') }}
                <input v-model="reminderForm.remindAt" required type="datetime-local" :min="minimumReminderTime" class="reminder-field" />
              </label>
              <label class="mt-4 block text-xs font-bold text-on-surface-variant">{{ $t('dashboard.linkedCourse') }}
                <select v-model="reminderForm.courseId" class="reminder-field">
                  <option value="">{{ $t('dashboard.noLinkedCourse') }}</option>
                  <option v-for="item in favorites" :key="item.courseId" :value="item.courseId">{{ item.title }}</option>
                </select>
              </label>
              <label class="mt-4 block text-xs font-bold text-on-surface-variant">{{ $t('dashboard.optionalNote') }}
                <textarea v-model.trim="reminderForm.note" maxlength="500" rows="3" class="reminder-field resize-none" />
              </label>
              <p v-if="reminderError" class="mt-3 text-xs font-bold text-red-600" role="alert">{{ reminderError }}</p>
              <button type="submit" :disabled="reminderSaving" class="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-black text-white disabled:opacity-50">
                {{ reminderSaving ? $t('dashboard.creating') : $t('dashboard.createStudyReminder') }}
              </button>
            </form>

            <div class="rounded-2xl bg-white p-5 shadow-sm">
              <div class="flex items-center justify-between">
                <h3 class="font-black text-on-surface">{{ $t('dashboard.reminderList') }}</h3>
                <span class="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{{ $t('dashboard.pendingCount', { count: pendingReminderCount }) }}</span>
              </div>
              <div v-if="remindersLoading" class="py-12 text-center text-sm text-on-surface-variant">{{ $t('dashboard.loadingReminders') }}</div>
              <div v-else-if="!reminders.length" class="py-12 text-center text-sm text-on-surface-variant">
                <span class="material-symbols-outlined mb-2 block text-4xl text-slate-300">notifications_none</span>
                {{ $t('dashboard.noReminders') }}
              </div>
              <div v-else class="mt-4 space-y-3">
                <article v-for="item in reminders" :key="item.id" class="flex items-start gap-3 rounded-xl border p-4" :class="item.completedAt ? 'border-slate-100 bg-slate-50 opacity-65' : isOverdue(item) ? 'border-rose-200 bg-rose-50' : 'border-slate-100'">
                  <button type="button" class="mt-0.5 text-primary" :aria-label="item.completedAt ? $t('dashboard.markIncomplete') : $t('dashboard.markComplete')" @click="toggleReminder(item)">
                    <span class="material-symbols-outlined">{{ item.completedAt ? 'check_circle' : 'radio_button_unchecked' }}</span>
                  </button>
                  <div class="min-w-0 flex-1">
                    <p class="font-bold text-on-surface" :class="{ 'line-through': item.completedAt }">{{ item.title }}</p>
                    <p class="mt-1 text-xs" :class="isOverdue(item) && !item.completedAt ? 'font-bold text-rose-600' : 'text-on-surface-variant'">
                      {{ formatReminderDate(item.remindAt) }}{{ isOverdue(item) && !item.completedAt ? ` · ${$t('dashboard.overdue')}` : '' }}
                    </p>
                    <p v-if="item.note" class="mt-2 text-xs leading-5 text-on-surface-variant">{{ item.note }}</p>
                  </div>
                  <button type="button" class="text-slate-400 hover:text-rose-500" :aria-label="$t('dashboard.deleteReminder')" @click="removeReminderItem(item)">
                    <span class="material-symbols-outlined">delete</span>
                  </button>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section id="grades" class="scroll-mt-24">
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
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ElTable, ElTableColumn, ElTag } from 'element-plus'
import {
  getGrades,
  getIntegrationStatus,
  getTimetable,
  type GradeEntry,
  type IntegrationStatus,
  type TimetableEntry,
} from '@/api/gateway'
import { useStudentAuth } from '@/composables/useStudentAuth'
import LanguageSwitcher from '@/components/layout/LanguageSwitcher.vue'
import {
  cancelEnrollment,
  createReminder,
  deleteReminder,
  getEnrollments,
  getFavorites,
  getReminders,
  removeFavorite,
  setReminderCompleted,
  type CourseFavorite,
  type EnrollmentApplication,
  type EnrollmentStatus,
  type LearningReminder,
} from '@/api/studentFeatures'
import fallbackCover from '@/assets/hero.png'
import { confirmAction } from '@/utils/confirmAction'

const { t, locale } = useI18n()
const router = useRouter()
const { studentName, logout } = useStudentAuth()

const DAY_KEYS = ['', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

// ===== 课表状态 =====
const timetable = ref<TimetableEntry[]>([])
const timetableLoading = ref(false)
const timetableError = ref('')

// ===== 成绩状态 =====
const grades = ref<GradeEntry[]>([])
const gradesLoading = ref(false)
const gradesError = ref('')
const integrationStatus = ref<IntegrationStatus | null>(null)
const favorites = ref<CourseFavorite[]>([])
const favoritesLoading = ref(false)
const favoritesError = ref('')
const favoriteRemovingId = ref('')
const enrollments = ref<EnrollmentApplication[]>([])
const enrollmentsLoading = ref(false)
const enrollmentsError = ref('')
const enrollmentActionId = ref('')
const reminders = ref<LearningReminder[]>([])
const remindersLoading = ref(false)
const reminderSaving = ref(false)
const reminderError = ref('')
const reminderForm = ref({ title: '', note: '', courseId: '', remindAt: '' })
const minimumReminderTime = computed(() => toLocalInput(new Date(Date.now() + 60_000)))
const pendingReminderCount = computed(() => reminders.value.filter((item) => !item.completedAt).length)
const dateLocale = computed(() => locale.value === 'ru' ? 'ru-RU' : locale.value === 'en' ? 'en-US' : 'zh-CN')
const integrationStatusLabel = computed(() => {
  if (!integrationStatus.value) return t('dashboard.checkingDataSource')
  if (!integrationStatus.value.configured) return t('dashboard.dataSourceUnavailable')
  return integrationStatus.value.provider === 'mock'
    ? t('dashboard.dataSourceDemo')
    : t('dashboard.dataSourceExternal')
})

const overviewMetrics = computed(() => {
  const graded = grades.value.filter((item) => item.grade !== null)
  const averageGrade = graded.length
    ? Math.round(graded.reduce((sum, item) => sum + (item.grade ?? 0), 0) / graded.length)
    : '—'
  const averageAttendance = grades.value.length
    ? `${Math.round(grades.value.reduce((sum, item) => sum + item.attendanceRate, 0) / grades.value.length)}%`
    : '—'

  return [
    { icon: 'event_available', value: timetable.value.length, label: t('dashboard.weeklyCourses'), color: '#335ea1', background: '#eef3fc' },
    { icon: 'workspace_premium', value: averageGrade, label: t('dashboard.averageGrade'), color: '#7c3aed', background: '#f3e8ff' },
    { icon: 'how_to_reg', value: averageAttendance, label: t('dashboard.averageAttendance'), color: '#059669', background: '#ecfdf5' },
  ]
})

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
    timetable.value = await getTimetable(locale.value)
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
    grades.value = await getGrades(locale.value)
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

async function loadFavorites() {
  favoritesLoading.value = true
  favoritesError.value = ''
  try {
    favorites.value = await getFavorites(locale.value)
  } catch (error) {
    favoritesError.value = error instanceof Error ? error.message : t('dashboard.favoritesLoadError')
  } finally {
    favoritesLoading.value = false
  }
}

async function removeSavedCourse(courseId: string) {
  if (favoriteRemovingId.value) return
  favoriteRemovingId.value = courseId
  try {
    await removeFavorite(courseId)
    favorites.value = favorites.value.filter((item) => item.courseId !== courseId)
  } catch (error) {
    favoritesError.value = error instanceof Error ? error.message : t('dashboard.removeFavoriteError')
  } finally {
    favoriteRemovingId.value = ''
  }
}

async function loadEnrollments() {
  enrollmentsLoading.value = true
  enrollmentsError.value = ''
  try {
    enrollments.value = await getEnrollments(locale.value)
  } catch (error) {
    enrollmentsError.value = error instanceof Error ? error.message : t('dashboard.enrollmentsLoadError')
  } finally {
    enrollmentsLoading.value = false
  }
}

async function cancelEnrollmentItem(item: EnrollmentApplication) {
  if (enrollmentActionId.value) return
  const confirmed = await confirmAction(t('dashboard.cancelEnrollmentConfirm', { title: item.courseTitle }), {
    title: t('admin.common.confirm'),
    confirmText: t('dashboard.cancelApplication'),
    cancelText: t('admin.common.cancel'),
    danger: true,
  })
  if (!confirmed) return
  enrollmentActionId.value = item.id
  enrollmentsError.value = ''
  try {
    const updated = await cancelEnrollment(item.id)
    enrollments.value = enrollments.value.map((current) => current.id === updated.id ? updated : current)
  } catch (error) {
    enrollmentsError.value = error instanceof Error ? error.message : t('dashboard.cancelEnrollmentError')
  } finally {
    enrollmentActionId.value = ''
  }
}

function enrollmentStatusMeta(status: EnrollmentStatus) {
  return {
    PENDING: { label: t('dashboard.statusPending'), className: 'bg-amber-100 text-amber-700' },
    APPROVED: { label: t('dashboard.statusApproved'), className: 'bg-emerald-100 text-emerald-700' },
    REJECTED: { label: t('dashboard.statusRejected'), className: 'bg-rose-100 text-rose-700' },
    CANCELLED: { label: t('dashboard.statusCancelled'), className: 'bg-slate-100 text-slate-600' },
  }[status]
}

function formatFullDate(value: string) {
  return new Date(value).toLocaleString(dateLocale.value, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function loadReminders() {
  remindersLoading.value = true
  try {
    reminders.value = await getReminders()
  } catch (error) {
    reminderError.value = error instanceof Error ? error.message : t('dashboard.remindersLoadError')
  } finally {
    remindersLoading.value = false
  }
}

async function submitReminder() {
  reminderSaving.value = true
  reminderError.value = ''
  try {
    const created = await createReminder({
      title: reminderForm.value.title,
      note: reminderForm.value.note || undefined,
      courseId: reminderForm.value.courseId || undefined,
      remindAt: new Date(reminderForm.value.remindAt).toISOString(),
    })
    reminders.value = [...reminders.value, created].sort((a, b) => a.remindAt.localeCompare(b.remindAt))
    reminderForm.value = { title: '', note: '', courseId: '', remindAt: '' }
  } catch (error) {
    reminderError.value = error instanceof Error ? error.message : t('dashboard.createReminderError')
  } finally {
    reminderSaving.value = false
  }
}

async function toggleReminder(item: LearningReminder) {
  try {
    const updated = await setReminderCompleted(item.id, !item.completedAt)
    reminders.value = reminders.value.map((current) => current.id === updated.id ? updated : current)
  } catch (error) {
    reminderError.value = error instanceof Error ? error.message : t('dashboard.updateReminderError')
  }
}

async function removeReminderItem(item: LearningReminder) {
  const confirmed = await confirmAction(t('dashboard.deleteReminderConfirm', { title: item.title }), {
    title: t('admin.common.confirm'),
    confirmText: t('dashboard.deleteReminder'),
    cancelText: t('admin.common.cancel'),
    danger: true,
  })
  if (!confirmed) return
  try {
    await deleteReminder(item.id)
    reminders.value = reminders.value.filter((current) => current.id !== item.id)
  } catch (error) {
    reminderError.value = error instanceof Error ? error.message : t('dashboard.deleteReminderError')
  }
}

function isOverdue(item: LearningReminder) {
  return !item.completedAt && new Date(item.remindAt).getTime() < Date.now()
}

function formatReminderDate(value: string) {
  return new Date(value).toLocaleString(dateLocale.value, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function toLocalInput(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

async function loadIntegrationStatus() {
  try {
    integrationStatus.value = await getIntegrationStatus()
  } catch {
    integrationStatus.value = {
      provider: 'external',
      label: t('dashboard.dataSourceUnknown'),
      configured: false,
      checkedAt: new Date().toISOString(),
      courseCache: {
        state: 'empty',
        itemCount: 0,
        fetchedAt: null,
        expiresAt: null,
      },
      telemetry: {
        requestCount: 0,
        attemptCount: 0,
        successCount: 0,
        failureCount: 0,
        retryCount: 0,
        lastSuccessAt: null,
        lastFailureAt: null,
        lastError: null,
        lastLatencyMs: null,
      },
    }
  }
}

function handleLogout() {
  logout()
  router.push('/auth')
}

// 异步状态隔离：防止单接口崩溃阻塞全局渲染
onMounted(() => {
  void Promise.allSettled([
    loadTimetable(),
    loadGrades(),
    loadIntegrationStatus(),
    loadEnrollments(),
    loadFavorites(),
    loadReminders(),
  ])
})

watch(locale, () => {
  void Promise.allSettled([loadTimetable(), loadGrades(), loadEnrollments(), loadFavorites()])
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

.overview-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid rgba(171, 179, 183, 0.14);
  border-radius: 1.1rem;
  padding: 1.1rem 1.2rem;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 8px 24px rgba(51, 94, 161, 0.06);
}

.reminder-field {
  margin-top: 0.5rem;
  width: 100%;
  border: 1px solid rgba(171, 179, 183, 0.35);
  border-radius: 0.75rem;
  padding: 0.7rem 0.8rem;
  background: white;
  color: var(--color-on-surface);
  font-size: 0.875rem;
  outline: none;
}
.reminder-field:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(51, 94, 161, 0.1);
}
</style>
