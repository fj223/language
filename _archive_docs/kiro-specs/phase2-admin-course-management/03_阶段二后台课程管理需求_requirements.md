# Requirements Document

## Introduction

Phase 2 目标：在已完成的 Phase 1（鉴权、风控、环境校验）基础上，补全管理后台的课程与资源管理能力，并修复前台课程列表的分页/筛选接入问题，同时为 bilibili 类型资源提供 iframe 嵌入播放支持，以及将进度上报从 stub 升级为真实持久化写入。

当前技术栈：Vue 3 + TypeScript + Vite（前端）、Express 4 + TypeScript + Prisma + MySQL（后端）。

**范围边界**：
- Phase 3（课程播放页重构，新路由 `/courses/:courseId/play`，多资源类型播放器切换）— Out of Scope
- Phase 4（用户注册/登录系统）— Out of Scope
- Phase 5（完整学习进度持久化，依赖用户认证）— Out of Scope

---

## Glossary

- **Admin_API**: 后端 Express 路由层，处理 `/api/*` 请求
- **Course_Controller**: 后端课程相关业务逻辑控制器（`courseController.ts`）
- **Resource_Controller**: 后端资源独立 CRUD 控制器（Phase 2 新增，`resourceController.ts`）
- **Progress_Controller**: 后端进度上报控制器（`progressController.ts`）
- **Admin_Dashboard**: 前端管理后台课程列表页（`AdminDashboardView.vue`，路由 `/admin`）
- **Course_Edit_View**: 前端课程编辑页（`AdminCourseEditView.vue`，路由 `/admin/courses/:id/edit`）
- **Course_List_View**: 前端前台课程列表页（`CourseListView.vue`，路由 `/courses`）
- **Course_Detail_View**: 前端课程播放页（`CourseDetailView.vue`，路由 `/courses/:id`）
- **Course_API**: 前端 API 层（`frontend/src/api/course.ts`）
- **VideoResource**: Prisma 模型，字段：id、courseId、resourceType（local/youtube/bilibili/external_link）、sourceUrl、title、sortOrder
- **StudyRecord**: Prisma 模型，字段：id、userId、courseId、progressPercent、lastPositionSeconds、isCompleted、completedAt
- **ADMIN_TOKEN**: 环境变量，管理员鉴权令牌，由 `requireAdmin` 中间件校验
- **Anonymous_User_Id**: 无用户认证系统时用于占位的固定字符串（如 `"anonymous"`），Phase 4 前的临时方案
- **BV_Number**: bilibili 视频的唯一标识符，格式为 `BV` 开头的字母数字串（如 `BV1xx411c7mD`）

---

## Requirements

### Requirement 1：独立资源新增接口

**User Story:** As a 管理员, I want 通过独立接口为课程新增资源, so that 我可以在不重新提交整个资源列表的情况下添加单个资源。

#### Acceptance Criteria

1. WHEN 管理员向 `POST /api/courses/:courseId/resources` 发送包含有效 `resource_type` 和 `source_url` 的请求，THE Admin_API SHALL 在对应课程下创建一条新的 VideoResource 记录，并返回包含新资源完整字段的 JSON 响应（HTTP 201）。
2. WHEN 请求中 `resource_type` 不属于 `local | youtube | bilibili | external_link` 之一，THE Admin_API SHALL 返回 HTTP 400 错误，错误信息说明无效的资源类型。
3. WHEN 请求中 `source_url` 为空字符串或缺失，THE Admin_API SHALL 返回 HTTP 400 错误，错误信息说明 source_url 为必填项。
4. WHEN 请求中 `:courseId` 对应的课程不存在，THE Admin_API SHALL 返回 HTTP 404 错误。
5. WHEN 请求头中未携带有效的 ADMIN_TOKEN，THE Admin_API SHALL 返回 HTTP 401 错误。
6. THE Resource_Controller SHALL 将新资源的 `sortOrder` 设置为当前课程已有资源的最大 `sortOrder` 加 1（若课程无资源则设为 0）。

---

### Requirement 2：独立资源更新接口

**User Story:** As a 管理员, I want 通过独立接口更新单个资源的字段, so that 我可以修正资源信息而不影响其他资源。

#### Acceptance Criteria

1. WHEN 管理员向 `PUT /api/courses/:courseId/resources/:resourceId` 发送包含有效字段的请求，THE Admin_API SHALL 更新对应 VideoResource 记录的 `resourceType`、`sourceUrl`、`title` 字段，并返回更新后的资源 JSON（HTTP 200）。
2. WHEN `:resourceId` 对应的资源不存在，或该资源的 `courseId` 与 `:courseId` 不匹配，THE Admin_API SHALL 返回 HTTP 404 错误。
3. WHEN 请求中 `resource_type` 不属于合法枚举值，THE Admin_API SHALL 返回 HTTP 400 错误。
4. WHEN 请求中 `source_url` 为空字符串，THE Admin_API SHALL 返回 HTTP 400 错误。
5. WHEN 请求头中未携带有效的 ADMIN_TOKEN，THE Admin_API SHALL 返回 HTTP 401 错误。

---

### Requirement 3：独立资源删除接口

**User Story:** As a 管理员, I want 通过独立接口删除单个资源, so that 我可以精确移除不需要的资源而不影响其他资源。

#### Acceptance Criteria

1. WHEN 管理员向 `DELETE /api/courses/:courseId/resources/:resourceId` 发送请求，THE Admin_API SHALL 删除对应 VideoResource 记录，并返回被删除资源的 id（HTTP 200）。
2. WHEN `:resourceId` 对应的资源不存在，或该资源的 `courseId` 与 `:courseId` 不匹配，THE Admin_API SHALL 返回 HTTP 404 错误。
3. WHEN 请求头中未携带有效的 ADMIN_TOKEN，THE Admin_API SHALL 返回 HTTP 401 错误。

---

### Requirement 4：独立资源排序接口

**User Story:** As a 管理员, I want 通过独立接口提交资源的新排序, so that 我可以调整课程内资源的播放顺序。

#### Acceptance Criteria

1. WHEN 管理员向 `PUT /api/courses/:courseId/resources/sort` 发送包含 `resourceIds` 数组的请求，THE Admin_API SHALL 按数组顺序将对应资源的 `sortOrder` 从 0 开始依次重写，并返回更新后的完整课程 JSON（HTTP 200）。
2. WHEN `resourceIds` 数组中包含不属于该课程的资源 ID，THE Admin_API SHALL 返回 HTTP 400 错误，错误信息说明存在无效的资源 ID。
3. WHEN `resourceIds` 数组为空，THE Admin_API SHALL 返回 HTTP 400 错误。
4. WHEN `:courseId` 对应的课程不存在，THE Admin_API SHALL 返回 HTTP 404 错误。
5. WHEN 请求头中未携带有效的 ADMIN_TOKEN，THE Admin_API SHALL 返回 HTTP 401 错误。
6. THE Admin_API SHALL 在单个数据库事务中完成所有 sortOrder 的更新，以保证原子性。

---

### Requirement 5：Course_Edit_View 迁移至独立资源接口

**User Story:** As a 管理员, I want 课程编辑页的资源操作调用独立的资源 CRUD 接口, so that 每次操作只影响目标资源，减少不必要的全量提交。

#### Acceptance Criteria

1. WHEN 管理员在 Course_Edit_View 点击"新增资源"并填写表单后确认，THE Course_Edit_View SHALL 调用 `POST /api/courses/:courseId/resources` 接口，并在成功后将新资源追加到本地资源列表。
2. WHEN 管理员在 Course_Edit_View 编辑某资源并保存，THE Course_Edit_View SHALL 调用 `PUT /api/courses/:courseId/resources/:resourceId` 接口，并在成功后更新本地对应资源的显示。
3. WHEN 管理员在 Course_Edit_View 点击删除某资源并确认，THE Course_Edit_View SHALL 调用 `DELETE /api/courses/:courseId/resources/:resourceId` 接口，并在成功后从本地资源列表中移除该资源。
4. WHEN 管理员在 Course_Edit_View 调整资源顺序（上移/下移）后点击"保存排序"，THE Course_Edit_View SHALL 调用 `PUT /api/courses/:courseId/resources/sort` 接口，并在成功后以服务端返回的顺序刷新本地列表。
5. WHEN 任意资源接口调用返回 HTTP 401 或 403，THE Course_Edit_View SHALL 展示管理员令牌无效的提示，并引导用户重新配置 ADMIN_TOKEN。
6. WHILE 任意资源接口调用正在进行中，THE Course_Edit_View SHALL 禁用所有资源操作按钮，防止并发提交。
7. THE Course_Edit_View SHALL 保留"保存课程信息"按钮，仅调用 `PUT /api/courses/:id`（仅提交 title/coverUrl/description，不再包含 resources 数组）。

---

### Requirement 6：Course_API 新增独立资源函数

**User Story:** As a 前端开发者, I want Course_API 提供独立资源 CRUD 的 API 函数, so that 视图层可以直接调用而无需手动构造 HTTP 请求。

#### Acceptance Criteria

1. THE Course_API SHALL 导出 `addResource(courseId, input)` 函数，调用 `POST /api/courses/:courseId/resources`，返回新建的 VideoResourceDto。
2. THE Course_API SHALL 导出 `updateResource(courseId, resourceId, input)` 函数，调用 `PUT /api/courses/:courseId/resources/:resourceId`，返回更新后的 VideoResourceDto。
3. THE Course_API SHALL 导出 `deleteResource(courseId, resourceId)` 函数，调用 `DELETE /api/courses/:courseId/resources/:resourceId`，返回 `{ id: string }`。
4. THE Course_API SHALL 导出 `sortResources(courseId, resourceIds)` 函数，调用 `PUT /api/courses/:courseId/resources/sort`，返回更新后的 CourseDto。
5. THE Course_API SHALL 为上述所有函数提供 TypeScript 类型定义，输入参数类型与后端接口 Request body 对齐。

---

### Requirement 7：Course_List_View 分页与筛选接入

**User Story:** As a 学习者, I want 前台课程列表页的分页和筛选控件能真实过滤和翻页, so that 我可以在大量课程中找到感兴趣的内容。

#### Acceptance Criteria

1. WHEN Course_List_View 初始化时，THE Course_List_View SHALL 以 `page=1`、`pageSize=20` 调用 `getCourses` API，并将返回的 `items` 渲染为课程卡片列表。
2. WHEN 用户在 Course_List_View 选择资源类型筛选项，THE Course_List_View SHALL 将 `resource_type` 参数传入 `getCourses` 并重置 `page=1` 后重新请求，刷新课程列表。
3. WHEN 用户在 Course_List_View 点击分页器的"下一页"或具体页码，THE Course_List_View SHALL 以对应 `page` 值调用 `getCourses` 并更新课程列表。
4. WHEN 用户在 Course_List_View 点击"Reset All"，THE Course_List_View SHALL 清空所有筛选条件并以 `page=1` 重新请求课程列表。
5. WHILE Course_List_View 正在加载数据，THE Course_List_View SHALL 展示加载状态指示器，并禁用分页与筛选控件。
6. IF getCourses 接口返回错误，THEN THE Course_List_View SHALL 展示错误提示文案，并提供"重试"入口。
7. THE Course_List_View SHALL 根据 API 返回的 `pagination.totalPages` 动态渲染分页器的页码范围，不再使用硬编码页码。

---

### Requirement 8：Course_Detail_View bilibili 播放器支持

**User Story:** As a 学习者, I want bilibili 类型的资源能在课程播放页内嵌播放, so that 我不需要跳转到外部网站就能观看 bilibili 视频。

#### Acceptance Criteria

1. WHEN Course_Detail_View 的当前资源类型为 `bilibili`，THE Course_Detail_View SHALL 渲染 bilibili iframe 嵌入播放器，而非外链引导卡片。
2. THE Course_Detail_View SHALL 从资源的 `source_url` 中提取 BV_Number，支持以下两种输入格式：纯 BV 号（如 `BV1xx411c7mD`）和完整 bilibili URL（如 `https://www.bilibili.com/video/BV1xx411c7mD`）。
3. WHEN `source_url` 无法解析出有效的 BV_Number，THE Course_Detail_View SHALL 展示外链引导卡片作为降级方案，并显示"bilibili 链接无效"提示。
4. THE Course_Detail_View SHALL 使用 `https://player.bilibili.com/player.html?bvid={BV_Number}&page=1` 作为 iframe 的 `src`，并设置 `allowfullscreen` 属性。
5. WHEN bilibili iframe 加载完成，THE Course_Detail_View SHALL 保持与 youtube iframe 一致的容器尺寸（aspect-video 16:9）。

---

### Requirement 9：进度上报持久化（匿名占位方案）

**User Story:** As a 学习者, I want 播放结束时的进度上报能真实写入数据库, so that 系统能记录学习行为（即使在用户认证系统上线前）。

#### Acceptance Criteria

1. WHEN `POST /api/courses/:id/progress` 收到包含有效 `courseId` 和 `resourceId` 的请求，THE Progress_Controller SHALL 以 Anonymous_User_Id（固定值 `"anonymous"`）为 userId，在 StudyRecord 表中执行 upsert 操作（按 `userId + courseId` 唯一键），将 `isCompleted` 设为 `true`、`completedAt` 设为当前时间。
2. WHEN StudyRecord 的 upsert 操作成功，THE Progress_Controller SHALL 返回 `{ recorded: true, studyRecordId: string }`（HTTP 200）。
3. WHEN `courseId` 对应的课程不存在，THE Progress_Controller SHALL 返回 HTTP 404 错误。
4. WHEN `resourceId` 为空或缺失，THE Progress_Controller SHALL 返回 HTTP 400 错误。
5. IF 数据库写入操作失败，THEN THE Progress_Controller SHALL 返回 HTTP 500 错误，并在服务端日志中记录错误详情。
6. THE Progress_Controller SHALL 在响应中包含 `note` 字段，值为 `"anonymous mode, will be replaced in Phase 4"`，以标注该方案为临时占位。

---

### Requirement 10：后端路由注册

**User Story:** As a 后端开发者, I want 新增的资源接口路由被正确注册到 Express 路由表, so that 前端可以访问这些接口。

#### Acceptance Criteria

1. THE Admin_API SHALL 在 `backend/src/routes/api.ts` 中注册以下路由，并均使用 `requireAdmin` 中间件保护：
   - `POST /api/courses/:courseId/resources`
   - `PUT /api/courses/:courseId/resources/:resourceId`
   - `DELETE /api/courses/:courseId/resources/:resourceId`
   - `PUT /api/courses/:courseId/resources/sort`
2. THE Admin_API SHALL 确保 `PUT /api/courses/:courseId/resources/sort` 路由在 `PUT /api/courses/:courseId/resources/:resourceId` 路由之前注册，以避免 Express 将 `sort` 误匹配为 `:resourceId`。
3. THE Admin_API SHALL 保留现有的 `PUT /api/courses/:id` 路由，该路由继续支持全量更新课程信息（title/coverUrl/description），但不再要求 body 中包含 resources 数组（resources 字段变为可选）。

---

## Out of Scope（Phase 3–5）

以下功能不在本 Phase 2 范围内，将在后续阶段实现：

- **Phase 3**：课程播放页重构（新路由 `/courses/:courseId/play`）、多资源类型播放器切换（audio/pdf/h5）、播放进度实时上报（lastPositionSeconds）
- **Phase 4**：用户注册/登录系统（User 模型已在 schema 中，但无认证接口）
- **Phase 5**：基于真实 userId 的学习进度持久化（StudyRecord 完整功能）、学习历史页面
