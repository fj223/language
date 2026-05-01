# Design Document

## Overview

Phase 2 在已有的 Express + Prisma + MySQL 后端和 Vue 3 前端基础上，补全以下四个方向：

1. 后端新增独立资源 CRUD + 排序接口（Resource_Controller）
2. 前端 Course_Edit_View 迁移至独立资源接口
3. 前端 Course_List_View 接入真实分页/筛选
4. 前端 Course_Detail_View bilibili iframe 支持 + 进度上报持久化

不引入新的第三方依赖，不修改 Prisma schema（现有模型已满足需求）。

---

## Architecture

```
Browser
  └── Vue 3 Frontend
        ├── /admin                  AdminDashboardView (已有，无改动)
        ├── /admin/courses/:id/edit AdminCourseEditView (改造：独立资源接口)
        ├── /courses                CourseListView (改造：接入分页/筛选)
        └── /courses/:id            CourseDetailView (改造：bilibili + 进度持久化)

Express Backend
  └── /api
        ├── courses/*               Course_Controller (已有，微调 updateCourse)
        ├── courses/:cId/resources  Resource_Controller (新增)
        └── courses/:id/progress    Progress_Controller (升级：stub → DB upsert)
```

---

## Data Model

### 现有 schema 无需改动

`VideoResource` 和 `StudyRecord` 模型已满足 Phase 2 所有需求：

```prisma
model VideoResource {
  id           String            @id @default(cuid())
  courseId     String
  resourceType VideoResourceType @map("resource_type")
  sourceUrl    String            @map("source_url") @db.Text
  title        String?
  sortOrder    Int               @default(0)
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt
  course       Course            @relation(fields: [courseId], references: [id], onDelete: Cascade)
  @@index([courseId])
}

model StudyRecord {
  id                  String    @id @default(cuid())
  userId              String    -- Phase 2 固定为 "anonymous"
  courseId            String
  progressPercent     Float     @default(0)
  lastPositionSeconds Int       @default(0)
  isCompleted         Boolean   @default(false)
  completedAt         DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  @@unique([userId, courseId])  -- upsert 依赖此唯一键
  @@index([courseId])
}
```

### 索引优化建议

`VideoResource` 已有 `@@index([courseId])`，覆盖资源 CRUD 的按课程查询。

`Course` 列表分页查询涉及 `title` 模糊搜索和 `videoResources.resourceType` 筛选，建议在 MySQL 层补充：

```sql
-- 课程标题模糊搜索（LIKE '%keyword%' 无法走前缀索引，但数据量小时可接受）
-- 若后续数据量增大，可改为全文索引：
ALTER TABLE courses ADD FULLTEXT INDEX ft_title (title);

-- 资源类型筛选走 videoResources 子查询，已有 courseId 索引覆盖
-- 额外补充复合索引加速 (courseId, resource_type) 组合查询：
CREATE INDEX idx_vr_course_type ON video_resources (courseId, resource_type);
```

> 当前数据量级下，现有索引已足够。上述 SQL 作为未来扩展预案，不作为 Phase 2 必须执行的迁移。

---

## API Design

### 统一响应格式（沿用现有约定）

```ts
// 成功
{ ok: true, data: T }
// 失败
{ ok: false, error: string }
```

---

### 4.1 独立资源新增

```
POST /api/courses/:courseId/resources
Headers: x-admin-token | Authorization: Bearer <token>
```

Request body:
```ts
{
  resource_type: 'local' | 'youtube' | 'bilibili' | 'external_link'  // required
  source_url: string   // required, non-empty
  title?: string       // optional
}
```

Response 201:
```ts
{ ok: true, data: VideoResourceDto }
```

sortOrder 计算：`MAX(sortOrder) + 1`，若课程无资源则为 `0`。使用 Prisma aggregate：
```ts
const agg = await prisma.videoResource.aggregate({
  where: { courseId },
  _max: { sortOrder: true },
})
const nextOrder = (agg._max.sortOrder ?? -1) + 1
```

---

### 4.2 独立资源更新

```
PUT /api/courses/:courseId/resources/:resourceId
Headers: x-admin-token | Authorization: Bearer <token>
```

Request body:
```ts
{
  resource_type: VideoResourceType  // required
  source_url: string                // required, non-empty
  title?: string
}
```

Response 200: `{ ok: true, data: VideoResourceDto }`

校验：先查询资源是否存在且 `courseId` 匹配，不匹配返回 404。

---

### 4.3 独立资源删除

```
DELETE /api/courses/:courseId/resources/:resourceId
Headers: x-admin-token | Authorization: Bearer <token>
```

Response 200: `{ ok: true, data: { id: string } }`

---

### 4.4 资源排序

```
PUT /api/courses/:courseId/resources/sort
Headers: x-admin-token | Authorization: Bearer <token>
```

Request body:
```ts
{ resourceIds: string[] }  // 按新顺序排列的资源 ID 数组
```

Response 200: `{ ok: true, data: CourseDto }`  // 返回完整课程（含重排后资源列表）

实现：在单个 Prisma 事务中批量更新 sortOrder：
```ts
await prisma.$transaction(
  resourceIds.map((id, idx) =>
    prisma.videoResource.update({
      where: { id },
      data: { sortOrder: idx },
    })
  )
)
```

**路由注册顺序**（关键）：`sort` 路由必须在 `:resourceId` 路由之前注册，否则 Express 会将字符串 `"sort"` 匹配为 resourceId：
```ts
router.put('/courses/:courseId/resources/sort', requireAdmin, sortResources)
router.put('/courses/:courseId/resources/:resourceId', requireAdmin, updateResource)
```

---

### 4.5 进度上报（升级）

```
POST /api/courses/:id/progress
```

Request body:
```ts
{ resourceId: string }
```

Response 200:
```ts
{
  ok: true,
  data: {
    recorded: true,
    studyRecordId: string,
    note: "anonymous mode, will be replaced in Phase 4"
  }
}
```

实现：Prisma upsert，按 `@@unique([userId, courseId])` 键：
```ts
const record = await prisma.studyRecord.upsert({
  where: { userId_courseId: { userId: 'anonymous', courseId } },
  update: { isCompleted: true, completedAt: new Date() },
  create: {
    userId: 'anonymous',
    courseId,
    isCompleted: true,
    completedAt: new Date(),
  },
})
```

---

### 4.6 课程更新接口微调（PUT /api/courses/:id）

`resources` 字段改为可选。当 body 中不包含 `resources` 时，仅更新 `title/coverUrl/description`，不触碰资源表。当 body 中包含 `resources` 时，保持现有全量替换逻辑（向后兼容）。

---

## Component Design

### 后端：Resource_Controller（新文件）

**文件**：`backend/src/controllers/resourceController.ts`

导出函数：
- `addResource(req, res)` — POST handler
- `updateResource(req, res)` — PUT handler
- `deleteResource(req, res)` — DELETE handler
- `sortResources(req, res)` — PUT sort handler

共用辅助函数（从 courseController 提取或复制）：
- `parseResourceType(v)` — 枚举校验
- `serializeResource(r)` — 序列化为 VideoResourceDto

---

### 前端：Course_API 新增函数

**文件**：`frontend/src/api/course.ts`（追加）

```ts
export type ResourceInput = {
  resource_type: VideoResourceType
  source_url: string
  title?: string
}

export async function addResource(courseId: string, input: ResourceInput): Promise<VideoResourceDto>
export async function updateResource(courseId: string, resourceId: string, input: ResourceInput): Promise<VideoResourceDto>
export async function deleteResource(courseId: string, resourceId: string): Promise<{ id: string }>
export async function sortResources(courseId: string, resourceIds: string[]): Promise<CourseDto>
```

---

### 前端：AdminCourseEditView 改造

**核心变更**：将"全量保存"拆分为独立操作。

状态模型：
```ts
const saving = ref(false)          // 课程信息保存中
const resourceOp = ref(false)      // 资源操作进行中（新增/编辑/删除/排序）
const orderDirty = ref(false)      // 排序是否有未保存的变更
```

操作映射：
| 用户操作 | 调用接口 | 成功后行为 |
|---------|---------|-----------|
| 新增资源（表单确认） | `addResource` | 追加到 `form.resources` |
| 编辑资源（表单确认） | `updateResource` | 更新 `form.resources` 对应项 |
| 删除资源（确认弹窗） | `deleteResource` | 从 `form.resources` 移除 |
| 上移/下移 | 仅本地重排，标记 `orderDirty=true` | — |
| 保存排序 | `sortResources` | 以服务端返回顺序刷新列表，`orderDirty=false` |
| 保存课程信息 | `updateCourse`（仅 title/coverUrl/description） | 显示成功提示 |

新增/编辑资源使用同一个内联表单或简单 modal（不引入新 UI 库），通过 `editingResource` ref 区分新增/编辑模式：
```ts
const editingResource = ref<EditableResource | null>(null)  // null = 新增模式
```

---

### 前端：CourseListView 改造

**核心变更**：将静态 UI 绑定到真实 API 状态。

新增响应式状态：
```ts
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const totalPages = ref(1)
const selectedType = ref<VideoResourceType | ''>('')
```

分页器渲染逻辑：
- 显示首页、末页、当前页前后各 1 页，超出范围用 `...` 省略
- 页码数组由 `totalPages` 动态计算，不硬编码

筛选联动：选择资源类型后 `page.value = 1`，触发 `loadCourses()`。

---

### 前端：CourseDetailView bilibili 支持

在现有 `youtubeEmbedUrl` computed 旁边新增：

```ts
const bilibiliEmbedUrl = computed(() => {
  if (activeResource.value?.resource_type !== 'bilibili') return ''
  return extractBilibiliEmbedUrl(activeResource.value.source_url)
})

function extractBilibiliEmbedUrl(input: string): string {
  // 纯 BV 号
  if (/^BV[0-9A-Za-z]{10,}$/.test(input)) {
    return `https://player.bilibili.com/player.html?bvid=${input}&page=1`
  }
  // 完整 URL
  try {
    const u = new URL(input)
    const match = u.pathname.match(/\/(BV[0-9A-Za-z]{10,})/)
    if (match?.[1]) {
      return `https://player.bilibili.com/player.html?bvid=${match[1]}&page=1`
    }
  } catch { /* ignore */ }
  return ''  // 空字符串触发降级
}
```

模板中新增 bilibili 分支（在 youtube 分支之后，`v-else` 之前）：
```html
<template v-else-if="activeResource?.resource_type === 'bilibili'">
  <iframe
    v-if="bilibiliEmbedUrl"
    class="w-full h-full"
    :src="bilibiliEmbedUrl"
    title="Bilibili player"
    frameborder="0"
    allowfullscreen
    sandbox="allow-scripts allow-same-origin allow-popups"
  />
  <div v-else class="...">bilibili 链接无效，<a :href="activeResource.source_url" target="_blank">前往外部学习</a></div>
</template>
```

---

## Query Optimization

### 课程列表分页（GET /api/courses）

现有实现已使用 `skip/take` 分页，性能合理。针对两个筛选条件的优化思路：

**标题模糊搜索**（`title LIKE '%q%'`）：
- 当前数据量（百级）下，全表扫描可接受
- 若数据量增长到千级以上，可在 MySQL 层添加全文索引（见数据模型章节）
- Prisma 的 `contains` 在 MySQL 下生成 `LIKE '%q%'`，无法利用 B-Tree 前缀索引；全文索引方案需改用 `prisma.$queryRaw`

**资源类型筛选**（`videoResources.some({ resourceType })`）：
- Prisma 生成 `EXISTS (SELECT 1 FROM video_resources WHERE courseId = ... AND resource_type = ...)`
- `video_resources` 表已有 `@@index([courseId])`，EXISTS 子查询走索引
- 补充 `(courseId, resource_type)` 复合索引后，子查询可走覆盖索引，避免回表

**分页 COUNT 优化**：
- 现有实现先 `COUNT(*)` 再 `findMany`，两次查询
- 当筛选条件不变时，可在前端缓存 `total`，仅在筛选条件变化时重新 COUNT
- Phase 2 不做此优化，保持简单

---

## Error Handling

| 场景 | 后端响应 | 前端处理 |
|------|---------|---------|
| 资源不存在或 courseId 不匹配 | 404 `{ ok: false, error: "resource not found" }` | 显示错误提示 |
| 参数校验失败 | 400 `{ ok: false, error: "..." }` | 显示字段级错误 |
| 未携带 ADMIN_TOKEN | 401 `{ ok: false, error: "Unauthorized" }` | 显示令牌无效提示，引导重新配置 |
| 数据库错误 | 500 `{ ok: false, error: "..." }` | 显示通用错误提示 |
| bilibili URL 无效 | — | 前端降级为外链引导卡片 |
| 进度上报失败 | 500 | 前端静默失败（console.log），不阻断播放体验 |

---

## Implementation Notes

1. `resourceController.ts` 中的 `serializeResource` 函数与 `courseController.ts` 中的 `serializeCourse` 共用相同的字段映射逻辑（`resourceType → resource_type`，`sourceUrl → source_url`），建议提取到 `backend/src/lib/serializers.ts` 共享，避免重复。

2. `PUT /api/courses/:courseId/resources/sort` 与 `PUT /api/courses/:courseId/resources/:resourceId` 的路由冲突是 Express 的经典陷阱，**必须**确保 `sort` 路由先注册。

3. `StudyRecord` 的 `@@unique([userId, courseId])` 约束意味着同一匿名用户对同一课程只有一条记录。Phase 2 的进度上报仅记录"是否完成"，不记录具体资源进度（`resourceId` 不写入 StudyRecord，仅用于日志）。Phase 4 升级时需要扩展此模型。

4. `AdminCourseEditView` 改造后，"保存"按钮语义变为"保存课程信息"（仅 title/coverUrl/description），资源操作改为即时生效（每次操作立即调用接口）。需在 UI 上明确区分这两种保存语义，避免用户困惑。
