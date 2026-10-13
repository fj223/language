# OpenEdu 教务 API 集成契约

## 本阶段取舍

平台只建立一条教务数据链路，供学生门户和智能聊天机器人共同使用。

- 保留：机构课程、学生课表、成绩与出勤率。
- 新增：统一适配层、数据源状态、响应来源标识、超时与数据格式校验。
- 停用：`/api/legacy/*` 旧接口，统一返回 `410 Gone`。
- 暂缓：缴费、排课写入、成绩修改、直播、社区和原生 App。
- 已融合：本地 Prisma 中已发布的 `Course` 与机构 API 的课程共同进入公开目录；本地课程通过 `managedLocally: true` 标识，草稿不参与融合。

## 运行模式

通过环境变量选择数据源：

```env
EDU_DATA_PROVIDER=mock
EDU_API_BASE_URL=
EDU_API_KEY=
EDU_API_TIMEOUT_MS=8000
EDU_API_RETRY_COUNT=1
```

- `mock`：明确的演示模式，前端显示“演示数据”。
- `external`：连接机构 API，必须配置 `EDU_API_BASE_URL`。
- 外部 API 对超时、`408`、`429` 和 `5xx` 进行有限重试，默认重试 1 次，最多可配置 3 次。
- `401/403` 等不可恢复错误不会重试。
- 外部 API 出错时不会自动改用演示数据；公开课程可在最近一次真实缓存不超过 30 分钟时标记为降级并使用该缓存。
- 公开课程缓存 5 分钟；个人课表和成绩不缓存。
- 本地已发布课程在每次查询时从数据库读取，并与当前机构课程源合并后再进行搜索和语言筛选。

## 机构 API 需要提供的接口

认证方式默认为：

```http
Authorization: Bearer <EDU_API_KEY>
Accept: application/json
```

如机构使用 OAuth2、签名或双向证书，应在适配层中新增认证策略，不修改门户和聊天机器人。

### 课程

```http
GET {EDU_API_BASE_URL}/courses
```

响应可以直接是数组，也可以是 `{ "data": [...] }`：

```json
[
  {
    "id": "course-001",
    "title": "商务英语 B2",
    "level": "B2",
    "schedule": "周二/周四 19:00–21:00",
    "teacher": "李老师",
    "language": "英语",
    "coverUrl": "https://example.edu/covers/course-001.jpg"
  }
]
```

`level`、`schedule`、`teacher`、`coverUrl` 可以为 `null`，其他字段必填。

本地课程还可以携带：

```json
{
  "managedLocally": true,
  "description": "课程说明",
  "resources": [
    {
      "id": "resource-001",
      "resourceType": "external_link",
      "sourceUrl": "https://example.edu/resource",
      "title": "课程资料"
    }
  ]
}
```

机构课程与本地课程使用各自稳定的 `id`。当前实现按记录合并，不自动覆盖同名课程，以避免未经确认的数据丢失。

### 学生课表

```http
GET {EDU_API_BASE_URL}/students/{studentId}/timetable
```

```json
[
  {
    "dayOfWeek": 1,
    "courseName": "英语口语 B2",
    "startTime": "19:00",
    "endTime": "21:00",
    "location": "3号楼 301教室"
  }
]
```

`dayOfWeek` 必须是 1 到 7 的整数。

### 学生成绩

```http
GET {EDU_API_BASE_URL}/students/{studentId}/grades
```

```json
[
  {
    "courseName": "英语口语 B2",
    "semester": "2026春",
    "grade": 88,
    "attendanceRate": 95
  }
]
```

`grade` 可以为 `null`；成绩和出勤率必须在 0 到 100 之间。

## OpenEdu 对前端保持的接口

- `GET /api/gateway/courses`：公开，可用 `language`、`q` 筛选。
- `GET /api/gateway/status`：需要学生登录。
- `GET /api/gateway/timetable`：需要学生登录，身份只取 JWT，不信任查询参数。
- `GET /api/gateway/grades`：需要学生登录，身份只取 JWT，不信任查询参数。

数据响应带有：

```http
x-data-source: mock|external
x-data-fetched-at: 2026-07-24T00:00:00.000Z
x-data-degraded: true|false
```

状态接口只公开模式、是否配置、课程缓存状态、请求/重试/成功/失败次数、最近失败和延迟，不泄露机构地址或密钥。学生可以通过 `/api/gateway/status` 查看来源状态；有课程查看权限的管理员可以通过 `/api/admin/integration/status` 查看诊断统计。

## 下一步功能优先级

### 应继续做

1. 扩展自动化契约测试，继续覆盖超时、畸形数据、空数据和过期缓存。
2. 增加人工触发的连接测试，但限制频率，避免诊断页面对机构接口形成压力。
3. 评估按机构课程唯一标识进行去重，而不是按照不稳定的课程名称去重。

### 需要验证后再做

- Webhook 或增量同步：论文演示阶段只需要证明设计可行，不要求接入真实事件源。
- SSO/OIDC：真实部署时有价值，但本项目暂不扩展身份提供方。
- 作业提交、教师点评和请假流程：需要先确定机构原系统是否已经承担这些职责。

### 当前不建议做

- 直接在聊天机器人中修改成绩、排课或缴费：风险高，需要审批、幂等和完整审计。
- 另建社区论坛：会引入内容治理和持续运营负担。
- 同时维护多个聊天机器人入口：先把一个入口的准确率、引用来源和权限边界做好。
