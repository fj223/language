import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '../layouts/DefaultLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 首页 — 课程大厅
    {
      path: '/',
      component: DefaultLayout,
      children: [
        { path: '', name: 'home', component: () => import('../views/Home.vue') },
      ],
    },
    // 课程详情页 — 独立 layout，避免与首页 children 产生歧义
    {
      path: '/courses/:id',
      component: DefaultLayout,
      children: [
        { path: '', name: 'course-detail', component: () => import('../views/CourseDetail.vue') },
      ],
    },
    // 旧路由兼容重定向
    { path: '/courses', redirect: '/' },
    // 管理后台
    { path: '/admin', name: 'admin', component: () => import('../views/Admin.vue') },
    { path: '/admin/courses/:id/edit', redirect: '/admin' },
    // 其他页面
    { path: '/dashboard', name: 'dashboard', component: () => import('../views/user/DashboardView.vue') },
    { path: '/auth', name: 'auth', component: () => import('../views/auth/AuthView.vue') },
    { path: '/flashcards', name: 'flashcards', component: () => import('../views/FlashcardsView.vue') },
  ],
})

export default router
