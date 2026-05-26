# Requirements Document

## Introduction

本次重构目标是对现有在线课程平台进行"极简主义重构"：将后端四个 Controller 文件合并进单一路由文件、删除 User 数据模型并将 StudyRecord 的 userId 改为普通字符串字段、将前端多个视图文件合并为三个核心页面，并将播放器与 AI 聊天抽离为独立可复用组件。重构后所有现有功能（课程 CRUD、进度保存、B 站视频解析、AI 聊天）必须保持完整。

## Glossary

- **API_Router**: `backend/src/routes/api.ts`，重构后包含所有路由定义与业务逻辑的单一文件
- **Schema**: `backend/prisma/schema.prisma`，Prisma 数据模型定义文件
- **StudyRecord**: 学习进度记录表，存储用户在某课程的播放位置与完成状态
- **Player**: `frontend/src/components/Player.vue`，封装四种视频资源类型的播放器组件
- **AIChat**: `frontend/src/components/AIChat.vue`，封装 AI 聊天侧边栏的组件
- **Home**: `frontend/src/views/Home.vue`，课程大厅页面（原 CourseListView）
- **CourseDetail**: `frontend/src/views/CourseDetail.vue`，核心学习页面（原 CourseDetailView）
- **Admin**: `frontend/src/views/Admin.vue`，唯一管理页面（合并原 AdminDashboardView + AdminCourseEditView）
- **ANONYMOUS_USER_ID**: 字符串常量 `"anonymous"`，在无用户系统时作为 StudyRecord.userId 的默认值
- **VideoResourceType**: 枚举，取值为 `local | youtube | bilibili | external_link`

---

## Requirements

### Requirement 1: 后端单文件化

**User Story:** 作为开发者，我希望将所有后端业务逻辑集中在 `api.ts` 一个文件中，以便减少文件跳转、降低维护成本。

#### Acceptance Criteria

1. THE API_Router SHALL 包含原 `courseController.ts`、`resourceController.ts`、`progressController.ts`、`chatController.ts` 中的全部路由处理函数，内联实现，不再通过 import 引用 controllers 目录。
2. WHEN 重构完成后，THE 系统 SHALL 保持与重构前完全相同的 HTTP 路由路径和方法（GET/POST/PUT/DELETE）。
3. THE API_Router SHALL 继续通过 `import` 使用 `backend/src/lib/apiResponse.ts`、`backend/src/lib/serializers.ts`、`backend/src/middleware/` 和 `backend/src/db/prisma.ts`，不内联这些模块。
4. WHEN 重构完成后，THE `backend/src/controllers/` 目录 SHALL 被删除，其中所有文件不再存在于代码库中。
5. THE API_Router SHALL 将所有路由处理函数按业务域分组，每组之间使用注释分隔（`// === Courses ===`、`// === Resources ===`、`// === Progress ===`、`// === Chat ===`）。

---

### Requirement 2: Schema 极致简化 — 删除 User 模型

**User Story:** 作为开发者，我希望删除 `User` 数据模型，以便消除不必要的用户系统依赖，简化数据库结构。

#### Acceptance Criteria

1. THE Schema SHALL 删除 `User` 模型定义及其所有字段。
2. THE Schema SHALL 将 `StudyRecord.userId` 字段从外键关联（`@relation`）改为普通 `String` 字段，保留 `@db.VarChar(191)` 约束，移除 `user User @relation(...)` 关系字段。
3. THE Schema SHALL 保留 `StudyRecord` 的 `@@unique([userId, courseId])` 约束，确保同一 userId + courseId 组合唯一。
4. WHEN Schema 变更后，THE 系统 SHALL 生成对应的 Prisma migration SQL 文件，migration 名称为 `remove_user_model`。
5. THE migration SQL SHALL 包含：删除 `StudyRecord` 表上 `userId` 字段的外键约束、删除 `User` 表的 DROP TABLE 语句。
6. WHEN `progressController` 逻辑迁移至 API_Router 后，THE API_Router SHALL 移除 `ensureAnonymousUser()` 函数及其对 `prisma.user.upsert` 的调用，因为 userId 不再需要外键约束。

---

### Requirement 3: 前端视图合并 — Home 页面

**User Story:** 作为用户，我希望在首页直接看到课程大厅（含搜索/筛选/分页），以便减少页面跳转。

#### Acceptance Criteria

1. THE Home SHALL 实现原 `CourseListView.vue` 的全部功能：课程列表展示、标题搜索（防抖 400ms）、资源类型筛选、分页导航。
2. THE Home SHALL 挂载于路由路径 `/`，替代原 `HomeView.vue`。
3. WHEN 用户访问 `/courses` 路径时，THE Router SHALL 重定向至 `/`。
4. THE Home SHALL 保留 URL query 参数同步（`?q=`、`?type=`、`?page=`），确保刷新后状态恢复。

---

### Requirement 4: 前端视图合并 — CourseDetail 页面

**User Story:** 作为学习者，我希望在课程详情页使用 Player 和 AIChat 组件，以便获得模块化、可维护的学习体验。

#### Acceptance Criteria

1. THE CourseDetail SHALL 使用 `Player` 组件渲染当前激活资源，通过 `:resource="activeResource"` prop 传入。
2. THE CourseDetail SHALL 使用 `AIChat` 组件渲染 AI 侧边栏，通过 `:courseId="courseId"` prop 传入。
3. THE CourseDetail SHALL 保留进度心跳（每 15 秒上报一次）、断点续播（`onLoadedMetadata` 恢复播放位置）、视频结束时上报完成状态的全部逻辑。
4. THE CourseDetail SHALL 挂载于路由路径 `/courses/:id`，路由名称保持 `course-detail`。
5. WHEN Player 组件 emit `play` 事件时，THE CourseDetail SHALL 启动心跳计时器。
6. WHEN Player 组件 emit `pause` 或 `ended` 事件时，THE CourseDetail SHALL 停止心跳计时器，`ended` 时额外触发最终进度上报。

---

### Requirement 5: 前端视图合并 — Admin 页面

**User Story:** 作为管理员，我希望在单一页面完成课程列表管理和课程编辑，以便减少页面切换。

#### Acceptance Criteria

1. THE Admin SHALL 在同一页面内提供两种视图模式：列表模式（展示课程表格、搜索、筛选、分页）和编辑模式（展示课程信息表单与资源管理）。
2. WHEN 管理员点击课程标题或"编辑"按钮时，THE Admin SHALL 切换至编辑模式，无需跳转至新路由。
3. THE Admin SHALL 挂载于路由路径 `/admin`，路由名称为 `admin`。
4. WHEN 原路由 `/admin/courses/:id/edit` 被访问时，THE Router SHALL 重定向至 `/admin`（编辑功能已内联）。
5. THE Admin SHALL 保留原 `AdminDashboardView` 的全部功能：课程列表、搜索、类型筛选、分页、创建课程抽屉、删除课程。
6. THE Admin SHALL 保留原 `AdminCourseEditView` 的全部功能：课程信息编辑、资源列表管理（新增/编辑/删除/排序）。

---

### Requirement 6: Player 组件

**User Story:** 作为开发者，我希望将四种播放器类型封装为独立的 `Player.vue` 组件，以便在多个页面复用。

#### Acceptance Criteria

1. THE Player SHALL 接受 `resource` prop，类型为 `VideoResourceDto | null`，当值为 `null` 时渲染空状态占位符。
2. THE Player SHALL 根据 `resource.resource_type` 的值（`local | youtube | bilibili | external_link`）渲染对应的播放器 UI。
3. THE Player SHALL 内含 `extractBilibiliEmbedUrl(input: string): string` 函数，逻辑与原 `CourseDetailView` 中完全一致（支持纯 BV 号、`www.bilibili.com` URL，b23.tv 返回空字符串）。
4. THE Player SHALL 内含 `extractYouTubeId(input: string): string` 函数，逻辑与原 `CourseDetailView` 中完全一致（支持 ID、youtu.be、youtube.com 多种格式）。
5. WHEN `resource.resource_type === 'local'` 时，THE Player SHALL emit `play` 事件（携带 `HTMLVideoElement` 引用）、`pause` 事件、`ended` 事件、`loadedmetadata` 事件。
6. WHEN `resource.resource_type === 'bilibili'` 且 `extractBilibiliEmbedUrl` 返回空字符串时，THE Player SHALL 渲染降级 UI，提供跳转至原网页的外链按钮。
7. THE Player SHALL 接受可选 prop `startTime: number`（默认值 `0`），用于 bilibili iframe URL 拼接 `&t={startTime}` 参数。

---

### Requirement 7: AIChat 组件

**User Story:** 作为开发者，我希望将 AI 聊天侧边栏封装为独立的 `AIChat.vue` 组件，以便在多个页面复用。

#### Acceptance Criteria

1. THE AIChat SHALL 接受 `courseId` prop，类型为 `string`。
2. THE AIChat SHALL 内含聊天消息状态（`chatMessages`）、输入框状态（`chatInput`）、发送中状态（`sending`）。
3. WHEN 用户按下 Enter（非 Shift+Enter）或点击发送按钮时，THE AIChat SHALL 调用 `postChatMessage` API 发送消息。
4. THE AIChat SHALL 在发送请求期间显示"AI 正在思考..."占位消息，请求完成后替换为实际回复。
5. THE AIChat SHALL 在每次新消息添加后自动滚动至底部。
6. IF API 请求失败，THEN THE AIChat SHALL 将错误信息显示为 AI 回复消息，不抛出未捕获异常。

---

### Requirement 8: 路由更新

**User Story:** 作为开发者，我希望更新路由配置以反映视图合并结果，以便路由结构与文件结构保持一致。

#### Acceptance Criteria

1. THE Router SHALL 将 `/` 路由指向 `Home.vue`（原指向 `HomeView.vue`）。
2. THE Router SHALL 将 `/courses/:id` 路由指向 `CourseDetail.vue`（原指向 `CourseDetailView.vue`）。
3. THE Router SHALL 将 `/admin` 路由指向 `Admin.vue`（原指向 `AdminDashboardView.vue`）。
4. THE Router SHALL 添加从 `/courses` 到 `/` 的重定向规则。
5. THE Router SHALL 添加从 `/admin/courses/:id/edit` 到 `/admin` 的重定向规则。
6. THE Router SHALL 移除对已删除视图文件的所有 `import` 引用。

---

### Requirement 9: 文件删除清单

**User Story:** 作为开发者，我希望明确哪些文件需要被删除，以便保持代码库整洁。

#### Acceptance Criteria

1. THE 系统 SHALL 删除以下后端文件：`backend/src/controllers/courseController.ts`、`backend/src/controllers/resourceController.ts`、`backend/src/controllers/progressController.ts`、`backend/src/controllers/chatController.ts`。
2. THE 系统 SHALL 删除以下前端文件：`frontend/src/views/courses/CourseListView.vue`、`frontend/src/views/courses/CourseDetailView.vue`、`frontend/src/views/admin/AdminDashboardView.vue`、`frontend/src/views/admin/AdminCourseEditView.vue`、`frontend/src/views/home/HomeView.vue`。
3. THE 系统 SHALL 新建以下文件：`frontend/src/components/Player.vue`、`frontend/src/components/AIChat.vue`、`frontend/src/views/Home.vue`、`frontend/src/views/CourseDetail.vue`、`frontend/src/views/Admin.vue`。
4. IF 删除文件后存在空目录（如 `backend/src/controllers/`、`frontend/src/views/courses/`、`frontend/src/views/admin/`、`frontend/src/views/home/`），THEN THE 系统 SHALL 同时删除这些空目录。

---

### Requirement 10: 功能完整性保障

**User Story:** 作为用户，我希望重构后所有现有功能依然正常工作，以便重构不影响使用体验。

#### Acceptance Criteria

1. WHEN 重构完成后，THE 系统 SHALL 通过与重构前相同的 API 端点提供课程 CRUD、资源管理、进度上报、AI 聊天功能。
2. THE Player SHALL 正确解析 B 站 BV 号和完整 URL，生成有效的 `player.bilibili.com` 嵌入地址，行为与重构前 `extractBilibiliEmbedUrl` 函数完全一致。
3. WHEN 学习者播放本地视频时，THE CourseDetail SHALL 每 15 秒上报一次进度，上报数据包含 `currentTime` 和 `duration` 字段。
4. WHEN 学习者重新打开已学习的课程时，THE CourseDetail SHALL 从 `StudyRecord.lastPositionSeconds` 恢复播放位置（仅当 `lastPositionSeconds > 5` 时）。
5. THE Admin SHALL 保留管理员令牌（`ADMIN_TOKEN`）的本地存储与配置功能，所有需要鉴权的操作在令牌无效时显示明确的错误提示。
