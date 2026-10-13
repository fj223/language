<template>
  <main class="admin-page">
    <div class="admin-shell admin-shell-narrow">
      <AdminNav />
      <section class="admin-page-header">
        <div><p class="text-xs font-black uppercase tracking-wider text-primary">学习闭环</p><h1 class="mt-1 text-2xl font-bold">课程内容与作业批改</h1><p class="mt-1 text-sm text-slate-500">{{ courseTitle || '正在读取课程…' }}</p></div>
        <div class="flex flex-wrap gap-2"><router-link class="admin-button-secondary" :to="`/admin/courses/${courseId}/edit`">返回课程信息</router-link><button class="admin-button-primary" type="button" :disabled="loading" @click="load">刷新</button></div>
      </section>

      <p v-if="message" class="rounded-xl border px-4 py-3 text-sm font-bold" :class="isError ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'">{{ message }}</p>

      <section v-if="!loading && chapters.length === 0" class="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <span class="material-symbols-outlined text-5xl text-primary">route</span><h2 class="mt-3 text-xl font-black">从一套可运行的学习路线开始</h2><p class="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">系统会根据现有课程资源生成章节和课时，并添加一份阶段作业与自动判分测验。生成后仍可继续增删内容。</p>
        <button class="admin-button-primary mt-5" type="button" :disabled="busy" @click="seed">{{ busy ? '正在生成…' : '生成起步内容' }}</button>
      </section>

      <section v-else class="space-y-5">
        <article v-for="(chapter, chapterIndex) in chapters" :key="chapter.id" class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header class="flex flex-col gap-4 border-b border-slate-100 bg-slate-50 p-5 sm:flex-row sm:items-start sm:justify-between">
            <div class="flex gap-3"><span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary font-black text-white">{{ chapterIndex + 1 }}</span><div><h2 class="text-lg font-black text-slate-900">{{ chapter.title }}</h2><p v-if="chapter.description" class="mt-1 text-sm text-slate-500">{{ chapter.description }}</p></div></div>
            <button class="text-xs font-bold text-rose-600 hover:underline" type="button" @click="remove('chapters', chapter.id, chapter.title)">删除章节</button>
          </header>
          <div class="grid gap-5 p-5 lg:grid-cols-3">
            <section class="rounded-xl border border-slate-200 p-4"><h3 class="flex items-center gap-2 font-black"><span class="material-symbols-outlined text-primary">menu_book</span>课时 <small class="ml-auto text-slate-400">{{ chapter.lessons.length }}</small></h3><div class="mt-3 space-y-2"><div v-for="lesson in chapter.lessons" :key="lesson.id" class="group flex items-start justify-between gap-2 rounded-lg bg-slate-50 p-3"><div class="min-w-0"><p class="text-sm font-bold">{{ lesson.title }}</p><p class="mt-1 text-xs text-slate-400">{{ lesson.durationMinutes }} 分钟</p><p class="mt-1 truncate text-[11px] font-bold" :class="lesson.contentUrl ? 'text-emerald-600' : 'text-amber-600'">{{ lesson.contentUrl ? '已配置视频/资料' : '尚未配置视频/资料' }}</p></div><div class="flex shrink-0 gap-1"><button class="text-primary opacity-70 hover:opacity-100" type="button" title="编辑课时" @click="openLessonEditor(chapter.id, lesson)"><span class="material-symbols-outlined text-lg">edit</span></button><button class="text-rose-500 opacity-60 hover:opacity-100" type="button" title="删除课时" @click="remove('lessons', lesson.id, lesson.title)"><span class="material-symbols-outlined text-lg">delete</span></button></div></div></div><button class="mt-3 w-full rounded-lg border border-dashed border-primary/40 px-3 py-2 text-sm font-bold text-primary" type="button" @click="openComposer(chapter.id, 'lesson')">+ 添加课时</button></section>
            <section class="rounded-xl border border-slate-200 p-4"><h3 class="flex items-center gap-2 font-black"><span class="material-symbols-outlined text-amber-600">assignment</span>作业 <small class="ml-auto text-slate-400">{{ chapter.assignments.length }}</small></h3><div class="mt-3 space-y-2"><div v-for="assignment in chapter.assignments" :key="assignment.id" class="flex items-start justify-between gap-2 rounded-lg bg-amber-50 p-3"><div><p class="text-sm font-bold">{{ assignment.title }}</p><p class="mt-1 text-xs text-amber-700">{{ assignment._count.submissions }} 份提交 · {{ assignment.maxScore }} 分</p></div><button class="text-rose-500" type="button" @click="remove('assignments', assignment.id, assignment.title)"><span class="material-symbols-outlined text-lg">delete</span></button></div></div><button class="mt-3 w-full rounded-lg border border-dashed border-amber-400 px-3 py-2 text-sm font-bold text-amber-700" type="button" @click="openComposer(chapter.id, 'assignment')">+ 添加作业</button></section>
            <section class="rounded-xl border border-slate-200 p-4"><h3 class="flex items-center gap-2 font-black"><span class="material-symbols-outlined text-blue-600">quiz</span>测验 <small class="ml-auto text-slate-400">{{ chapter.quizzes.length }}</small></h3><div class="mt-3 space-y-2"><div v-for="quiz in chapter.quizzes" :key="quiz.id" class="flex items-start justify-between gap-2 rounded-lg bg-blue-50 p-3"><div><p class="text-sm font-bold">{{ quiz.title }}</p><p class="mt-1 text-xs text-blue-700">{{ quiz.questions.length }} 题 · {{ quiz._count.attempts }} 次作答</p></div><button class="text-rose-500" type="button" @click="remove('quizzes', quiz.id, quiz.title)"><span class="material-symbols-outlined text-lg">delete</span></button></div></div><button class="mt-3 w-full rounded-lg border border-dashed border-blue-400 px-3 py-2 text-sm font-bold text-blue-700" type="button" @click="openComposer(chapter.id, 'quiz')">+ 添加测验</button></section>
          </div>
        </article>
      </section>

      <section class="rounded-2xl bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between"><div><h2 class="text-lg font-black">新增章节</h2><p class="mt-1 text-xs text-slate-500">将课时、作业和测验组织到同一个学习阶段。</p></div></div>
        <form class="mt-4 grid gap-3 sm:grid-cols-[1fr_1.5fr_auto]" @submit.prevent="createChapter"><input v-model.trim="chapterForm.title" required maxlength="200" class="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="章节标题" /><input v-model.trim="chapterForm.description" maxlength="10000" class="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="学习目标或简介（选填）" /><button class="admin-button-primary" :disabled="busy" type="submit">添加章节</button></form>
      </section>

      <section class="rounded-2xl bg-white p-5 shadow-sm">
        <div><h2 class="text-lg font-black">待批改作业</h2><p class="mt-1 text-xs text-slate-500">学生重新提交后会回到“待批改”状态。</p></div>
        <div v-if="submissions.length === 0" class="mt-4 rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">目前还没有学生提交作业。</div>
        <div v-else class="mt-4 space-y-4"><article v-for="item in submissions" :key="item.id" class="rounded-xl border border-slate-200 p-4"><div class="flex flex-wrap items-start justify-between gap-3"><div><p class="font-black">{{ item.assignment.title }}</p><p class="mt-1 text-xs text-slate-500">{{ item.student.name }} · {{ item.student.email }}</p></div><span class="rounded-full px-3 py-1 text-xs font-black" :class="item.status === 'GRADED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'">{{ item.status === 'GRADED' ? '已批改' : '待批改' }}</span></div><p class="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">{{ item.content }}</p><form class="mt-3 grid gap-3 sm:grid-cols-[120px_1fr_auto]" @submit.prevent="grade(item)"><label class="text-xs font-bold text-slate-500">得分 / {{ item.assignment.maxScore }}<input v-model.number="gradeForms[item.id].score" required min="0" :max="item.assignment.maxScore" type="number" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label><label class="text-xs font-bold text-slate-500">反馈<input v-model.trim="gradeForms[item.id].feedback" maxlength="5000" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="指出亮点与下一步建议" /></label><button class="admin-button-primary self-end" type="submit" :disabled="busy">保存批改</button></form></article></div>
      </section>
    </div>

    <div v-if="composer" class="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-4" @click.self="composer = null">
      <form class="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" @submit.prevent="createItem"><div class="flex items-center justify-between"><h2 class="text-xl font-black">{{ composerTitle }}</h2><button type="button" @click="composer = null"><span class="material-symbols-outlined">close</span></button></div>
        <label class="mt-5 block text-sm font-bold">标题<input v-model.trim="itemForm.title" required maxlength="200" class="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" /></label>
        <template v-if="composer.kind === 'lesson'"><label class="mt-4 block text-sm font-bold">课时简介<textarea v-model.trim="itemForm.detail" rows="3" class="mt-2 w-full rounded-xl border border-slate-200 p-3"></textarea></label><label class="mt-4 block text-sm font-bold">视频或学习资料链接（选填）<input v-model.trim="itemForm.url" type="url" class="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="支持 YouTube、Bilibili、MP4 或普通网页链接" /></label><label class="mt-4 block text-sm font-bold">预计时长（分钟）<input v-model.number="itemForm.number" min="1" max="1440" type="number" class="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" /></label></template>
        <template v-else-if="composer.kind === 'assignment'"><label class="mt-4 block text-sm font-bold">作业要求<textarea v-model.trim="itemForm.detail" required rows="5" class="mt-2 w-full rounded-xl border border-slate-200 p-3"></textarea></label><label class="mt-4 block text-sm font-bold">满分<input v-model.number="itemForm.number" min="1" max="1000" type="number" class="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" /></label></template>
        <template v-else><label class="mt-4 block text-sm font-bold">测验说明<textarea v-model.trim="itemForm.detail" rows="2" class="mt-2 w-full rounded-xl border border-slate-200 p-3"></textarea></label><label class="mt-4 block text-sm font-bold">题目<input v-model.trim="itemForm.question" required class="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" /></label><label class="mt-4 block text-sm font-bold">选项（每行一个，至少两个）<textarea v-model="itemForm.options" required rows="4" class="mt-2 w-full rounded-xl border border-slate-200 p-3"></textarea></label><label class="mt-4 block text-sm font-bold">正确选项序号（从 1 开始）<input v-model.number="itemForm.number" min="1" type="number" class="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" /></label></template>
        <button class="admin-button-primary mt-6 w-full" type="submit" :disabled="busy">{{ busy ? '正在保存…' : '保存内容' }}</button>
      </form>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import AdminNav from '@/components/admin/AdminNav.vue'
import { getCourseById } from '@/api/course'
import { addAdminAssignment, addAdminChapter, addAdminLesson, addAdminQuiz, deleteAdminLearningItem, getAdminCurriculum, getAdminSubmissions, gradeAdminSubmission, seedAdminCurriculum, updateAdminLesson, type AdminLearningChapter, type AdminSubmission, type LearningLesson } from '@/api/learning'

const route = useRoute()
const courseId = computed(() => String(route.params.id ?? ''))
const courseTitle = ref('')
const chapters = ref<AdminLearningChapter[]>([])
const submissions = ref<AdminSubmission[]>([])
const loading = ref(true)
const busy = ref(false)
const message = ref('')
const isError = ref(false)
const chapterForm = reactive({ title: '', description: '' })
const composer = ref<{ chapterId: string; kind: 'lesson' | 'assignment' | 'quiz'; lessonId?: string } | null>(null)
const itemForm = reactive({ title: '', detail: '', url: '', number: 15, question: '', options: '' })
const gradeForms = reactive<Record<string, { score: number; feedback: string }>>({})
const composerTitle = computed(() => composer.value?.lessonId ? '编辑课时与视频资料' : composer.value?.kind === 'lesson' ? '添加课时' : composer.value?.kind === 'assignment' ? '添加作业' : '添加测验')
function notice(value: string, error = false) { message.value = value; isError.value = error; window.setTimeout(() => { if (message.value === value) message.value = '' }, 3500) }

async function load() {
  loading.value = true
  try {
    const [course, curriculum, items] = await Promise.all([getCourseById(courseId.value), getAdminCurriculum(courseId.value), getAdminSubmissions(courseId.value)])
    courseTitle.value = course.title; chapters.value = curriculum; submissions.value = items
    for (const item of items) gradeForms[item.id] = { score: item.score ?? item.assignment.maxScore, feedback: item.feedback ?? '' }
  } catch (value) { notice(value instanceof Error ? value.message : '学习内容加载失败', true) }
  finally { loading.value = false }
}
async function seed() { busy.value = true; try { await seedAdminCurriculum(courseId.value); notice('起步学习内容已生成'); await load() } catch (value) { notice(value instanceof Error ? value.message : '生成失败', true) } finally { busy.value = false } }
async function createChapter() { busy.value = true; try { await addAdminChapter(courseId.value, chapterForm); chapterForm.title = ''; chapterForm.description = ''; notice('章节已添加'); await load() } catch (value) { notice(value instanceof Error ? value.message : '添加失败', true) } finally { busy.value = false } }
function openComposer(chapterId: string, kind: 'lesson' | 'assignment' | 'quiz') { composer.value = { chapterId, kind }; Object.assign(itemForm, { title: '', detail: '', url: '', number: kind === 'quiz' ? 1 : kind === 'assignment' ? 100 : 15, question: '', options: '' }) }
function openLessonEditor(chapterId: string, lesson: Omit<LearningLesson, 'progress'>) { composer.value = { chapterId, kind: 'lesson', lessonId: lesson.id }; Object.assign(itemForm, { title: lesson.title, detail: lesson.summary ?? '', url: lesson.contentUrl ?? '', number: lesson.durationMinutes, question: '', options: '' }) }
async function createItem() {
  if (!composer.value) return
  busy.value = true
  try {
    if (composer.value.kind === 'lesson') {
      const input = { title: itemForm.title, summary: itemForm.detail, contentUrl: itemForm.url, durationMinutes: itemForm.number }
      if (composer.value.lessonId) await updateAdminLesson(composer.value.lessonId, input)
      else await addAdminLesson(composer.value.chapterId, input)
    }
    else if (composer.value.kind === 'assignment') await addAdminAssignment(composer.value.chapterId, { title: itemForm.title, instructions: itemForm.detail, maxScore: itemForm.number })
    else { const options = itemForm.options.split(/\r?\n/).map((value) => value.trim()).filter(Boolean); if (options.length < 2) throw new Error('请至少填写两个选项'); if (itemForm.number < 1 || itemForm.number > options.length) throw new Error('正确选项序号超出范围'); await addAdminQuiz(composer.value.chapterId, { title: itemForm.title, description: itemForm.detail, questions: [{ prompt: itemForm.question, options, correctOption: itemForm.number - 1 }] }) }
    composer.value = null; notice('学习内容已添加'); await load()
  } catch (value) { notice(value instanceof Error ? value.message : '保存失败', true) }
  finally { busy.value = false }
}
async function remove(kind: 'chapters' | 'lessons' | 'assignments' | 'quizzes', id: string, title: string) { if (!window.confirm(`确定删除“${title}”吗？相关学习记录也会一并删除。`)) return; busy.value = true; try { await deleteAdminLearningItem(kind, id); notice('内容已删除'); await load() } catch (value) { notice(value instanceof Error ? value.message : '删除失败', true) } finally { busy.value = false } }
async function grade(item: AdminSubmission) { busy.value = true; try { await gradeAdminSubmission(item.id, gradeForms[item.id]); notice('批改结果已保存并同步给学生'); await load() } catch (value) { notice(value instanceof Error ? value.message : '保存失败', true) } finally { busy.value = false } }
onMounted(load)
</script>
