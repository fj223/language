import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '../layouts/DefaultLayout.vue'
import { useStudentAuth } from '../composables/useStudentAuth'
import { useAdminAuth } from '../composables/useAdminAuth'
import type { AdminPermission } from '../api/admin'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0, left: 0 }
  },
  routes: [
    // 首页 — 新言教育门户首页
    {
      path: '/',
      component: DefaultLayout,
      children: [
        { path: '', name: 'home', component: () => import('../views/home/HomeView.vue') },
      ],
    },
    // 课程列表页（语言培训学校门户）
    {
      path: '/courses',
      component: DefaultLayout,
      children: [
        { path: '', name: 'course-list', component: () => import('../views/courses/CourseListView.vue') },
      ],
    },
    // 课程详情页
    {
      path: '/courses/:id',
      component: DefaultLayout,
      children: [
        { path: '', name: 'course-detail', component: () => import('../views/courses/CourseDetailView.vue') },
      ],
    },
    // 个人中心（教务系统）
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/user/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/learn/:courseId',
      component: DefaultLayout,
      children: [
        { path: '', name: 'learning-workspace', component: () => import('../views/learning/LearningWorkspaceView.vue'), meta: { requiresAuth: true } },
      ],
    },
    // 管理后台
    { path: '/admin/login', name: 'admin-login', component: () => import('../views/admin/AdminLoginView.vue') },
    { path: '/admin', name: 'admin', component: () => import('../views/admin/AdminDashboardView.vue'), meta: { requiresAdmin: true } },
    { path: '/admin/policies', name: 'admin-policies', component: () => import('../views/admin/AdminPolicyEditorView.vue'), meta: { requiresAdmin: true, adminPermission: 'policy.read' } },
    { path: '/admin/enrollments', name: 'admin-enrollments', component: () => import('../views/admin/AdminEnrollmentView.vue'), meta: { requiresAdmin: true, adminPermission: 'enrollment.read' } },
    { path: '/admin/users', name: 'admin-users', component: () => import('../views/admin/AdminUsersView.vue'), meta: { requiresAdmin: true, adminPermission: 'admin.manage' } },
    { path: '/admin/courses/:id/edit', name: 'admin-course-edit', component: () => import('../views/admin/AdminCourseEditView.vue'), meta: { requiresAdmin: true, adminPermission: 'course.write' } },
    { path: '/admin/courses/:id/learning', name: 'admin-course-learning', component: () => import('../views/admin/AdminLearningView.vue'), meta: { requiresAdmin: true, adminPermission: 'course.write' } },
    // 其他页面
    { path: '/auth', name: 'auth', component: () => import('../views/auth/AuthView.vue') },
    { path: '/flashcards', redirect: '/review-hall' },
    {
      path: '/review-hall',
      name: 'review-hall',
      component: () => import('../views/user/FlashcardReview.vue'),
      meta: { requiresAuth: true },
    },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue') },
  ],
})

let initialSessionChecked = false
let initialAdminChecked = false

router.beforeEach(async (to) => {
  const hasAdminSession = Boolean(localStorage.getItem('ADMIN_SESSION_TOKEN'))
  if ((to.meta.requiresAdmin || to.path === '/admin/login') && hasAdminSession && !initialAdminChecked) {
    initialAdminChecked = true
    const valid = await useAdminAuth().restoreSession()
    if (!valid && to.meta.requiresAdmin) return { path: '/admin/login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresAdmin && !localStorage.getItem('ADMIN_SESSION_TOKEN')) {
    return { path: '/admin/login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresAdmin && to.meta.adminPermission) {
    const permission = String(to.meta.adminPermission) as AdminPermission
    if (!useAdminAuth().can(permission)) {
      return { path: '/admin', query: { denied: permission } }
    }
  }
  if (to.path === '/admin/login' && localStorage.getItem('ADMIN_SESSION_TOKEN')) return '/admin'

  const hasSession = Boolean(localStorage.getItem('STUDENT_TOKEN'))

  // Validate cached student identity before every initial entry point, including public
  // course pages. This prevents a deleted/expired test account from remaining visible
  // in the global navigation until the user visits an authenticated page.
  if (hasSession && !initialSessionChecked) {
    initialSessionChecked = true
    const valid = await useStudentAuth().restoreSession()
    if (!valid && to.meta.requiresAuth) {
      return { path: '/auth', query: { redirect: to.fullPath } }
    }
  }

  const hasValidatedSession = Boolean(localStorage.getItem('STUDENT_TOKEN'))
  if (to.meta.requiresAuth && !hasValidatedSession) {
    return { path: '/auth', query: { redirect: to.fullPath } }
  }

  if (to.path === '/auth' && hasValidatedSession) {
    return '/dashboard'
  }
})

export default router
