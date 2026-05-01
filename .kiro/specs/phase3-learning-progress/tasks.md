# Implementation Plan: Phase 3 学习进度持久化

## Overview

按照后端 → 路由 → 前端 API → 前端 UI 的顺序，逐步实现学习进度持久化闭环。所有改动均为增量修改，不涉及 Schema 变更。

## Tasks

- [x] 1. 升级后端 Progress_Controller
  - [x] 1.1 重写 `reportCourseProgress` 函数
    - 将 Request body 类型从 `{ resourceId }` 改为 `{ currentTime, duration }`
    - 验证 `currentTime`：必填，`parseFloat` 后 `>= 0`，否则返回 400
    - 解析 `duration`：可选，`parseFloat` 后 `> 0` 才有效
    - 计算 `progressPercent = Math.min((currentTime / duration) * 100, 100)`（仅当 duration 有效时）
    - 计算 `shouldComplete = duration > 0 && currentTime / duration >= 0.9`
    - upsert `StudyRecord`：update 字段仅在条件满足时传入（不传 `isCompleted: false`，保证不可逆）
    - 响应体包含 `{ recorded, studyRecordId, isCompleted, lastPositionSeconds, note }`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

  - [ ]* 1.2 为 `reportCourseProgress` 编写属性测试
    - **Property 1：完成判定不变量** — 验证 `isCompleted === (currentTime / duration >= 0.9)`
    - **Validates: Requirements 1.2**
    - **Property 2：progressPercent 范围不变量** — 验证 `0 <= progressPercent <= 100` 且值与公式一致
    - **Validates: Requirements 1.4**
    - **Property 3：isCompleted 不可逆性** — 先触发完成，再发送低进度请求，验证 `isCompleted` 仍为 `true`
    - **Validates: Requirements 1.3**

  - [x] 1.3 新增 `getCourseProgress` 函数
    - 验证 `courseId`，课程不存在返回 404
    - `findUnique` 查询 `StudyRecord`（`userId: ANONYMOUS_USER_ID, courseId`）
    - 无记录时返回 `{ lastPositionSeconds: 0, isCompleted: false, progressPercent: 0 }`，不创建新记录
    - 有记录时返回完整字段（含 `studyRecordId`）
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 1.4 为 `getCourseProgress` 编写属性测试
    - **Property 4：GET/POST 数据一致性（Round-Trip）** — POST 后 GET，验证 `lastPositionSeconds` 和 `isCompleted` 一致
    - **Validates: Requirements 2.1, 2.2**
    - **Property 6：默认值不变量** — 无记录时 GET 返回零值，且不创建新记录
    - **Validates: Requirements 2.3**

- [x] 2. 注册后端路由
  - [x] 2.1 在 `backend/src/routes/api.ts` 中注册新路由
    - 从 `progressController.ts` 导入 `getCourseProgress`
    - 在 `POST /courses/:id/progress` 之前添加 `router.get('/courses/:id/progress', getCourseProgress)`
    - 确认该路由不加 `requireAdmin` 中间件
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 3. Checkpoint — 确认后端接口可用
  - 确保所有后端测试通过，`GET /api/courses/:id/progress` 和 `POST /api/courses/:id/progress` 均可正常响应，如有问题请告知。

- [x] 4. 新增前端 Progress_API
  - [x] 4.1 在 `frontend/src/api/course.ts` 中新增类型和函数
    - 新增 `ProgressDto` 类型：`{ studyRecordId?: string, lastPositionSeconds: number, isCompleted: boolean, progressPercent: number }`
    - 新增 `ReportProgressResult` 类型：`{ recorded: boolean, studyRecordId: string, isCompleted: boolean, lastPositionSeconds: number, note: string }`
    - 新增 `getCourseProgress(courseId: string): Promise<ProgressDto>` 函数，调用 `GET /api/courses/:id/progress`
    - 新增 `reportProgress(courseId, { currentTime, duration? }): Promise<ReportProgressResult>` 函数，调用 `POST /api/courses/:id/progress`
    - 移除旧的 `reportCourseProgress` 函数（已被 `reportProgress` 替代）
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 4.2 为 `bilibiliEmbedUrl` computed 编写属性测试
    - **Property 5：bilibili embed URL 的 t 参数正确性** — mock `studyRecord.lastPositionSeconds`，验证 URL 中 `&t=` 参数值正确
    - **Validates: Requirements 5.2, 5.3, 5.4**

- [x] 5. 升级 CourseDetailView 前端逻辑
  - [x] 5.1 新增响应式状态和生命周期清理
    - 新增 `studyRecord` ref（类型 `ProgressDto`，默认值 `{ lastPositionSeconds: 0, isCompleted: false, progressPercent: 0 }`）
    - 新增 `heartbeatTimer` ref 和 `videoRef` ref（绑定到 `<video>` 元素）
    - 在 `onUnmounted` 中调用 `stopHeartbeat()`
    - _Requirements: 3.5_

  - [x] 5.2 实现 `loadProgress` 函数并在初始化和资源切换时调用
    - 实现 `loadProgress()`：调用 `getCourseProgress`，成功则更新 `studyRecord`，失败静默忽略
    - 在 `reload()` 函数末尾调用 `loadProgress()`
    - 在 `watch(activeResourceId)` 中调用 `stopHeartbeat()`
    - _Requirements: 4.1, 4.4, 4.5, 6.1_

  - [x] 5.3 实现心跳机制（`startHeartbeat` / `stopHeartbeat`）
    - 实现 `stopHeartbeat()`：清除 `heartbeatTimer`
    - 实现 `startHeartbeat(video: HTMLVideoElement)`：每 15 秒调用 `reportProgress`，传入 `currentTime` 和有效的 `duration`；成功后更新 `studyRecord`；失败静默忽略
    - 处理 `duration` 为 NaN 或 0 时不传 `duration` 字段
    - _Requirements: 3.1, 3.2, 3.6, 6.5_

  - [x] 5.4 升级 `<video>` 元素模板绑定
    - 为 `<video>` 元素添加 `ref="videoRef"`
    - 将 `@play` 绑定到 `startHeartbeat($event.target as HTMLVideoElement)`
    - 将 `@pause` 绑定到 `stopHeartbeat`
    - 保留 `@ended="onLocalEnded"`，并在 `onLocalEnded` 中调用 `stopHeartbeat()` 后立即上报 `video.duration` 作为 `currentTime`
    - 添加 `@loadedmetadata="onLoadedMetadata"` 事件
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 5.5 实现 local 视频断点续播（`onLoadedMetadata`）
    - 实现 `onLoadedMetadata()`：当 `studyRecord.lastPositionSeconds > 5` 时，将 `videoRef.value.currentTime` 设为该值
    - _Requirements: 4.2, 4.3_

  - [x] 5.6 升级 `bilibiliEmbedUrl` computed 以支持断点续播
    - 在现有 `bilibiliEmbedUrl` computed 中，当 `studyRecord.lastPositionSeconds > 0` 时追加 `&t={lastPositionSeconds}`
    - 保留现有 `&as_wide=1&high_quality=1&danmaku=1` 参数
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 5.7 在剧集目录模板中添加 Progress_Indicator 图标
    - 在每个资源按钮内（资源标签旁）添加条件渲染：
      - `isCompleted === true`：显示绿色 `check_circle` Material Symbol（`FILL 1`）
      - `lastPositionSeconds > 0 && !isCompleted`：显示蓝色 `radio_button_checked` Material Symbol（`FILL 1`）
      - 其他情况：不显示图标
    - _Requirements: 6.2, 6.3, 6.4, 6.6_

- [x] 6. Final Checkpoint — 确保所有测试通过
  - 确保所有测试通过，验证心跳上报、断点续播、Progress_Indicator 均正常工作，如有问题请告知。

## Notes

- 标有 `*` 的子任务为可选测试任务，可跳过以加快 MVP 交付
- `isCompleted` 不可逆：upsert update 字段中不传 `isCompleted: false`，避免覆盖已完成状态
- 心跳失败静默处理，不中断播放体验
- StudyRecord 按课程维度（不按资源维度），所有资源共享同一进度状态
