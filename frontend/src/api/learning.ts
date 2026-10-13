import { http } from './http'

type ApiResponse<T> = { ok: boolean; data: T }

export type LessonProgress = {
  id: string
  positionSeconds: number
  isCompleted: boolean
  completedAt: string | null
}

export type LearningLesson = {
  id: string
  title: string
  summary: string | null
  contentUrl: string | null
  durationMinutes: number
  progress: LessonProgress | null
}

export type AssignmentSubmission = {
  id: string
  content: string
  status: 'SUBMITTED' | 'GRADED'
  score: number | null
  feedback: string | null
  submittedAt: string
}

export type LearningAssignment = {
  id: string
  title: string
  instructions: string
  maxScore: number
  dueAt: string | null
  submission: AssignmentSubmission | null
}

export type LearningQuiz = {
  id: string
  title: string
  description: string | null
  passScore: number
  questions: Array<{ id: string; prompt: string; options: string[]; sortOrder: number }>
  latestAttempt: { id: string; score: number; passed: boolean; submittedAt: string } | null
  bestScore: number
  passed: boolean
}

export type LearningChapter = {
  id: string
  title: string
  description: string | null
  lessons: LearningLesson[]
  assignments: LearningAssignment[]
  quizzes: LearningQuiz[]
}

export type LearningWorkspace = {
  course: { id: string; title: string; language: string; teacher: string | null }
  chapters: LearningChapter[]
  summary: { totalUnits: number; completedUnits: number; progressPercent: number }
}

export type PublicCourseOutline = {
  courseId: string
  chapters: Array<{
    id: string
    title: string
    description: string | null
    sortOrder: number
    lessons: Array<{ id: string; title: string; summary: string | null; contentUrl: string | null; durationMinutes: number; sortOrder: number }>
    assignments: Array<{ id: string; title: string; instructions: string; maxScore: number; sortOrder: number }>
    quizzes: Array<{ id: string; title: string; description: string | null; passScore: number; sortOrder: number; _count: { questions: number } }>
  }>
  summary: { chapterCount: number; lessonCount: number; assignmentCount: number; quizCount: number; durationMinutes: number }
}

export async function getPublicCourseOutline(courseId: string, locale?: string) {
  const response = await http.get<ApiResponse<PublicCourseOutline>>(`/api/learning/courses/${courseId}/outline`, { params: { locale } })
  return response.data.data
}

export async function getLearningWorkspace(courseId: string, locale?: string) {
  const response = await http.get<ApiResponse<LearningWorkspace>>(`/api/learning/courses/${courseId}`, { params: { locale } })
  return response.data.data
}

export async function updateLessonProgress(lessonId: string, completed: boolean, positionSeconds = 0) {
  const response = await http.patch<ApiResponse<LessonProgress>>(`/api/learning/lessons/${lessonId}/progress`, { completed, positionSeconds })
  return response.data.data
}

export async function submitAssignment(assignmentId: string, content: string) {
  const response = await http.post<ApiResponse<AssignmentSubmission>>(`/api/learning/assignments/${assignmentId}/submissions`, { content })
  return response.data.data
}

export type QuizAttemptResult = {
  id: string
  score: number
  passed: boolean
  results: Array<{ questionId: string; correct: boolean; correctOption: number; explanation: string | null }>
}

export async function submitQuiz(quizId: string, answers: number[]) {
  const response = await http.post<ApiResponse<QuizAttemptResult>>(`/api/learning/quizzes/${quizId}/attempts`, { answers })
  return response.data.data
}

export type AdminLearningChapter = Omit<LearningChapter, 'lessons' | 'assignments' | 'quizzes'> & {
  isPublished: boolean
  lessons: Array<Omit<LearningLesson, 'progress'> & { isPublished: boolean }>
  assignments: Array<Omit<LearningAssignment, 'submission'> & { isPublished: boolean; _count: { submissions: number } }>
  quizzes: Array<Omit<LearningQuiz, 'latestAttempt' | 'bestScore' | 'passed'> & { isPublished: boolean; _count: { attempts: number } }>
}

export type AdminSubmission = AssignmentSubmission & {
  student: { id: string; name: string; email: string }
  assignment: { id: string; title: string; maxScore: number }
}

export async function getAdminCurriculum(courseId: string) {
  const response = await http.get<ApiResponse<AdminLearningChapter[]>>(`/api/admin/learning/courses/${courseId}`)
  return response.data.data
}

export async function seedAdminCurriculum(courseId: string) {
  const response = await http.post<ApiResponse<{ created: boolean; chapterCount: number }>>(`/api/admin/learning/courses/${courseId}/seed`)
  return response.data.data
}

export async function addAdminChapter(courseId: string, input: { title: string; description?: string }) {
  await http.post(`/api/admin/learning/courses/${courseId}/chapters`, input)
}

export async function addAdminLesson(chapterId: string, input: { title: string; summary?: string; contentUrl?: string; durationMinutes?: number }) {
  await http.post(`/api/admin/learning/chapters/${chapterId}/lessons`, input)
}

export async function updateAdminLesson(lessonId: string, input: { title: string; summary?: string; contentUrl?: string; durationMinutes?: number }) {
  await http.patch(`/api/admin/learning/lessons/${lessonId}`, input)
}

export async function addAdminAssignment(chapterId: string, input: { title: string; instructions: string; maxScore?: number }) {
  await http.post(`/api/admin/learning/chapters/${chapterId}/assignments`, input)
}

export async function addAdminQuiz(chapterId: string, input: { title: string; description?: string; passScore?: number; questions: Array<{ prompt: string; options: string[]; correctOption: number; explanation?: string }> }) {
  await http.post(`/api/admin/learning/chapters/${chapterId}/quizzes`, input)
}

export async function deleteAdminLearningItem(kind: 'chapters' | 'lessons' | 'assignments' | 'quizzes', id: string) {
  await http.delete(`/api/admin/learning/${kind}/${id}`)
}

export async function getAdminSubmissions(courseId: string) {
  const response = await http.get<ApiResponse<AdminSubmission[]>>(`/api/admin/learning/courses/${courseId}/submissions`)
  return response.data.data
}

export async function gradeAdminSubmission(id: string, input: { score: number; feedback?: string }) {
  await http.patch(`/api/admin/learning/submissions/${id}/grade`, input)
}
