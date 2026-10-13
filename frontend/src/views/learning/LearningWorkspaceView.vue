<template>
  <main class="min-h-screen bg-[#f5f7fb] pb-20">
    <section class="bg-gradient-to-br from-[#183a6b] via-[#275996] to-[#4b78bc] text-white">
      <div class="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <router-link :to="`/courses/${courseId}`" class="inline-flex items-center gap-1 text-sm font-bold text-white/75 hover:text-white">
          <span class="material-symbols-outlined text-lg">arrow_back</span>{{ copy.back }}
        </router-link>
        <div v-if="workspace" class="mt-6 grid gap-7 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.25em] text-blue-200">{{ copy.eyebrow }}</p>
            <h1 class="mt-3 text-3xl font-black sm:text-4xl">{{ workspace.course.title }}</h1>
            <p class="mt-3 text-sm text-blue-100">{{ workspace.course.language }}<span v-if="workspace.course.teacher"> · {{ workspace.course.teacher }}</span></p>
          </div>
          <div class="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
            <div class="flex items-end justify-between"><span class="text-sm font-bold">{{ copy.overall }}</span><strong class="text-3xl">{{ workspace.summary.progressPercent }}%</strong></div>
            <div class="mt-3 h-2 overflow-hidden rounded-full bg-white/20"><div class="h-full rounded-full bg-[#9fe1b3] transition-all" :style="{ width: `${workspace.summary.progressPercent}%` }"></div></div>
            <p class="mt-3 text-xs text-blue-100">{{ copy.units(workspace.summary.completedUnits, workspace.summary.totalUnits) }}</p>
          </div>
        </div>
      </div>
    </section>

    <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div v-if="loading" class="rounded-2xl bg-white p-10 text-center shadow-sm">
        <span class="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
        <p class="mt-3 text-sm text-slate-500">{{ copy.loading }}</p>
      </div>
      <div v-else-if="error" class="rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
        <span class="material-symbols-outlined text-4xl text-rose-500">lock</span>
        <h2 class="mt-3 text-xl font-black text-slate-800">{{ copy.noAccess }}</h2>
        <p class="mt-2 text-sm text-slate-500">{{ error }}</p>
        <router-link :to="`/courses/${courseId}`" class="mt-5 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-black text-white">{{ copy.coursePage }}</router-link>
      </div>
      <div v-else-if="workspace" class="space-y-7">
        <section v-for="(chapter, chapterIndex) in workspace.chapters" :key="chapter.id" class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <header class="border-b border-slate-100 bg-slate-50/70 px-5 py-5 sm:px-7">
            <div class="flex items-start gap-4">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-black text-white">{{ chapterIndex + 1 }}</span>
              <div><h2 class="text-xl font-black text-slate-900">{{ chapter.title }}</h2><p v-if="chapter.description" class="mt-1 text-sm leading-6 text-slate-500">{{ chapter.description }}</p></div>
            </div>
          </header>

          <div class="grid gap-6 p-5 sm:p-7 lg:grid-cols-2">
            <section class="space-y-3 lg:col-span-2">
              <h3 class="flex items-center gap-2 text-sm font-black text-slate-800"><span class="material-symbols-outlined text-primary">menu_book</span>{{ copy.lessons }}</h3>
              <article v-for="lesson in chapter.lessons" :key="lesson.id" class="flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center" :class="lesson.progress?.isCompleted ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200'">
                <span class="material-symbols-outlined text-3xl" :class="lesson.progress?.isCompleted ? 'text-emerald-600' : 'text-primary'">{{ lesson.progress?.isCompleted ? 'check_circle' : 'play_circle' }}</span>
                <div class="min-w-0 flex-1"><h4 class="font-black text-slate-900">{{ lesson.title }}</h4><p v-if="lesson.summary" class="mt-1 text-sm leading-6 text-slate-500">{{ lesson.summary }}</p><p class="mt-1 text-xs font-bold text-slate-400">{{ lesson.durationMinutes }} {{ copy.minutes }}</p></div>
                <div class="flex shrink-0 gap-2">
                  <a v-if="lesson.contentUrl" :href="normalizeUrl(lesson.contentUrl)" target="_blank" rel="noreferrer" class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:border-primary hover:text-primary">{{ copy.open }}</a>
                  <button type="button" class="rounded-xl px-4 py-2 text-sm font-black disabled:opacity-50" :class="lesson.progress?.isCompleted ? 'bg-slate-100 text-slate-600' : 'bg-primary text-white'" :disabled="busyLessons.has(lesson.id)" @click="toggleLesson(lesson)">{{ lesson.progress?.isCompleted ? copy.undo : copy.complete }}</button>
                </div>
              </article>
            </section>

            <section v-for="assignment in chapter.assignments" :key="assignment.id" class="rounded-2xl border border-amber-200 bg-amber-50/40 p-5">
              <div class="flex items-start justify-between gap-3"><div><p class="text-xs font-black uppercase tracking-wider text-amber-700">{{ copy.assignment }}</p><h3 class="mt-1 text-lg font-black text-slate-900">{{ assignment.title }}</h3></div><span v-if="assignment.submission" class="rounded-full bg-white px-3 py-1 text-xs font-black text-amber-700">{{ assignment.submission.status === 'GRADED' ? copy.graded : copy.submitted }}</span></div>
              <p class="mt-3 text-sm leading-6 text-slate-600">{{ assignment.instructions }}</p>
              <textarea v-model="assignmentDrafts[assignment.id]" rows="5" maxlength="20000" class="mt-4 w-full resize-y rounded-xl border border-amber-200 bg-white p-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" :placeholder="copy.assignmentPlaceholder"></textarea>
              <div v-if="assignment.submission?.status === 'GRADED'" class="mt-3 rounded-xl bg-white p-3 text-sm"><strong>{{ copy.score }}：{{ assignment.submission.score }}/{{ assignment.maxScore }}</strong><p v-if="assignment.submission.feedback" class="mt-1 text-slate-600">{{ copy.feedback }}：{{ assignment.submission.feedback }}</p></div>
              <button type="button" class="mt-4 w-full rounded-xl bg-amber-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50" :disabled="busyAssignments.has(assignment.id)" @click="saveAssignment(assignment)">{{ assignment.submission ? copy.resubmit : copy.submitAssignment }}</button>
            </section>

            <section v-for="quiz in chapter.quizzes" :key="quiz.id" class="rounded-2xl border border-blue-200 bg-blue-50/45 p-5">
              <div class="flex items-start justify-between gap-3"><div><p class="text-xs font-black uppercase tracking-wider text-primary">{{ copy.quiz }}</p><h3 class="mt-1 text-lg font-black text-slate-900">{{ quiz.title }}</h3></div><span v-if="quiz.latestAttempt" class="rounded-full bg-white px-3 py-1 text-xs font-black" :class="quiz.passed ? 'text-emerald-700' : 'text-rose-600'">{{ copy.best }} {{ quiz.bestScore }}</span></div>
              <p v-if="quiz.description" class="mt-2 text-sm text-slate-600">{{ quiz.description }}</p>
              <div v-for="(question, questionIndex) in quiz.questions" :key="question.id" class="mt-4 rounded-xl bg-white p-4">
                <p class="text-sm font-black text-slate-800">{{ questionIndex + 1 }}. {{ question.prompt }}</p>
                <label v-for="(option, optionIndex) in question.options" :key="optionIndex" class="mt-2 flex cursor-pointer items-start gap-2 rounded-lg p-2 text-sm text-slate-600 hover:bg-slate-50"><input v-model="quizAnswers[quiz.id][questionIndex]" type="radio" :name="`${quiz.id}-${questionIndex}`" :value="optionIndex" class="mt-0.5 accent-primary" /><span>{{ option }}</span></label>
              </div>
              <p v-if="quizMessages[quiz.id]" class="mt-3 rounded-xl bg-white p-3 text-sm font-bold" :class="quizMessages[quiz.id]?.passed ? 'text-emerald-700' : 'text-rose-600'">{{ quizMessages[quiz.id]?.text }}</p>
              <button type="button" class="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-sm font-black text-white disabled:opacity-50" :disabled="busyQuizzes.has(quiz.id)" @click="saveQuiz(quiz)">{{ copy.submitQuiz }}</button>
            </section>
          </div>
        </section>
        <section v-if="workspace.chapters.length === 0" class="rounded-2xl bg-white p-10 text-center text-slate-500">{{ copy.empty }}</section>
      </div>
    </div>
    <div v-if="toast" class="fixed bottom-7 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-xl" role="status">{{ toast }}</div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getLearningWorkspace, submitAssignment, submitQuiz, updateLessonProgress, type LearningAssignment, type LearningLesson, type LearningQuiz, type LearningWorkspace } from '@/api/learning'

const route = useRoute()
const { locale } = useI18n()
const courseId = computed(() => String(route.params.courseId ?? ''))
const workspace = ref<LearningWorkspace | null>(null)
const loading = ref(true)
const error = ref('')
const toast = ref('')
const assignmentDrafts = reactive<Record<string, string>>({})
const quizAnswers = reactive<Record<string, number[]>>({})
const quizMessages = reactive<Record<string, { text: string; passed: boolean } | undefined>>({})
const busyLessons = reactive(new Set<string>())
const busyAssignments = reactive(new Set<string>())
const busyQuizzes = reactive(new Set<string>())

const COPY = {
  zh: { back: '返回课程详情', eyebrow: '我的学习空间', overall: '总体完成度', units: (a: number, b: number) => `已完成 ${a} / ${b} 个学习任务`, loading: '正在准备你的学习路线…', noAccess: '暂时无法进入', coursePage: '查看课程与报名状态', lessons: '课时学习', minutes: '分钟', open: '打开资料', undo: '撤销完成', complete: '标记完成', assignment: '阶段作业', submitted: '待批改', graded: '已批改', assignmentPlaceholder: '在这里写下你的作业内容…', score: '得分', feedback: '教师反馈', resubmit: '更新作业', submitAssignment: '提交作业', quiz: '随堂测验', best: '最高分', submitQuiz: '提交并自动判分', empty: '课程内容正在准备中。', saved: '学习进度已更新', assignmentSaved: '作业已提交，等待教师批改', finishQuiz: '请先完成全部题目', quizResult: (s: number, p: boolean) => `本次得分 ${s} 分，${p ? '已通过' : '尚未通过，可以复习后重试'}` },
  en: { back: 'Back to course', eyebrow: 'My learning space', overall: 'Overall progress', units: (a: number, b: number) => `${a} of ${b} learning tasks complete`, loading: 'Preparing your learning path…', noAccess: 'Access unavailable', coursePage: 'View course and enrollment', lessons: 'Lessons', minutes: 'min', open: 'Open', undo: 'Undo', complete: 'Complete', assignment: 'Assignment', submitted: 'Awaiting review', graded: 'Graded', assignmentPlaceholder: 'Write your assignment here…', score: 'Score', feedback: 'Teacher feedback', resubmit: 'Update assignment', submitAssignment: 'Submit assignment', quiz: 'Quiz', best: 'Best', submitQuiz: 'Submit and grade', empty: 'Course content is being prepared.', saved: 'Learning progress updated', assignmentSaved: 'Assignment submitted for review', finishQuiz: 'Answer every question first', quizResult: (s: number, p: boolean) => `Score: ${s}. ${p ? 'Passed' : 'Not passed yet—review and try again'}` },
  ru: { back: 'Назад к курсу', eyebrow: 'Моё обучение', overall: 'Общий прогресс', units: (a: number, b: number) => `Выполнено ${a} из ${b} заданий`, loading: 'Готовим учебный маршрут…', noAccess: 'Доступ пока закрыт', coursePage: 'К курсу и заявке', lessons: 'Уроки', minutes: 'мин', open: 'Открыть', undo: 'Отменить', complete: 'Завершить', assignment: 'Задание', submitted: 'На проверке', graded: 'Проверено', assignmentPlaceholder: 'Введите ответ…', score: 'Оценка', feedback: 'Комментарий преподавателя', resubmit: 'Обновить ответ', submitAssignment: 'Отправить задание', quiz: 'Тест', best: 'Лучший', submitQuiz: 'Отправить и проверить', empty: 'Материалы курса готовятся.', saved: 'Прогресс обновлён', assignmentSaved: 'Задание отправлено на проверку', finishQuiz: 'Ответьте на все вопросы', quizResult: (s: number, p: boolean) => `Результат: ${s}. ${p ? 'Тест пройден' : 'Повторите материал и попробуйте снова'}` },
}
const copy = computed(() => COPY[String(locale.value).startsWith('en') ? 'en' : String(locale.value).startsWith('ru') ? 'ru' : 'zh'])

function normalizeUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value
  if (value.startsWith('/')) return value
  if (/^BV/i.test(value)) return `https://www.bilibili.com/video/${value}`
  return `https://www.youtube.com/watch?v=${encodeURIComponent(value)}`
}
function showToast(message: string) { toast.value = message; window.setTimeout(() => { if (toast.value === message) toast.value = '' }, 2600) }

async function load() {
  loading.value = true; error.value = ''
  try {
    workspace.value = await getLearningWorkspace(courseId.value, locale.value)
    for (const chapter of workspace.value.chapters) {
      for (const assignment of chapter.assignments) assignmentDrafts[assignment.id] = assignment.submission?.content ?? ''
      for (const quiz of chapter.quizzes) quizAnswers[quiz.id] = Array(quiz.questions.length).fill(-1)
    }
  } catch (value) { error.value = value instanceof Error ? value.message : '学习空间加载失败' }
  finally { loading.value = false }
}

async function toggleLesson(lesson: LearningLesson) {
  busyLessons.add(lesson.id)
  try { lesson.progress = await updateLessonProgress(lesson.id, !lesson.progress?.isCompleted); showToast(copy.value.saved); await load() }
  catch (value) { showToast(value instanceof Error ? value.message : '保存失败') }
  finally { busyLessons.delete(lesson.id) }
}
async function saveAssignment(assignment: LearningAssignment) {
  busyAssignments.add(assignment.id)
  try { assignment.submission = await submitAssignment(assignment.id, assignmentDrafts[assignment.id] ?? ''); showToast(copy.value.assignmentSaved); await load() }
  catch (value) { showToast(value instanceof Error ? value.message : '提交失败') }
  finally { busyAssignments.delete(assignment.id) }
}
async function saveQuiz(quiz: LearningQuiz) {
  const answers = quizAnswers[quiz.id] ?? []
  if (answers.some((answer) => answer < 0)) { showToast(copy.value.finishQuiz); return }
  busyQuizzes.add(quiz.id)
  try { const result = await submitQuiz(quiz.id, answers); quizMessages[quiz.id] = { text: copy.value.quizResult(result.score, result.passed), passed: result.passed }; showToast(quizMessages[quiz.id]!.text); await load() }
  catch (value) { showToast(value instanceof Error ? value.message : '提交失败') }
  finally { busyQuizzes.delete(quiz.id) }
}
onMounted(load)
watch(locale, () => { void load() })
</script>
