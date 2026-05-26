import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '../layouts/DefaultLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
    { path: '/dashboard', name: 'dashboard', component: () => import('../views/user/DashboardView.vue') },
    // 管理后台
    { path: '/admin', name: 'admin', component: () => import('../views/Admin.vue') },
    { path: '/admin/courses/:id/edit', redirect: '/admin' },
    // 其他页面
    { path: '/auth', name: 'auth', component: () => import('../views/auth/AuthView.vue') },
    { path: '/flashcards', name: 'flashcards', component: () => import('../views/FlashcardsView.vue') },
    { path: '/review-hall', name: 'review-hall', component: () => import('../views/user/FlashcardReview.vue') },
  ],
})

export default router
