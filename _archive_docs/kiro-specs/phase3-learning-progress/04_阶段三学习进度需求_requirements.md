# Requirements Document

## Introduction

Phase 3 目标：在 Phase 2 已完成的课程播放页基础上，为在线课程平台实现学习进度持久化能力。核心功能包括：升级后端进度上报接口以接收真实播放位置、新增进度查询接口、前端心跳机制定期上报播放进度、断点续播（local 视频和 bilibili 视频）、以及剧集目录中的进度状态 UI 指示器。

本 Phase 继续沿用 `"anonymous"` 作为 userId 占位符，真实用户认证将在 Phase 4 实现。数据库 Schema（StudyRecord 模型）无需改动，已包含所有必要字段。

**技术栈**：Vue 3 + TypeScript + Vite（前端）、Express 4 + TypeScript + Prisma + MySQL（后端）

**范围边界**：
- Phase 4（用户认证系统）— Out of Scope
- 多资源独立进度追踪（StudyRecord 按课程维度，不按资源维度）— Out of Scope
- YouTube 断点续播（需额外集成 YouTube iframe API）— Out of Scope

---

## Glossary

- **Progress_Controller**: 后端进度控制器（`progressController.ts`），处理进度上报与查询
- **Course_Detail_View**: 前端课程播放页（`CourseDetailView.vue`，路由 `/courses/:id`）
- **Progress_API**: 前端进度相关 API 函数（位于 `frontend/src/api/course.ts`）
- **StudyRecord**: Prisma 模型，字段：id、userId、courseId、lastPositionSeconds、progressPercent、isCompleted、completedAt、updatedAt；唯一键为 `(userId, courseId)`
- **Anonymous_User_Id**: 无用户认证时的占位 userId，固定值为字符串 `"anonymous"`
- **Heartbeat_Timer**: 前端定时器，视频播放期间每 15 秒触发一次进度上报
- **Resume_Position**: 从 GET 进度接口获取的 `lastPositionSeconds`，用于断点续播
- **Completion_Threshold**: 完成判定阈值，`currentTime / duration >= 0.9` 时视为已完成
- **Progress_Indicator**: 剧集目录中每个资源旁的状态图标（未开始/学习中/已完成）

---

## Requirements

### Requirement 1：升级进度上报接口

**User Story:** As a 学习者, I want 播放器能实时上报当前播放位置, so that 系统能记录我的真实学习进度而不仅仅是完成状态。

#### Acceptance Criteria

1. WHEN `POST /api/courses/:id/progress` 收到包含有效 `courseId` 和 `currentTime`（非负整数，单位秒）的请求，THE Progress_Controller SHALL 以 Anonymous_User_Id 为 userId，在 StudyRecord 表中执行 upsert，将 `lastPositionSeconds` 更新为 `currentTime` 的值。
2. WHEN 请求体包含 `duration`（正数，单位秒）且 `currentTime / duration >= 0.9`，THE Progress_Controller SHALL 将 `isCompleted` 设为 `true`，`completedAt` 设为当前服务器时间。
3. WHEN 请求体包含 `duration`（正数）且 `currentTime / duration < 0.9`，THE Progress_Controller SHALL 保持 `isCompleted` 的现有值不变（已完成的记录不会被重置为未完成）。
4. WHEN 请求体包含 `duration`（正数），THE Progress_Controller SHALL 将 `progressPercent` 更新为 `(currentTime / duration) * 100`，精度保留两位小数，最大值为 100。
5. WHEN 请求体中 `duration` 缺失或为 0，THE Progress_Controller SHALL 仅更新 `lastPositionSeconds`，不修改 `progressPercent` 和 `isCompleted`。
6. WHEN upsert 操作成功，THE Progress_Controller SHALL 返回 HTTP 200，响应体为 `{ recorded: true, studyRecordId: string, isCompleted: boolean, lastPositionSeconds: number, note: string }`。
7. WHEN `currentTime` 缺失或为非数字，THE Progress_Controller SHALL 返回 HTTP 400 错误，错误信息说明 `currentTime` 为必填数字字段。
8. WHEN `:id` 对应的课程不存在，THE Progress_Controller SHALL 返回 HTTP 404 错误。
9. IF 数据库写入操作失败，THEN THE Progress_Controller SHALL 返回 HTTP 500 错误，并在服务端日志中记录错误详情。

---

### Requirement 2：新增进度查询接口

**User Story:** As a 学习者, I want 页面加载时能获取我的历史学习进度, so that 我可以从上次停止的位置继续学习。

#### Acceptance Criteria

1. WHEN `GET /api/courses/:id/progress` 收到有效的 `courseId`，THE Progress_Controller SHALL 查询 Anonymous_User_Id 对应该课程的 StudyRecord，并返回 HTTP 200。
2. WHEN 该课程存在对应的 StudyRecord，THE Progress_Controller SHALL 返回 `{ lastPositionSeconds: number, isCompleted: boolean, progressPercent: number, studyRecordId: string }`。
3. WHEN 该课程不存在对应的 StudyRecord，THE Progress_Controller SHALL 返回 `{ lastPositionSeconds: 0, isCompleted: false, progressPercent: 0 }`，不创建新记录。
4. WHEN `:id` 对应的课程不存在，THE Progress_Controller SHALL 返回 HTTP 404 错误。
5. IF 数据库查询操作失败，THEN THE Progress_Controller SHALL 返回 HTTP 500 错误，并在服务端日志中记录错误详情。

---

### Requirement 3：前端心跳机制

**User Story:** As a 学习者, I want 播放器在我观看视频时定期自动保存进度, so that 即使我中途关闭页面也不会丢失学习记录。

#### Acceptance Criteria

1. WHEN Course_Detail_View 中 local 类型视频开始播放（`play` 事件触发），THE Course_Detail_View SHALL 启动 Heartbeat_Timer，每 15 秒调用一次进度上报接口，传入当前 `video.currentTime` 和 `video.duration`。
2. WHEN local 类型视频暂停（`pause` 事件触发），THE Course_Detail_View SHALL 清除 Heartbeat_Timer。
3. WHEN local 类型视频播放结束（`ended` 事件触发），THE Course_Detail_View SHALL 清除 Heartbeat_Timer，并立即调用一次进度上报接口，传入 `video.duration` 作为 `currentTime`（标记为完成）。
4. WHEN 用户切换到其他资源（`activeResourceId` 变化），THE Course_Detail_View SHALL 清除当前 Heartbeat_Timer。
5. WHEN Course_Detail_View 组件卸载（`onUnmounted` 生命周期），THE Course_Detail_View SHALL 清除 Heartbeat_Timer。
6. WHILE Heartbeat_Timer 触发时视频的 `duration` 为 NaN 或 0，THE Course_Detail_View SHALL 仅传入 `currentTime`，不传入 `duration` 字段。

---

### Requirement 4：local 视频断点续播

**User Story:** As a 学习者, I want 打开课程页面时视频自动跳转到上次观看的位置, so that 我不需要手动拖动进度条寻找断点。

#### Acceptance Criteria

1. WHEN Course_Detail_View 加载完成且当前资源类型为 `local`，THE Course_Detail_View SHALL 调用 `GET /api/courses/:id/progress` 获取 Resume_Position。
2. WHEN Resume_Position 的 `lastPositionSeconds > 5`，THE Course_Detail_View SHALL 在 `<video>` 元素的 `loadedmetadata` 事件触发后，将 `video.currentTime` 设置为 `lastPositionSeconds`。
3. WHEN Resume_Position 的 `lastPositionSeconds <= 5`，THE Course_Detail_View SHALL 不修改 `video.currentTime`，视频从头播放。
4. WHEN 用户切换到其他资源，THE Course_Detail_View SHALL 重新调用进度查询接口，获取新资源对应的 Resume_Position（注：当前 StudyRecord 按课程维度，切换资源不会改变查询结果）。
5. IF 进度查询接口调用失败，THEN THE Course_Detail_View SHALL 忽略错误，视频从头播放，不展示错误提示。

---

### Requirement 5：bilibili 视频断点续播

**User Story:** As a 学习者, I want bilibili 嵌入视频也能从上次观看的位置继续播放, so that 我在不同视频类型下都有一致的断点续播体验。

#### Acceptance Criteria

1. WHEN Course_Detail_View 加载完成且当前资源类型为 `bilibili`，THE Course_Detail_View SHALL 调用 `GET /api/courses/:id/progress` 获取 Resume_Position。
2. WHEN Resume_Position 的 `lastPositionSeconds > 0`，THE Course_Detail_View SHALL 在构造 bilibili embed URL 时追加 `&t={lastPositionSeconds}` 参数。
3. WHEN Resume_Position 的 `lastPositionSeconds` 为 0，THE Course_Detail_View SHALL 使用不含 `&t` 参数的标准 embed URL。
4. THE Course_Detail_View SHALL 在 bilibili embed URL 中保留现有的 `&as_wide=1&high_quality=1&danmaku=1` 参数，`&t` 参数追加在这些参数之后。

---

### Requirement 6：进度 UI 指示器

**User Story:** As a 学习者, I want 在剧集目录中直观看到每个资源的学习状态, so that 我能快速了解哪些内容已完成、哪些还在进行中。

#### Acceptance Criteria

1. WHEN Course_Detail_View 加载完成，THE Course_Detail_View SHALL 调用 `GET /api/courses/:id/progress` 获取当前课程的 StudyRecord，并将结果存储为响应式状态。
2. WHILE StudyRecord 的 `isCompleted` 为 `true`，THE Course_Detail_View SHALL 在剧集目录对应资源旁显示绿色 ✓ 图标（`check_circle` Material Symbol）。
3. WHILE StudyRecord 的 `lastPositionSeconds > 0` 且 `isCompleted` 为 `false`，THE Course_Detail_View SHALL 在剧集目录对应资源旁显示蓝色进度圆点图标（`radio_button_checked` Material Symbol）。
4. WHEN StudyRecord 不存在或 `lastPositionSeconds` 为 0 且 `isCompleted` 为 `false`，THE Course_Detail_View SHALL 不在该资源旁显示任何状态图标。
5. WHEN 心跳上报或视频结束上报成功返回后，THE Course_Detail_View SHALL 用响应中的 `isCompleted` 和 `lastPositionSeconds` 更新本地 StudyRecord 状态，Progress_Indicator 随之实时更新。
6. THE Course_Detail_View SHALL 仅维护一个课程级别的 StudyRecord 状态（不区分资源），所有资源共享同一个进度状态显示。

---

### Requirement 7：Progress_API 函数

**User Story:** As a 前端开发者, I want Progress_API 提供类型安全的进度查询和上报函数, so that 视图层可以直接调用而无需手动构造 HTTP 请求。

#### Acceptance Criteria

1. THE Progress_API SHALL 导出 `getCourseProgress(courseId: string)` 函数，调用 `GET /api/courses/:id/progress`，返回 `{ lastPositionSeconds: number, isCompleted: boolean, progressPercent: number, studyRecordId?: string }`。
2. THE Progress_API SHALL 导出 `reportProgress(courseId: string, payload: { currentTime: number, duration?: number })` 函数，调用 `POST /api/courses/:id/progress`，返回 `{ recorded: boolean, studyRecordId: string, isCompleted: boolean, lastPositionSeconds: number, note: string }`。
3. THE Progress_API SHALL 为上述所有函数提供完整的 TypeScript 类型定义，输入参数类型与后端接口 Request body 对齐。

---

### Requirement 8：后端路由注册

**User Story:** As a 后端开发者, I want 新增的进度查询路由被正确注册到 Express 路由表, so that 前端可以访问该接口。

#### Acceptance Criteria

1. THE Admin_API SHALL 在 `backend/src/routes/api.ts` 中注册 `GET /api/courses/:id/progress` 路由，指向 Progress_Controller 的查询处理函数。
2. THE Admin_API SHALL 确保 `GET /api/courses/:id/progress` 路由不需要 `requireAdmin` 中间件保护（学习者可直接访问）。
3. THE Admin_API SHALL 保留现有的 `POST /api/courses/:id/progress` 路由注册，并更新其处理函数以支持新的 `currentTime` 和 `duration` 字段。
