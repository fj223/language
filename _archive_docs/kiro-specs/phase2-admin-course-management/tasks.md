# Implementation Plan: Phase 2 管理后台课程与资源管理

## Overview

基于已完成的 Phase 1（鉴权、风控、环境校验），本计划分 8 个阶段实现：后端共用序列化工具提取、独立资源 CRUD Controller、进度上报持久化、路由注册与 updateCourse 微调、前端 API 封装、AdminCourseEditView 改造、CourseListView 分页/筛选接入、CourseDetailView bilibili 支持。

## Tasks

- [x] 1. 提取后端共用序列化工具
  - [x] 1.1 新建 serializers.ts 并导出 serializeResource 和 serializeCourse
    - 新建 `backend/src/lib/serializers.ts`
    - 从 `courseController.ts` 中提取 `serializeCourse` 函数（含内部 `serializeResource` 逻辑）移入该文件
    - 导出 `serializeResource(r)` 和 `serializeCourse(course)` 两个函数，类型签名与现有实现保持一致
    - _Requirements: 1.1, 2.1, 3.1, 4.1_

  - [x] 1.2 修改 courseController.ts 改为 import serializers
    - 修改 `backend/src/controllers/courseController.ts`
    - 删除文件内的 `serializeCourse` 函数定义，改为从 `../lib/serializers.js` import
    - 确保 `getCourses`、`getCourseById`、`createCourse`、`updateCourse` 调用路径不变
    - _Requirements: 10.1_

- [x] 2. 实现 Resource Controller
  - [x] 2.1 新建 resourceController.ts 并实现 addResource
    - 新建 `backend/src/controllers/resourceController.ts`
    - 实现 `addResource(req, res)`：校验 courseId 存在（404）、resource_type 合法（400）、source_url 非空（400）、ADMIN_TOKEN（由中间件处理）
    - 使用 `prisma.videoResource.aggregate` 计算 `nextOrder = MAX(sortOrder) + 1`（无资源时为 0）
    - 创建记录后调用 `serializeResource` 序列化，返回 HTTP 201 + VideoResourceDto
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 2.2 实现 updateResource handler
    - 在 `backend/src/controllers/resourceController.ts` 中实现 `updateResource(req, res)`
    - 先查询资源是否存在且 `courseId` 匹配，不匹配返回 404
    - 校验 resource_type 合法（400）、source_url 非空（400）
    - 更新 `resourceType`、`sourceUrl`、`title` 字段，返回 HTTP 200 + VideoResourceDto
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 2.3 实现 deleteResource handler
    - 在 `backend/src/controllers/resourceController.ts` 中实现 `deleteResource(req, res)`
    - 先查询资源是否存在且 `courseId` 匹配，不匹配返回 404
    - 删除记录，返回 HTTP 200 + `{ id: resourceId }`
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 2.4 实现 sortResources handler
    - 在 `backend/src/controllers/resourceController.ts` 中实现 `sortResources(req, res)`
    - 校验 `resourceIds` 非空（400）、courseId 对应课程存在（404）
    - 查询该课程所有资源 ID，校验 `resourceIds` 中所有 ID 均属于该课程（400）
    - 在单个 `prisma.$transaction` 中批量 `update` sortOrder（按数组下标 0 起）
    - 返回 HTTP 200 + 完整 CourseDto（含重排后资源列表）
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 3. 升级 Progress Controller 为真实 DB 写入
  - [x] 3.1 修改 progressController.ts 实现 StudyRecord upsert
    - 修改 `backend/src/controllers/progressController.ts`
    - 校验 courseId 对应课程存在（404）、resourceId 非空（400）
    - 以 `userId = "anonymous"` 执行 `prisma.studyRecord.upsert`，按 `@@unique([userId, courseId])` 键
    - upsert update 字段：`isCompleted: true, completedAt: new Date()`；create 字段同上加 userId/courseId
    - 返回 HTTP 200 + `{ recorded: true, studyRecordId: string, note: "anonymous mode, will be replaced in Phase 4" }`
    - DB 写入失败时返回 HTTP 500 并 `console.error` 记录错误
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 4. 路由注册与 updateCourse 微调
  - [x] 4.1 在 api.ts 中注册资源独立接口路由
    - 修改 `backend/src/routes/api.ts`
    - import `addResource`、`updateResource`、`deleteResource`、`sortResources` from resourceController
    - 按顺序注册（sort 必须在 :resourceId 之前）：
      - `POST /courses/:courseId/resources` → requireAdmin + addResource
      - `PUT /courses/:courseId/resources/sort` → requireAdmin + sortResources
      - `PUT /courses/:courseId/resources/:resourceId` → requireAdmin + updateResource
      - `DELETE /courses/:courseId/resources/:resourceId` → requireAdmin + deleteResource
    - _Requirements: 10.1, 10.2_

  - [x] 4.2 修改 updateCourse — resources 字段改为可选
    - 修改 `backend/src/controllers/courseController.ts` 中的 `updateCourse` handler
    - 当 `body.resources` 为 `undefined`（即 body 中不含该字段）时，仅更新 title/coverUrl/description，跳过资源表操作
    - 当 `body.resources` 存在时，保持现有全量替换逻辑（向后兼容）
    - 移除"resources 为空时返回 400"的校验（该校验仅在 resources 字段存在且解析后为空时触发）
    - _Requirements: 10.3, 5.7_

- [x] 5. 前端 Course API 封装
  - [x] 5.1 新增 ResourceInput 类型定义
    - 修改 `frontend/src/api/course.ts`
    - 新增 `export type ResourceInput = { resource_type: VideoResourceType; source_url: string; title?: string }`
    - _Requirements: 6.5_

  - [x] 5.2 实现 addResource API 函数
    - 修改 `frontend/src/api/course.ts`
    - 实现 `export async function addResource(courseId: string, input: ResourceInput): Promise<VideoResourceDto>`
    - 调用 `POST /api/courses/:courseId/resources`，返回 `res.data.data`
    - _Requirements: 6.1_

  - [x] 5.3 实现 updateResource API 函数
    - 修改 `frontend/src/api/course.ts`
    - 实现 `export async function updateResource(courseId: string, resourceId: string, input: ResourceInput): Promise<VideoResourceDto>`
    - 调用 `PUT /api/courses/:courseId/resources/:resourceId`，返回 `res.data.data`
    - _Requirements: 6.2_

  - [x] 5.4 实现 deleteResource API 函数
    - 修改 `frontend/src/api/course.ts`
    - 实现 `export async function deleteResource(courseId: string, resourceId: string): Promise<{ id: string }>`
    - 调用 `DELETE /api/courses/:courseId/resources/:resourceId`，返回 `res.data.data`
    - _Requirements: 6.3_

  - [x] 5.5 实现 sortResources API 函数
    - 修改 `frontend/src/api/course.ts`
    - 实现 `export async function sortResources(courseId: string, resourceIds: string[]): Promise<CourseDto>`
    - 调用 `PUT /api/courses/:courseId/resources/sort`，body 为 `{ resourceIds }`，返回 `res.data.data`
    - _Requirements: 6.4_

  - [x] 5.6 修改 UpdateCourseInput 类型 — resources 改为可选
    - 修改 `frontend/src/api/course.ts` 中的 `UpdateCourseInput` 类型
    - 将 `resources` 字段改为可选：`resources?: Array<...>`
    - _Requirements: 5.7_

- [x] 6. Checkpoint — 后端接口与前端 API 层联调
  - 确保所有后端路由已注册，前端 API 函数类型正确，ask the user if questions arise.

- [x] 7. AdminCourseEditView 改造
  - [x] 7.1 新增资源操作状态变量
    - 修改 `frontend/src/views/admin/AdminCourseEditView.vue`
    - 在 `<script setup>` 中新增 `const resourceOp = ref(false)` 和 `const orderDirty = ref(false)`
    - 新增 `const editingResource = ref<EditableResource | null>(null)`（null 表示新增模式，非 null 表示编辑模式）
    - _Requirements: 5.6_

  - [x] 7.2 新增/编辑资源内联 modal
    - 修改 `frontend/src/views/admin/AdminCourseEditView.vue`
    - 在模板中新增内联 modal（不引入新 UI 库），包含 resource_type select、source_url input、title input 和确认/取消按钮
    - modal 通过 `editingResource !== null || showAddModal` 控制显示，表单数据绑定到 `modalForm` reactive 对象
    - _Requirements: 5.1, 5.2_

  - [x] 7.3 新增资源调用 addResource 接口
    - 修改 `frontend/src/views/admin/AdminCourseEditView.vue`
    - 点击"新增资源"按钮时设置 `editingResource = null` 并打开 modal
    - modal 确认后调用 `addResource(courseId, modalForm)`，成功后将返回的 VideoResourceDto 追加到 `form.resources`
    - 操作期间设置 `resourceOp = true` 禁用所有资源按钮，操作完成后恢复
    - _Requirements: 5.1, 5.6_

  - [x] 7.4 编辑资源调用 updateResource 接口
    - 修改 `frontend/src/views/admin/AdminCourseEditView.vue`
    - 每个资源行新增"编辑"按钮，点击时将该资源赋值给 `editingResource` 并打开 modal（预填表单）
    - modal 确认后调用 `updateResource(courseId, editingResource.id, modalForm)`，成功后更新 `form.resources` 中对应项
    - _Requirements: 5.2, 5.6_

  - [x] 7.5 删除资源调用 deleteResource 接口
    - 修改 `frontend/src/views/admin/AdminCourseEditView.vue`
    - 删除按钮点击后弹出 `window.confirm`，确认后调用 `deleteResource(courseId, r.id)`
    - 成功后从 `form.resources` 中移除对应项（按 id 匹配）
    - 操作期间设置 `resourceOp = true` 禁用所有资源按钮
    - _Requirements: 5.3, 5.5, 5.6_

  - [x] 7.6 排序本地重排 + 保存排序调用 sortResources
    - 修改 `frontend/src/views/admin/AdminCourseEditView.vue`
    - 上移/下移按钮仅本地重排 `form.resources` 数组，并设置 `orderDirty = true`
    - 新增"保存排序"按钮（仅当 `orderDirty === true` 时显示/激活），点击后调用 `sortResources(courseId, form.resources.map(r => r.id))`
    - 成功后以服务端返回的 CourseDto 刷新 `form.resources`，设置 `orderDirty = false`
    - _Requirements: 5.4, 5.6_

  - [x] 7.7 保存课程信息仅提交 title/coverUrl/description
    - 修改 `frontend/src/views/admin/AdminCourseEditView.vue`
    - 修改 `saveAll` 函数，调用 `updateCourse` 时不再传 `resources` 字段
    - 移除 `validate()` 中"至少需要一个资源"的校验（资源操作已独立）
    - 将按钮文案从"保存"改为"保存课程信息"以明确语义
    - _Requirements: 5.7_

  - [x] 7.8 401/403 错误统一处理
    - 修改 `frontend/src/views/admin/AdminCourseEditView.vue`
    - 在资源操作（addResource/updateResource/deleteResource/sortResources）的 catch 块中，检测 axios 401/403 时设置 `authError`
    - _Requirements: 5.5_

- [x] 8. CourseListView 分页/筛选接入
  - [x] 8.1 新增分页/筛选响应式状态
    - 修改 `frontend/src/views/courses/CourseListView.vue`
    - 新增 `const page = ref(1)`、`const pageSize = ref(20)`、`const total = ref(0)`、`const totalPages = ref(1)`、`const selectedType = ref<VideoResourceType | ''>('')`
    - 将 `onMounted` 中的硬编码 `{ page: 1, pageSize: 50 }` 替换为响应式变量
    - _Requirements: 7.1_

  - [x] 8.2 封装 loadCourses 函数并接入筛选
    - 修改 `frontend/src/views/courses/CourseListView.vue`
    - 提取 `async function loadCourses()` 函数，调用 `getCourses({ page: page.value, pageSize: pageSize.value, resource_type: selectedType.value || undefined })`
    - 成功后更新 `courses`、`total`、`totalPages`
    - 将 Source 筛选 checkbox 绑定到 `selectedType`（单选，选中时设置对应类型，再次点击清空）
    - 筛选变化时重置 `page = 1` 并调用 `loadCourses()`
    - _Requirements: 7.2_

  - [x] 8.3 动态渲染分页器
    - 修改 `frontend/src/views/courses/CourseListView.vue`
    - 新增 `pageNumbers` computed，根据 `totalPages` 和 `page` 计算页码数组（首页、末页、当前页±1，超出范围用字符串 `'...'` 占位）
    - 替换模板中硬编码的页码按钮，改为 `v-for="p in pageNumbers"` 动态渲染
    - 上一页/下一页按钮绑定 `page` 变更并调用 `loadCourses()`
    - _Requirements: 7.3, 7.7_

  - [x] 8.4 Reset All 按钮清空筛选并重新请求
    - 修改 `frontend/src/views/courses/CourseListView.vue`
    - 绑定 Reset All 按钮的 `@click`，清空 `selectedType = ''`，重置 `page = 1`，调用 `loadCourses()`
    - _Requirements: 7.4_

  - [x] 8.5 加载中禁用控件 + 错误提示 + 重试
    - 修改 `frontend/src/views/courses/CourseListView.vue`
    - `loading` 为 true 时，分页按钮和筛选 checkbox 添加 `:disabled="loading"` 属性
    - 接口失败时在页面显示错误文案，并新增"重试"按钮（`@click="loadCourses()"`）
    - _Requirements: 7.5, 7.6_

- [x] 9. Checkpoint — 前台课程列表联调
  - 确保分页/筛选/重置功能正常，加载状态和错误处理符合预期，ask the user if questions arise.

- [x] 10. CourseDetailView bilibili 支持
  - [x] 10.1 实现 extractBilibiliEmbedUrl 函数
    - 修改 `frontend/src/views/courses/CourseDetailView.vue`
    - 在 `extractYouTubeId` 函数旁边新增 `function extractBilibiliEmbedUrl(input: string): string`
    - 支持纯 BV 号（正则 `/^BV[0-9A-Za-z]{10,}$/`）和完整 bilibili URL（从 pathname 提取 BV 号）
    - 有效时返回 `https://player.bilibili.com/player.html?bvid={BV}&page=1`，无效时返回空字符串
    - _Requirements: 8.2_

  - [x] 10.2 新增 bilibiliEmbedUrl computed
    - 修改 `frontend/src/views/courses/CourseDetailView.vue`
    - 在 `youtubeEmbedUrl` computed 旁边新增 `const bilibiliEmbedUrl = computed(() => { ... })`
    - 当 `activeResource.value?.resource_type !== 'bilibili'` 时返回空字符串，否则调用 `extractBilibiliEmbedUrl`
    - _Requirements: 8.1_

  - [x] 10.3 模板中新增 bilibili iframe 分支
    - 修改 `frontend/src/views/courses/CourseDetailView.vue`
    - 在 youtube `<template v-else-if>` 分支之后、`<template v-else>` 之前插入 bilibili 分支
    - `bilibiliEmbedUrl` 有值时渲染 `<iframe>` 并设置 `allowfullscreen`、`sandbox="allow-scripts allow-same-origin allow-popups"`、`class="w-full h-full"`
    - `bilibiliEmbedUrl` 为空时渲染降级卡片，显示"bilibili 链接无效"提示和外链按钮
    - _Requirements: 8.1, 8.3, 8.4, 8.5_

- [x] 11. Final Checkpoint — 全功能回归
  - 确保所有测试通过，后端接口、前端视图、bilibili 播放均正常，ask the user if questions arise.

## Notes

- 任务标注 `*` 的为可选测试子任务，可跳过以加快 MVP 交付
- 路由注册顺序关键：`sort` 路由必须在 `:resourceId` 路由之前，否则 Express 将 `"sort"` 误匹配为 resourceId
- Task 1（serializers 提取）是 Task 2（resourceController）的前置依赖，必须先完成
- Task 4.2（updateCourse 微调）与 Task 7.7（前端不传 resources）需配套上线，避免中间状态导致课程信息保存失败
