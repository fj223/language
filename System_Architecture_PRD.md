# 系统架构与产品需求文档

**项目名称：** 新言教育 OpenEdu — 多语言国际化在线教育平台
**文档版本：** v1.0
**文档日期：** 2026年5月
**文档性质：** 毕业设计系统架构与产品需求综合报告

---

## 目录

1. [产品概述与需求分析](#1-产品概述与需求分析)
2. [用户角色与权限模型](#2-用户角色与权限模型)
3. [总体技术架构](#3-总体技术架构)
4. [前端工程架构](#4-前端工程架构)
5. [后端服务架构](#5-后端服务架构)
6. [数据持久层设计](#6-数据持久层设计)
7. [核心功能实现分析](#7-核心功能实现分析)
8. [AI 智能教务助手模块](#8-ai-智能教务助手模块)
9. [关键技术难点与解决方案](#9-关键技术难点与解决方案)
10. [安全机制设计](#10-安全机制设计)
11. [部署架构](#11-部署架构)
12. [系统局限性与未来演进方向](#12-系统局限性与未来演进方向)

---


## 1. 产品概述与需求分析

### 1.1 项目背景

随着全球化进程的深入推进，多语言教育需求呈现出显著增长态势。传统线下语言培训机构在课程资源管理、学员进度追踪及个性化辅导等方面存在明显的效率瓶颈。本项目旨在构建一套面向语言培训学校的全栈式在线教育平台，以"新言教育 OpenEdu"为品牌定位，通过前后端分离架构、多语言国际化支持及 AI 智能教务助手三大核心能力，为学员提供高效、沉浸式的语言学习体验，同时为教务管理人员提供完整的课程与资源管理工具链。

### 1.2 核心产品定位

本平台定位为**多语言国际化教育门户与智能教务系统**，覆盖以下七种语言的课程体系：英语、俄语、法语、日语、德语、西班牙语、韩语。平台的核心差异化能力体现在三个维度：

**（1）多语言国际化（i18n）**：界面语言支持中文、俄语、英语三种切换，所有动态数据（课程名称、教师信息、课程大纲等）均通过 vue-i18n 的 Composition API 模式实现响应式翻译，确保语言切换时无需页面刷新即可完成全局文案更新。

**（2）双轨 API 架构**：系统同时维护面向真实数据库的核心 API（`/api`）与面向教务门户的网关 API（`/api/gateway`），前者负责课程 CRUD 与学习进度持久化，后者提供课程展示、课表查询与成绩查询的稳定数据契约，两套 API 职责清晰、互不干扰。

**（3）AI 赋能**：基于 DeepSeek V3 大语言模型，系统实现了两种 AI 交互模式：面向课程学习的流式 AI 学习助手（SSE 协议）与面向教务查询的意图识别型智能客服（RAG 混合架构），分别服务于不同的用户场景。

### 1.3 功能需求概览

| 功能模块 | 核心需求描述 | 优先级 |
|---------|------------|--------|
| 课程门户首页 | 多语言展示、语种分类导航、快速入口卡片 | P0 |
| 课程列表页 | 语种筛选、关键词搜索、分页浏览 | P0 |
| 课程详情页 | 课程信息展示、报名咨询、教师介绍、大纲预览 | P0 |
| 个人中心（教务） | 本周课表（周视图）、成绩与出勤可视化 | P1 |
| 管理后台 | 课程 CRUD、资源增删改排序、Token 鉴权 | P0 |
| AI 学习助手 | 课程内容问答、Markdown 渲染、知识卡片生成 | P1 |
| AI 教务助手 | 课表/成绩查询、多语言翻译、通用教务问答 | P1 |
| 闪卡复习系统 | 词汇卡片创建、复习大厅管理 | P2 |
| 语音输入 | Web Speech API 集成、实时语音转文字 | P2 |

---


## 2. 用户角色与权限模型

### 2.1 角色定义

本系统采用基于角色的访问控制（Role-Based Access Control，RBAC）模型，定义三类用户角色：

**（1）访客（Guest）**

访客无需注册或登录即可访问平台的公开内容。其可访问范围包括：课程门户首页、课程列表页（含语种筛选与搜索）、课程详情页（含价格、大纲、教师信息）。访客可使用 AI 教务助手进行通用问答与多语言翻译，但无法查询个人课表与成绩数据。

**（2）学生（Student）**

学生通过前端 `useStudentAuth` Composable 完成身份认证，认证信息以 JSON 格式持久化于浏览器 `localStorage`（键名：`STUDENT_SESSION`），包含 `studentId`、`name`、`loggedInAt` 三个字段。当前阶段采用客户端模拟登录机制，后端 API 以固定 `studentId`（如 `stu_001`）作为数据查询标识。

学生在访客权限基础上，额外获得以下能力：
- 访问个人中心（`/dashboard`），查看本周课表与历史成绩
- 向 AI 教务助手发起个人数据查询（课表、成绩）
- 使用 AI 学习助手进行课程内容问答
- 创建与管理个人词汇闪卡

**（3）教务管理员（Admin）**

管理员通过 HTTP 请求头中的 `X-Admin-Token` 或 `Authorization: Bearer <token>` 字段传递鉴权令牌，后端 `requireAdmin` 中间件对令牌进行严格校验。管理员拥有系统最高权限，可执行以下操作：
- 创建、编辑、删除课程（`POST/PUT/DELETE /api/courses`）
- 管理课程下的视频资源（增删改、批量排序）
- 访问管理后台（`/admin`）

### 2.2 权限矩阵

| 操作 | 访客 | 学生 | 管理员 |
|-----|------|------|--------|
| 浏览课程列表/详情 | ✅ | ✅ | ✅ |
| 查询个人课表/成绩 | ❌ | ✅ | ✅ |
| AI 通用问答/翻译 | ✅ | ✅ | ✅ |
| AI 个人数据查询 | ❌ | ✅ | ✅ |
| 创建/编辑/删除课程 | ❌ | ❌ | ✅ |
| 管理课程资源 | ❌ | ❌ | ✅ |
| 创建词汇闪卡 | ❌ | ✅ | ✅ |

### 2.3 管理员鉴权实现

后端 `adminAuth.ts` 中间件实现了双 Header 兼容的令牌提取逻辑：

```typescript
// 支持 x-admin-token 直接传值，或 Authorization: Bearer <token> 两种格式
const headerValue =
  (typeof req.headers['x-admin-token'] === 'string' && req.headers['x-admin-token']) ||
  (typeof req.headers.authorization === 'string' && req.headers.authorization) || ''

const token = headerValue ? extractToken(headerValue) : ''
if (!token || token !== expected) {
  sendError(res, 'Unauthorized', 401)
  return
}
```

前端 `http.ts` 中的 Axios 请求拦截器在每次请求时自动从 `localStorage` 读取 `ADMIN_TOKEN` 并注入请求头，实现了管理员令牌的透明传递。

---


## 3. 总体技术架构

### 3.1 三层架构体系

本系统采用经典的前后端分离三层架构，各层职责明确、边界清晰：

```
┌─────────────────────────────────────────────────────────────┐
│                    表现层（Presentation Layer）               │
│  Vue 3 SPA  ·  TailwindCSS  ·  Element Plus  ·  vue-i18n   │
│  Vite 构建  ·  TypeScript  ·  Pinia 状态管理                 │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP / SSE
                           │ Axios / Fetch API
┌──────────────────────────▼──────────────────────────────────┐
│                    业务逻辑层（Business Layer）               │
│  Express 5  ·  TypeScript  ·  三路由模块                     │
│  RBAC 中间件  ·  速率限制  ·  Helmet 安全头                  │
│  DeepSeek V3 API 集成  ·  SSE 流式响应                       │
└──────────────────────────┬──────────────────────────────────┘
                           │ Prisma ORM
┌──────────────────────────▼──────────────────────────────────┐
│                    数据持久层（Data Layer）                   │
│  MySQL 数据库  ·  Prisma ORM  ·  4 个核心数据模型            │
│  Course  ·  VideoResource  ·  StudyRecord  ·  Flashcard     │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 技术栈全景

**前端技术栈**

| 技术 | 版本 | 用途 |
|-----|------|------|
| Vue 3 | ^3.5.30 | 核心 UI 框架，Composition API |
| TypeScript | ~5.9.3 | 静态类型系统 |
| Vite | ^8.0.1 | 构建工具与开发服务器 |
| vue-router | ^4.6.4 | 客户端路由，History 模式 |
| Pinia | ^3.0.4 | 全局状态管理 |
| vue-i18n | ^9.14.5 | 国际化框架，Composition API 模式 |
| TailwindCSS | ^4.2.2 | 原子化 CSS 框架 |
| Element Plus | ^2.13.6 | UI 组件库（表格、标签等） |
| Axios | ^1.13.6 | HTTP 客户端 |
| marked | ^18.0.2 | Markdown 渲染 |
| DOMPurify | ^3.4.0 | XSS 防护，HTML 净化 |

**后端技术栈**

| 技术 | 版本 | 用途 |
|-----|------|------|
| Node.js | ≥18 | 运行时环境 |
| Express | ^5.2.1 | Web 框架 |
| TypeScript | ^6.0.2 | 静态类型系统 |
| Prisma | ^6.19.2 | ORM 框架 |
| MySQL | — | 关系型数据库 |
| helmet | ^8.1.0 | HTTP 安全头 |
| express-rate-limit | ^8.3.1 | API 速率限制 |
| cors | ^2.8.6 | 跨域资源共享 |
| tsx | ^4.21.0 | TypeScript 直接执行（开发模式） |

### 3.3 路由架构

后端挂载三个独立的路由模块，职责分离：

```
/api          → api.ts        课程 CRUD、资源管理、学习进度、闪卡、AI 聊天
/api/gateway  → gateway-api.ts  教务门户数据（课程展示、课表、成绩）
/api/legacy   → legacy-api.ts   模拟旧教务系统接口（供 AI 助手 RAG 调用）
/api/health   → 内联处理器      服务健康检查
```

前端路由采用 Vue Router 4 的 History 模式，路由表如下：

```
/              → HomeView.vue        门户首页
/courses       → CourseListView.vue  课程列表
/courses/:id   → CourseDetailView.vue 课程详情
/dashboard     → DashboardView.vue   个人中心（教务）
/admin         → Admin.vue           管理后台
/auth          → AuthView.vue        认证页面
/flashcards    → FlashcardsView.vue  闪卡复习
```

---


## 4. 前端工程架构

### 4.1 目录结构与模块划分

前端工程遵循关注点分离原则，按功能域组织目录结构：

```
frontend/src/
├── api/           # HTTP 请求层（类型定义 + 请求函数）
│   ├── http.ts    # Axios 实例 + 请求拦截器
│   ├── course.ts  # 课程 CRUD + 进度 API
│   ├── gateway.ts # 教务门户 API
│   ├── chat.ts    # SSE 流式聊天 API
│   └── flashcard.ts # 闪卡 API
├── components/    # 可复用 UI 组件
│   ├── AIChat.vue       # 课程内嵌 AI 学习助手
│   ├── ChatbotWidget.vue # 全局悬浮 AI 教务助手
│   └── Player.vue       # 多类型视频播放器
├── composables/   # 可复用逻辑（Composition API）
│   └── useStudentAuth.ts # 学生身份认证
├── domain/        # 领域模型与业务逻辑
│   └── resourceMeta.ts  # 资源类型元数据
├── layouts/       # 页面布局组件
│   └── DefaultLayout.vue
├── locales/       # 国际化资源
│   ├── index.ts   # i18n 实例创建
│   ├── zh.ts      # 中文翻译
│   ├── ru.ts      # 俄语翻译
│   └── en.ts      # 英语翻译
├── router/        # 路由配置
├── stores/        # Pinia 状态管理
│   └── useLangStore.ts  # 语言状态 + 翻译字典
└── views/         # 页面视图组件
    ├── home/      # 门户首页
    ├── courses/   # 课程列表与详情
    ├── user/      # 个人中心
    ├── admin/     # 管理后台
    └── auth/      # 认证页面
```

### 4.2 Vue 3 组合式 API 的工程实践

本项目全面采用 Vue 3 Composition API（`<script setup>` 语法糖），摒弃 Options API，以实现更好的逻辑复用性与类型推断能力。

**响应式状态管理模式**

在 `DashboardView.vue` 中，课表与成绩模块采用独立的响应式状态，两个数据请求在 `onMounted` 中并行发起，互不阻塞：

```typescript
// 课表与成绩状态完全独立，错误互不影响
const timetable = ref<TimetableEntry[]>([])
const timetableLoading = ref(false)
const timetableError = ref('')

const grades = ref<GradeEntry[]>([])
const gradesLoading = ref(false)
const gradesError = ref('')

// 并行请求，避免串行等待
onMounted(() => {
  void loadTimetable()
  void loadGrades()
})
```

**计算属性驱动的数据转换**

课表的周视图展示通过 `computed` 属性实现，将扁平的 `TimetableEntry[]` 数组按 `dayOfWeek` 字段分组，并在组内按 `startTime` 升序排列：

```typescript
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
```

此设计将数据转换逻辑与渲染逻辑完全解耦，`computed` 的惰性求值特性确保仅在 `timetable` 数据变化时重新计算，避免不必要的渲染开销。

### 4.3 国际化（i18n）架构设计

#### 4.3.1 技术选型与配置

本项目采用 vue-i18n v9 的 **Composition API 模式**（`legacy: false`），以获得完整的 TypeScript 类型支持与 Vue 3 响应式集成：

```typescript
// locales/index.ts
export const i18n = createI18n({
  legacy: false,       // 启用 Composition API 模式
  locale: 'zh',        // 默认语言：中文
  fallbackLocale: 'zh', // 回退语言
  messages: { zh, ru, en },
})
```

#### 4.3.2 双层国际化架构

本项目实现了一种独特的**双层国际化架构**，以应对不同场景的翻译需求：

**第一层：vue-i18n 全局翻译**（适用于页面级文案）

通过 `useI18n()` 的 `t()` 函数访问，支持插值参数与复数形式：

```typescript
// 在组件中使用
const { t } = useI18n()
const duration = t(`courseDetail.duration_months`, { n: 3 }) // "3个月"
```

**第二层：Pinia Store 内联翻译字典**（适用于 Navbar 等高频访问组件）

`useLangStore` 维护了一个精简的翻译字典，专门服务于导航栏与首页 Hero 区域，避免为少量文案引入完整的 i18n 查找开销：

```typescript
export const TRANSLATIONS = {
  zh: { navCourses: '课程探索', navDashboard: '个人中心', ... },
  ru: { navCourses: 'Курсы', navDashboard: 'Личный кабинет', ... },
  en: { navCourses: 'Courses', navDashboard: 'Dashboard', ... },
} as const
```

语言切换时，`setLang()` 方法同步更新 Pinia store 与 vue-i18n 的 `locale`，确保两层翻译系统保持一致：

```typescript
function setLang(l: Lang) {
  lang.value = l
  i18n.global.locale.value = l  // 同步 vue-i18n
}
```

#### 4.3.3 响应式翻译数组的技术难点

在 `HomeView.vue` 中，语种导航列表、统计数据卡片等数组型数据需要在语言切换时实时更新。若将这些数组定义为普通常量，`t()` 函数仅在组件初始化时执行一次，语言切换后数组内容不会更新。

**解决方案**：将所有包含 `t()` 调用的数组定义为 `computed` 属性，利用 vue-i18n 的响应式 locale 触发重新计算：

```typescript
// 错误做法：t() 仅执行一次，语言切换后不更新
const LANGUAGES = [
  { name: t('home.langEn'), emoji: '🇬🇧' },
  // ...
]

// 正确做法：computed 属性响应 locale 变化
const LANGUAGES = computed(() => [
  { name: t('home.langEn'), emoji: '🇬🇧', sub: t('home.langEnSub') },
  // ...
])
```

这一模式在 `HomeView.vue` 的 `STATS`、`QUICK_CARDS`、`LANGUAGES` 三个数组中均有应用，彻底解决了语言切换后静态数组不更新的问题。

### 4.4 HTTP 请求层设计

`api/http.ts` 创建了一个全局 Axios 实例，统一配置基础 URL 与超时时间，并通过请求拦截器实现管理员令牌的自动注入：

```typescript
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  timeout: 15_000,
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('ADMIN_TOKEN') || ''
  if (token) {
    config.headers['X-Admin-Token'] = token
  }
  return config
})
```

Vite 开发服务器配置了 `/api` 路径的代理转发，将前端请求代理至后端 `http://localhost:3000`，解决开发环境的跨域问题，同时保持生产环境的部署灵活性。

---

