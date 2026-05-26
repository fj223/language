# 需求文档

## 简介

本功能将现有的 Vue 3 视频网课平台前端改造为**语言培训学校的门户与教务系统**。改造范围包含两个核心页面：

1. **课程列表页**（`CourseListView.vue`）：移除视频播放相关组件，改为展示语言课程信息（语种分类、适合级别、上课时间段、授课教师），数据来源切换为网关 API `/api/gateway/courses`。
2. **个人中心页**（`DashboardView.vue`）：新增"我的课表"（按周展示）和"成绩与出勤"两个教务模块，分别调用 `/api/gateway/timetable` 和 `/api/gateway/grades` 网关接口。

后端需同步新增三个网关路由，以静态 Mock 数据响应，为前端提供稳定的数据契约。

---

## 词汇表

- **Portal（门户）**：面向学生的公开课程展示与信息入口页面。
- **教务系统**：管理学生课表、成绩、出勤等教学事务的功能模块。
- **CourseListView**：前端课程列表视图组件，路径为 `frontend/src/views/courses/CourseListView.vue`。
- **DashboardView**：前端个人中心视图组件，路径为 `frontend/src/views/user/DashboardView.vue`。
- **Gateway_API**：后端网关路由层，挂载于 `/api/gateway/` 前缀下，为前端提供教务数据。
- **语种分类（Language_Tab）**：课程列表页顶部的语种筛选标签，取值为：英语、俄语、法语、日语。
- **课程卡片（Course_Card）**：课程列表中展示单门课程信息的 UI 单元。
- **课表（Timetable）**：按周（周一至周日）展示学生当周课程安排的模块。
- **成绩与出勤（Grade_Attendance）**：以表格形式展示学生各课程成绩和出勤率的模块。
- **studentId**：学生唯一标识符，当前阶段使用固定值 `stu_001`。
- **Mock 数据**：后端网关路由在真实数据库接入前返回的静态示例数据。

---

## 需求

### 需求 1：课程列表页 — 移除视频学习组件

**用户故事：** 作为语言培训学校的学生，我希望课程列表页不再显示视频播放、章节目录等在线学习组件，以便页面聚焦于课程报名信息而非视频内容。

#### 验收标准

1. THE CourseListView SHALL 不渲染任何视频播放器（`<Player>` 组件）或章节目录（章节列表）相关的 UI 元素。
2. THE CourseListView SHALL 移除侧边栏中原有的"Source"（视频来源）筛选项（local、YouTube、Bilibili、external_link）。
3. WHEN 用户访问课程列表页时，THE CourseListView SHALL 不展示与视频资源类型（`VideoResourceType`）相关的标签（tag）。

---

### 需求 2：课程列表页 — 语种分类 Tabs

**用户故事：** 作为语言培训学校的学生，我希望通过语种标签快速筛选课程，以便找到我感兴趣的语言课程。

#### 验收标准

1. THE CourseListView SHALL 在页面顶部展示语种分类 Tabs，选项固定为：全部、英语、俄语、法语、日语。
2. WHEN 用户点击某个语种 Tab 时，THE CourseListView SHALL 将所选语种作为筛选参数传递给 Gateway_API，并刷新课程列表。
3. WHEN 用户点击"全部"Tab 时，THE CourseListView SHALL 清除语种筛选条件，展示所有课程。
4. THE CourseListView SHALL 高亮显示当前选中的语种 Tab，与未选中 Tab 在视觉上有明显区分。
5. WHEN 语种筛选条件变更时，THE CourseListView SHALL 将分页重置为第 1 页。

---

### 需求 3：课程列表页 — 课程卡片信息重构

**用户故事：** 作为语言培训学校的学生，我希望课程卡片上直接展示课程名称、适合级别、上课时间段和授课教师，以便快速判断课程是否适合我。

#### 验收标准

1. THE Course_Card SHALL 展示以下字段：课程名称（`title`）、适合级别（`level`，如 A1、B1、B2、C1）、上课时间段（`schedule`，如"周一/周三 19:00–21:00"）、授课教师（`teacher`）。
2. IF Gateway_API 返回的课程数据中 `level` 字段为空，THEN THE Course_Card SHALL 显示占位文本"级别待定"。
3. IF Gateway_API 返回的课程数据中 `teacher` 字段为空，THEN THE Course_Card SHALL 显示占位文本"教师待定"。
4. IF Gateway_API 返回的课程数据中 `schedule` 字段为空，THEN THE Course_Card SHALL 显示占位文本"时间待定"。
5. THE Course_Card SHALL 不展示视频资源来源标签（local、YouTube、Bilibili 等）。

---

### 需求 4：课程列表页 — 切换数据源至网关 API

**用户故事：** 作为系统，我需要课程列表页从 `/api/gateway/courses` 获取数据，以便使用包含语言培训学校业务字段的课程数据。

#### 验收标准

1. WHEN CourseListView 初始化时，THE CourseListView SHALL 向 `/api/gateway/courses` 发起 GET 请求以获取课程列表。
2. WHEN 用户设置语种筛选或搜索关键词时，THE CourseListView SHALL 将 `language`（语种）和 `q`（关键词）作为查询参数附加到 `/api/gateway/courses` 请求中。
3. THE Gateway_API SHALL 在 `/api/gateway/courses` 路由返回包含 `title`、`level`、`schedule`、`teacher`、`language`、`coverUrl` 字段的课程对象数组。
4. IF `/api/gateway/courses` 请求失败，THEN THE CourseListView SHALL 展示错误提示信息，并提供"重试"按钮。
5. WHILE `/api/gateway/courses` 请求进行中，THE CourseListView SHALL 展示加载骨架屏（loading skeleton）。

---

### 需求 5：个人中心页 — 我的课表模块

**用户故事：** 作为语言培训学校的学生，我希望在个人中心看到本周的课程安排，以便合理规划学习时间。

#### 验收标准

1. THE DashboardView SHALL 在页面主内容区域展示"我的课表"模块。
2. WHEN DashboardView 初始化时，THE DashboardView SHALL 向 `/api/gateway/timetable?studentId=stu_001` 发起 GET 请求。
3. THE 课表（Timetable）模块 SHALL 按周一至周日的顺序展示每天的课程安排，每条课程记录至少包含：课程名称、上课时间、教室/地点。
4. IF 某天没有课程安排，THEN THE 课表（Timetable）模块 SHALL 显示"今日无课"占位文本。
5. IF `/api/gateway/timetable` 请求失败，THEN THE DashboardView SHALL 在课表模块内展示错误提示。
6. WHILE `/api/gateway/timetable` 请求进行中，THE DashboardView SHALL 在课表模块内展示加载状态指示器。
7. THE Gateway_API SHALL 在 `/api/gateway/timetable` 路由接受 `studentId` 查询参数，并返回按星期分组的课程安排数组，每条记录包含 `dayOfWeek`（1–7）、`courseName`、`startTime`、`endTime`、`location` 字段。

---

### 需求 6：个人中心页 — 成绩与出勤模块

**用户故事：** 作为语言培训学校的学生，我希望在个人中心查看各课程的成绩和出勤情况，以便了解自己的学习状态。

#### 验收标准

1. THE DashboardView SHALL 在页面主内容区域展示"成绩与出勤"模块。
2. WHEN DashboardView 初始化时，THE DashboardView SHALL 向 `/api/gateway/grades?studentId=stu_001` 发起 GET 请求。
3. THE Grade_Attendance 模块 SHALL 以表格形式展示数据，表格列包含：课程名称、学期、成绩、出勤率。
4. IF 某课程的成绩字段为空或未评定，THEN THE Grade_Attendance 模块 SHALL 在成绩列显示"未评定"。
5. IF `/api/gateway/grades` 请求失败，THEN THE DashboardView SHALL 在成绩与出勤模块内展示错误提示。
6. WHILE `/api/gateway/grades` 请求进行中，THE DashboardView SHALL 在成绩与出勤模块内展示加载状态指示器。
7. THE Gateway_API SHALL 在 `/api/gateway/grades` 路由接受 `studentId` 查询参数，并返回成绩记录数组，每条记录包含 `courseName`、`semester`、`grade`（可为 null）、`attendanceRate`（0–100 的数值）字段。

---

### 需求 7：后端网关路由新增

**用户故事：** 作为系统，我需要后端提供三个网关 API 路由，以便前端能够获取语言培训学校的课程、课表和成绩数据。

#### 验收标准

1. THE Gateway_API SHALL 在 Express 路由中注册 `GET /api/gateway/courses`、`GET /api/gateway/timetable`、`GET /api/gateway/grades` 三个路由端点。
2. WHEN 上述三个路由被调用时，THE Gateway_API SHALL 返回 HTTP 200 状态码及符合各自数据契约的 Mock 静态数据。
3. THE Gateway_API SHALL 对 `/api/gateway/courses` 返回至少 4 条覆盖不同语种（英语、俄语、法语、日语）的 Mock 课程记录。
4. THE Gateway_API SHALL 对 `/api/gateway/timetable` 返回覆盖至少 3 天的 Mock 课程安排记录。
5. THE Gateway_API SHALL 对 `/api/gateway/grades` 返回至少 3 条 Mock 成绩记录，其中至少 1 条 `grade` 字段为 null（模拟未评定状态）。
6. IF 请求 `/api/gateway/timetable` 或 `/api/gateway/grades` 时未提供 `studentId` 参数，THEN THE Gateway_API SHALL 仍返回 Mock 数据（当前阶段不做鉴权校验）。
7. THE Gateway_API SHALL 使用与现有路由一致的响应格式（`{ ok: true, data: [...] }`），通过 `sendOk` 工具函数返回数据。
