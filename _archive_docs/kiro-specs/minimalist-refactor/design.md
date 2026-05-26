# Design Document

## Overview

本设计文档描述"极简主义重构"的技术实现方案。重构分为三个正交维度：后端单文件化、数据库 Schema 简化、前端视图与组件重组。三个维度可并行实施，最终通过统一的集成测试验证功能完整性。

---

## Architecture

### 重构前后对比

```
重构前                              重构后
─────────────────────────────────   ─────────────────────────────────
backend/src/
  controllers/
    courseController.ts      ──┐
    resourceController.ts    ──┤──► routes/api.ts（单文件，~400行）
    progressController.ts    ──┤
    chatController.ts        ──┘
  routes/api.ts（仅路由注册）

frontend/src/
  views/
    home/HomeView.vue        ──┐
    courses/CourseListView   ──┴──► views/Home.vue
    courses/CourseDetailView ──────► views/CourseDetail.vue
    admin/AdminDashboardView ──┐
    admin/AdminCourseEditView ─┴──► views/Admin.vue
  components/（空）               components/
                                    Player.vue（新建）
                                    AIChat.vue（新建）

prisma/schema.prisma
  User 模型（删除）
  StudyRecord.userId: FK    ──────► StudyRecord.userId: String（普通字段）
```

---

## Detailed Design

### 1. Schema Migration

#### 1.1 变更内容

```prisma
// 删除整个 User 模型

model StudyRecord {
  id                  String    @id @default(cuid()) @db.VarChar(191)
  userId              String    @db.VarChar(191)          // 改为普通字段，移除 @relation
  courseId            String    @db.VarChar(191)
  progressPercent     Float     @default(0)
  lastPositionSeconds Int       @default(0)
  isCompleted         Boolean   @default(false)
  completedAt         DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)

  @@unique([userId, courseId])
  @@index([courseId])
  // 移除: @@index([userId])（原来通过 User 关系隐式存在）
}
```

#### 1.2 Migration SQL（`remove_user_model`）

```sql
-- 1. 删除 StudyRecord 上 userId 的外键约束
ALTER TABLE `StudyRecord` DROP FOREIGN KEY `StudyRecord_userId_fkey`;

-- 2. 删除 User 表
DROP TABLE `User`;

-- 3. 重建 StudyRecord_userId 索引（如果原来有单独索引）
-- （@@unique([userId, courseId]) 约束保持不变，无需重建）
```

#### 1.3 progressController 变更

删除 `ensureAnonymousUser()` 函数，因为 userId 不再是外键，直接使用字符串 `"anonymous"` 即可：

```typescript
// 重构前
await ensureAnonymousUser()
const record = await prisma.studyRecord.upsert({ ... })

// 重构后（直接 upsert，无需预先创建 User 记录）
const record = await prisma.studyRecord.upsert({ ... })
```

---

### 2. 后端单文件化（api.ts）

#### 2.1 文件结构

```typescript
// backend/src/routes/api.ts
import { Router } from 'express'
import { Prisma, VideoResourceType } from '@prisma/client'
import { prisma } from '../db/prisma.js'
import { sendError, sendOk } from '../lib/apiResponse.js'
import { serializeCourse, serializeResource } from '../lib/serializers.js'
import { requireAdmin } from '../middleware/adminAuth.js'
import { chatRateLimit } from '../middleware/rateLimit.js'

const router = Router()

// ============================================================
// === Courses ===
// ============================================================
// GET    /courses
// POST   /courses          (requireAdmin)
// GET    /courses/:id
// PUT    /courses/:id      (requireAdmin)
// DELETE /courses/:id      (requireAdmin)

// ============================================================
// === Resources ===
// ============================================================
// POST   /courses/:courseId/resources          (requireAdmin)
// PUT    /courses/:courseId/resources/sort     (requireAdmin)
// PUT    /courses/:courseId/resources/:rid     (requireAdmin)
// DELETE /courses/:courseId/resources/:rid     (requireAdmin)

// ============================================================
// === Progress ===
// ============================================================
// GET    /courses/:id/progress
// POST   /courses/:id/progress

// ============================================================
// === Chat ===
// ============================================================
// POST   /chat             (chatRateLimit)

export default router
```

#### 2.2 路由路径完整映射表

| 方法   | 路径                                        | 中间件        | 原 Controller 函数      |
|--------|---------------------------------------------|---------------|-------------------------|
| GET    | `/courses`                                  | —             | `getCourses`            |
| POST   | `/courses`                                  | requireAdmin  | `createCourse`          |
| GET    | `/courses/:id`                              | —             | `getCourseById`         |
| PUT    | `/courses/:id`                              | requireAdmin  | `updateCourse`          |
| DELETE | `/courses/:id`                              | requireAdmin  | `deleteCourse`          |
| GET    | `/courses/:id/progress`                     | —             | `getCourseProgress`     |
| POST   | `/courses/:id/progress`                     | —             | `reportCourseProgress`  |
| POST   | `/courses/:courseId/resources`              | requireAdmin  | `addResource`           |
| PUT    | `/courses/:courseId/resources/sort`         | requireAdmin  | `sortResources`         |
| PUT    | `/courses/:courseId/resources/:resourceId`  | requireAdmin  | `updateResource`        |
| DELETE | `/courses/:courseId/resources/:resourceId`  | requireAdmin  | `deleteResource`        |
| POST   | `/chat`                                     | chatRateLimit | `postChat`              |

> 注意：`/sort` 路由必须在 `/:resourceId` 之前注册，防止 Express 将字面量 "sort" 匹配为动态参数。

---

### 3. Player.vue 组件设计

#### 3.1 Props & Emits 接口

```typescript
// Props
interface PlayerProps {
  resource: VideoResourceDto | null
  startTime?: number  // 默认 0，用于 bilibili iframe &t= 参数
}

// Emits（仅 local 类型触发）
interface PlayerEmits {
  play: [video: HTMLVideoElement]
  pause: []
  ended: []
  loadedmetadata: []
}
```

#### 3.2 内部逻辑

```typescript
// 计算属性
const youtubeEmbedUrl = computed(() => {
  if (props.resource?.resource_type !== 'youtube') return ''
  const id = extractYouTubeId(props.resource.source_url)
  return id ? `https://www.youtube.com/embed/${id}` : ''
})

const bilibiliEmbedUrl = computed(() => {
  if (props.resource?.resource_type !== 'bilibili') return ''
  const base = extractBilibiliEmbedUrl(props.resource.source_url)
  if (!base) return ''
  return props.startTime > 0 ? `${base}&t=${props.startTime}` : base
})
```

#### 3.3 渲染逻辑（条件分支）

```
resource === null          → 空状态占位符
resource_type === 'local'  → <video> 元素，绑定 @play/@pause/@ended/@loadedmetadata
resource_type === 'youtube'→ <iframe> (youtubeEmbedUrl) 或"链接无效"提示
resource_type === 'bilibili'→ <iframe> (bilibiliEmbedUrl) 或降级外链 UI
resource_type === 其他     → 外部资源卡片（外链按钮）
```

---

### 4. AIChat.vue 组件设计

#### 4.1 Props 接口

```typescript
interface AIChatProps {
  courseId: string
}
```

#### 4.2 内部状态

```typescript
const chatMessages = ref<ChatMessage[]>([
  { role: 'ai', content: '你好！我是你的 AI 学习助手...' }
])
const chatInput = ref('')
const sending = ref(false)
const chatContainerRef = ref<HTMLDivElement | null>(null)
```

#### 4.3 发送逻辑

```typescript
async function sendChat() {
  if (sending.value || !chatInput.value.trim()) return
  // 1. 追加用户消息
  // 2. 追加"AI 正在思考..."占位
  // 3. 调用 postChatMessage(content)
  // 4. 替换占位为实际回复（或错误信息）
  // 5. 滚动至底部
}
```

---

### 5. CourseDetail.vue 设计

#### 5.1 进度管理逻辑（保持不变）

```typescript
// 心跳：每 15 秒上报一次
function startHeartbeat(video: HTMLVideoElement) {
  stopHeartbeat()
  heartbeatTimer.value = setInterval(async () => {
    if (video.paused || video.ended) return
    await reportProgress(courseId.value, {
      currentTime: Math.round(video.currentTime),
      duration: isFinite(video.duration) ? video.duration : undefined,
    })
  }, 15000)
}

// 断点续播：loadedmetadata 事件后恢复位置
function onLoadedMetadata() {
  const pos = studyRecord.value.lastPositionSeconds
  if (pos > 5 && videoRef.value) {
    videoRef.value.currentTime = pos
  }
}
```

#### 5.2 Player 事件绑定

```html
<Player
  :resource="activeResource"
  :startTime="studyRecord.lastPositionSeconds"
  @play="startHeartbeat"
  @pause="stopHeartbeat"
  @ended="onLocalEnded"
  @loadedmetadata="onLoadedMetadata"
/>
```

> 注意：`@play` 事件携带 `HTMLVideoElement` 引用，`startHeartbeat` 直接接收该引用，无需通过 `videoRef` 间接访问。

---

### 6. Admin.vue 设计

#### 6.1 视图模式切换

```typescript
type AdminMode = 'list' | 'edit'
const mode = ref<AdminMode>('list')
const editingCourseId = ref<string>('')

function openEdit(courseId: string) {
  editingCourseId.value = courseId
  mode.value = 'edit'
}

function backToList() {
  editingCourseId.value = ''
  mode.value = 'list'
  refresh()  // 刷新列表
}
```

#### 6.2 模板结构

```html
<template>
  <!-- 列表模式 -->
  <div v-if="mode === 'list'">
    <!-- 原 AdminDashboardView 内容 -->
    <!-- 编辑按钮调用 openEdit(courseId) -->
  </div>

  <!-- 编辑模式 -->
  <div v-else-if="mode === 'edit'">
    <!-- 原 AdminCourseEditView 内容 -->
    <!-- "返回列表"按钮调用 backToList() -->
  </div>
</template>
```

---

### 7. 路由变更映射表

| 旧路由                        | 新路由         | 变更类型   | 指向组件         |
|-------------------------------|----------------|------------|------------------|
| `/`                           | `/`            | 组件替换   | `Home.vue`       |
| `/courses`                    | `/`            | 重定向     | —                |
| `/courses/:id`                | `/courses/:id` | 组件替换   | `CourseDetail.vue` |
| `/admin`                      | `/admin`       | 组件替换   | `Admin.vue`      |
| `/admin/courses/:id/edit`     | `/admin`       | 重定向     | —                |
| `/dashboard`                  | 保留不变       | —          | `DashboardView.vue` |
| `/auth`                       | 保留不变       | —          | `AuthView.vue`   |

#### 新 router/index.ts 结构

```typescript
import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '../layouts/DefaultLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      children: [
        { path: '', name: 'home', component: () => import('../views/Home.vue') },
        { path: 'courses', redirect: '/' },
        { path: 'courses/:id', name: 'course-detail', component: () => import('../views/CourseDetail.vue') },
      ]
    },
    { path: '/admin', name: 'admin', component: () => import('../views/Admin.vue') },
    { path: '/admin/courses/:id/edit', redirect: '/admin' },
    { path: '/dashboard', name: 'dashboard', component: () => import('../views/user/DashboardView.vue') },
    { path: '/auth', name: 'auth', component: () => import('../views/auth/AuthView.vue') },
  ]
})

export default router
```

---

### 8. 文件删除 / 新建 / 重命名清单

#### 删除文件

| 文件路径                                              | 原因                         |
|-------------------------------------------------------|------------------------------|
| `backend/src/controllers/courseController.ts`         | 逻辑内联至 api.ts            |
| `backend/src/controllers/resourceController.ts`       | 逻辑内联至 api.ts            |
| `backend/src/controllers/progressController.ts`       | 逻辑内联至 api.ts            |
| `backend/src/controllers/chatController.ts`           | 逻辑内联至 api.ts            |
| `frontend/src/views/home/HomeView.vue`                | 合并至 Home.vue              |
| `frontend/src/views/courses/CourseListView.vue`       | 合并至 Home.vue              |
| `frontend/src/views/courses/CourseDetailView.vue`     | 重构为 CourseDetail.vue      |
| `frontend/src/views/admin/AdminDashboardView.vue`     | 合并至 Admin.vue             |
| `frontend/src/views/admin/AdminCourseEditView.vue`    | 合并至 Admin.vue             |

#### 删除目录（文件删除后变为空目录）

| 目录路径                              |
|---------------------------------------|
| `backend/src/controllers/`            |
| `frontend/src/views/home/`            |
| `frontend/src/views/courses/`         |
| `frontend/src/views/admin/`           |

#### 新建文件

| 文件路径                                    | 内容说明                                      |
|---------------------------------------------|-----------------------------------------------|
| `frontend/src/components/Player.vue`        | 四种播放器类型封装，含 bilibili/youtube 解析  |
| `frontend/src/components/AIChat.vue`        | AI 聊天侧边栏，接受 courseId prop             |
| `frontend/src/views/Home.vue`               | 课程大厅（原 CourseListView 功能）            |
| `frontend/src/views/CourseDetail.vue`       | 核心学习页（使用 Player + AIChat 组件）       |
| `frontend/src/views/Admin.vue`              | 唯一管理页（list/edit 双模式）                |

#### 修改文件

| 文件路径                                    | 变更说明                                      |
|---------------------------------------------|-----------------------------------------------|
| `backend/src/routes/api.ts`                 | 内联所有 controller 逻辑，移除 controller import |
| `backend/prisma/schema.prisma`              | 删除 User 模型，修改 StudyRecord.userId       |
| `frontend/src/router/index.ts`              | 更新路由指向，添加重定向规则                  |

---

## Correctness Properties

以下属性用于验证重构后系统的正确性。

### P1: API 路由完整性（不变量）

重构后 `api.ts` 注册的路由集合必须与重构前完全相同：

```
routes_after == routes_before
其中 routes = { (method, path, middlewares) }
```

验证方式：对比重构前后 `router.stack` 的路由列表，确保 12 条路由全部存在。

### P2: Schema 迁移幂等性（幂等性）

对已执行过 `remove_user_model` migration 的数据库再次执行，结果不变：

```
apply(migration, apply(migration, db)) == apply(migration, db)
```

Prisma migration 系统通过 `_prisma_migrations` 表保证此属性。

### P3: 进度上报往返一致性（Round Trip）

```
POST /courses/:id/progress { currentTime: T, duration: D }
→ GET /courses/:id/progress
→ response.lastPositionSeconds == round(T)
```

### P4: B 站 URL 解析等价性（模型测试）

重构后 `Player.vue` 中的 `extractBilibiliEmbedUrl` 与重构前 `CourseDetailView.vue` 中的实现，对任意输入产生相同输出：

```
Player.extractBilibiliEmbedUrl(x) == CourseDetailView.extractBilibiliEmbedUrl(x)
  for all x in { BV号, www.bilibili.com URL, b23.tv URL, 无效字符串 }
```

### P5: 管理员 CRUD 完整性（不变量）

重构后管理员操作的语义不变：

```
create(course) → get(course.id) → course exists
update(course, data) → get(course.id) → course has data
delete(course) → get(course.id) → 404
```

### P6: StudyRecord 唯一约束（不变量）

对同一 `(userId, courseId)` 组合多次 upsert，数据库中始终只有一条记录：

```
upsert(userId="anonymous", courseId=X, t=10)
upsert(userId="anonymous", courseId=X, t=20)
count(StudyRecord where userId="anonymous" AND courseId=X) == 1
```
