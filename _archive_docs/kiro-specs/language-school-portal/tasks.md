# 实现计划：语言培训学校门户与教务系统

## 概览

将现有 Vue 3 视频网课平台改造为语言培训学校门户与教务系统。改造分为三个层次：后端网关路由（Mock 数据）、前端 API 层（类型定义与请求函数）、前端视图层（CourseListView 与 DashboardView 重写）。

## 任务

- [x] 1. 后端：重写 gateway-api.ts，新增三个 Mock 路由
  - 移除所有 `fetchLegacy` 调用和 Legacy 接口类型定义
  - 定义 `GatewayCourse`、`TimetableEntry`、`GradeEntry` 接口类型
  - 实现 `GET /api/gateway/courses`（10 条 Mock 数据，支持 `language` 和 `q` 内存过滤）
  - 实现 `GET /api/gateway/timetable`（6 条 Mock 数据，覆盖 5 天）
  - 实现 `GET /api/gateway/grades`（4 条 Mock 数据，含 1 条 `grade: null`）
  - 所有路由使用 `sendOk` 返回 `{ ok: true, data: [...] }` 格式
  - _需求：7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x]* 1.1 为 courses 端点编写属性测试（Property 7）
    - **Property 7：API 响应结构完整性**
    - 对任意对 `/api/gateway/courses` 的调用，响应中每个课程对象都应包含 `id`、`title`、`level`、`schedule`、`teacher`、`language`、`coverUrl` 字段
    - 使用 supertest 调用真实 Mock 端点，fast-check 验证每条记录字段完整性
    - **验证：需求 4.3, 7.7**

  - [ ]* 1.2 为 timetable/grades 端点编写属性测试（Property 10）
    - **Property 10：timetable/grades API 响应结构完整性**
    - 对任意对 `/api/gateway/timetable` 和 `/api/gateway/grades` 的调用，响应格式应为 `{ ok: true, data: [...] }`，且 `data` 数组中每条记录包含各自数据契约要求的所有字段
    - timetable 每条记录需含 `dayOfWeek`、`courseName`、`startTime`、`endTime`、`location`
    - grades 每条记录需含 `courseName`、`semester`、`grade`（可为 null）、`attendanceRate`
    - **验证：需求 5.7, 6.7, 7.7**

- [x] 2. 前端 API 层：新建 frontend/src/api/gateway.ts
  - 定义 `GatewayCourse`、`CourseQuery`、`TimetableEntry`、`GradeEntry` 类型
  - 实现 `getGatewayCourses(query)`：GET `/api/gateway/courses`，支持 `language` 和 `q` 参数
  - 实现 `getTimetable(studentId)`：GET `/api/gateway/timetable`
  - 实现 `getGrades(studentId)`：GET `/api/gateway/grades`
  - 所有函数通过 `http.get<ApiOk<T>>` 发起请求，返回 `res.data.data`，错误由调用方处理
  - _需求：4.1, 4.2, 5.2, 6.2_

  - [ ]* 2.1 为 API 查询参数透传编写属性测试（Property 6）
    - **Property 6：API 查询参数透传**
    - 对任意 `language` 和 `q` 参数的组合，`getGatewayCourses(query)` 发起的 HTTP 请求 URL 中应包含对应的查询参数（空值不传递）
    - 使用 fast-check 生成 `fc.record({language: fc.option(fc.string()), q: fc.option(fc.string())})`，mock axios 验证请求参数
    - **验证：需求 4.2**

- [x] 3. 前端视图：完整重写 CourseListView.vue
  - 移除 `<Player>` 组件、Source 筛选侧边栏、`VideoResourceType` 标签及相关 import
  - 新增语种分类 Tabs（全部/英语/俄语/法语/日语），切换时重置分页至第 1 页
  - 课程卡片展示 `title`、`level`、`schedule`、`teacher`，null 时显示对应占位文本
  - 数据源切换至 `getGatewayCourses`，支持 `language` 和 `q` 查询参数
  - 实现加载骨架屏、错误状态（含重试按钮）、空状态（含清空筛选按钮）、前端分页
  - _需求：1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.4, 4.5_

  - [ ]* 3.1 为语种筛选参数传递编写属性测试（Property 1）
    - **Property 1：语种筛选参数传递**
    - 对任意语种值（英语、俄语、法语、日语），点击对应 Tab 时，`getGatewayCourses` 的调用参数中 `language` 字段应等于该语种值
    - 使用 `fc.constantFrom("英语","俄语","法语","日语")` 生成语种，@vue/test-utils 模拟点击，验证 API 调用参数
    - **验证：需求 2.2**

  - [ ]* 3.2 为 Tab 高亮互斥编写属性测试（Property 2）
    - **Property 2：Tab 高亮状态互斥**
    - 对任意选中的语种 Tab，该 Tab 应具有高亮 CSS 类，且其余所有 Tab 均不具有高亮 CSS 类
    - 使用 `fc.constantFrom("","英语","俄语","法语","日语")` 生成选中值，验证 DOM 中高亮类的互斥性
    - **验证：需求 2.4**

  - [ ]* 3.3 为语种切换重置分页编写属性测试（Property 3）
    - **Property 3：语种切换重置分页**
    - 对任意初始页码（大于 1）和任意语种切换操作，切换后 `page` 的值应为 1
    - 使用 `fc.integer({min:2,max:100})` 生成初始页码，`fc.constantFrom(...)` 生成语种，验证切换后 `page === 1`
    - **验证：需求 2.5**

  - [ ]* 3.4 为课程卡片字段渲染完整性编写属性测试（Property 4+5）
    - **Property 4+5：课程卡片字段渲染完整性**
    - 对任意课程数据（各字段可为 null 或有值），渲染后的课程卡片中：`title` 始终显示实际值；`level`/`schedule`/`teacher` 有值时显示实际值，null 时分别显示"级别待定"/"时间待定"/"教师待定"
    - 使用 `fc.record({title:fc.string({minLength:1}), level:fc.option(fc.string()), schedule:fc.option(fc.string()), teacher:fc.option(fc.string()), language:fc.constantFrom("英语","俄语","法语","日语"), coverUrl:fc.constant(null), id:fc.string()})` 生成数据
    - **验证：需求 3.1, 3.2, 3.3, 3.4**

- [x] 4. 前端视图：完整重写 DashboardView.vue
  - 新增"我的课表"模块：`onMounted` 调用 `getTimetable("stu_001")`，`weekDays` 计算属性按 dayOfWeek 1→7 分组并按 startTime 升序排列，无课时显示"今日无课"
  - 新增"成绩与出勤"模块：`onMounted` 调用 `getGrades("stu_001")`，el-table 展示，`grade: null` 显示"未评定"，出勤率进度条
  - 两个模块并行请求（`Promise.all` 或独立调用），错误状态相互独立，各自提供重试按钮
  - _需求：5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 4.1 为课表排序渲染编写属性测试（Property 8）
    - **Property 8：课表按 dayOfWeek 排序渲染**
    - 对任意顺序的课表数据，`weekDays` 计算属性应始终按 dayOfWeek 1→7 的顺序生成 7 个分组，每组内的课程按 startTime 升序排列
    - 使用 `fc.array(fc.record({dayOfWeek:fc.integer({min:1,max:7}), startTime:fc.string(), endTime:fc.string(), courseName:fc.string(), location:fc.string()}))` 生成乱序数据，验证分组顺序和组内排序
    - **验证：需求 5.3**

  - [ ]* 4.2 为成绩 null 值显示"未评定"编写属性测试（Property 9）
    - **Property 9：成绩 null 值显示"未评定"**
    - 对任意包含 `grade: null` 的成绩记录数组，渲染后的表格中所有 `grade` 为 null 的行在成绩列均应显示"未评定"，而非空白或 "null"
    - 使用 `fc.array(fc.record({courseName:fc.string(), semester:fc.string(), grade:fc.option(fc.integer({min:0,max:100})), attendanceRate:fc.integer({min:0,max:100})}))` 生成数据，验证 DOM 渲染结果
    - **验证：需求 6.4**

- [ ] 5. 检查点 — 确保所有测试通过
  - 确保所有测试通过，如有问题请向用户反馈。

## 备注

- 标有 `*` 的子任务为可选项，可跳过以加快 MVP 交付
- 每个任务均引用具体需求条款，便于追溯
- 属性测试使用 **fast-check** 库，每个属性至少运行 **100 次迭代**
- 前端测试框架：Vitest + @vue/test-utils + fast-check
- 后端 API 测试框架：Vitest + supertest
- 任务 1–4 对应的实现文件均已写入磁盘，标记为 `[x]`
