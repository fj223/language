# OpenEdu 教育机构智能服务平台

OpenEdu 是一个用于硕士论文设计与实验验证的教育机构网络平台。系统围绕多源教育数据集成、智能教务问答和完整业务流程展开，覆盖公开课程、学生服务、报名审核、政策维护、权限管理和操作审计。

> 当前默认使用本地演示数据，生成式 AI 默认关闭。即使不配置 AI 密钥，课表、成绩、课程、学习计划和政策问答仍可通过意图识别、结构化数据查询与政策知识检索正常工作。

## 研究定位

本项目主要验证以下三项设计：

1. 使用统一适配层接入本地课程和机构教务数据，并提供字段校验、来源标识、缓存与失败处理。
2. 使用“意图识别 + 结构化数据 + 政策知识 + 对话上下文”实现可追溯的混合式智能问答。
3. 使用 RBAC、状态流转和审计日志支撑教育机构的课程、政策、报名和管理员业务闭环。

项目不是面向生产上线的商业系统，不包含在线支付、直播、短信、社区和高并发集群。

## 已实现功能

### 访客

- 浏览、搜索和筛选已发布课程。
- 查看课程详情和课程资源。
- 使用智能教务助手查询公开课程、政策和学习建议。
- 注册或登录学生账号。

### 学生

- JWT 登录和会话失效处理。
- 查看个人课表、成绩和出勤情况。
- 收藏课程、创建学习提醒并标记完成。
- 提交、取消和重新提交课程报名。
- 查看报名状态和管理员审核意见。
- 保存与复习闪卡。
- 对智能助手回答进行反馈。

### 管理员

- 管理课程、发布状态和课程资源。
- 审核报名申请并填写审核意见。
- 可视化编辑、发布和停用政策知识。
- 查看问答反馈统计。
- 管理管理员账号、角色、启用状态和密码。
- 查看关键管理操作的审计日志。

管理员角色：

| 角色 | 主要权限 |
|---|---|
| `SUPER_ADMIN` | 全部权限、管理员账号和审计日志 |
| `CONTENT_MANAGER` | 课程维护、报名审核、反馈查看 |
| `POLICY_EDITOR` | 政策维护，课程和反馈只读 |
| `ANALYST` | 课程、政策、报名和反馈只读 |

系统禁止停用或降级最后一个有效超级管理员，也禁止管理员停用自身账号。

## 智能助手

当前支持七类意图：

| 意图 | 能力 | 登录要求 |
|---|---|---:|
| `TIMETABLE` | 查询并解释个人课表 | 是 |
| `GRADES` | 查询成绩和出勤 | 是 |
| `COURSE_DISCOVERY` | 查询和推荐课程 | 否 |
| `STUDY_PLAN` | 生成学习计划建议 | 否 |
| `SCHOOL_POLICY` | 查询已发布政策 | 否 |
| `TRANSLATE` | 翻译与语言学习辅助 | 否 |
| `GENERAL` | 功能导航和受控通用回答 | 否 |

每次回答可返回意图、来源、建议追问、课程卡片、是否使用生成式 AI 和唯一回答编号。最近六轮对话用于理解“这个课程”“再详细一点”等连续追问。

AI 未启用时，可信数据类问题使用确定性回答；系统不会编造成绩、时间、教师或政策。配置有效的 OpenAI 兼容服务后，生成式 AI 仅用于改善表达和开放式语言任务。

## 数据集成

`educationDataService` 是门户和智能助手共用的数据入口：

- `mock`：论文演示数据，页面和响应明确标识来源。
- `external`：连接机构 API，并校验课程、课表和成绩字段。
- 本地数据库中已发布课程与机构课程合并进入公开课程目录。
- 草稿课程不进入公开目录。
- 机构公开课程缓存 5 分钟；个人课表和成绩不缓存。
- 外部接口失败时返回明确错误，不伪装成真实数据或静默切换演示数据。

详细契约见 [INTEGRATION_API_CONTRACT.md](./INTEGRATION_API_CONTRACT.md)。

## 技术架构

- 前端：Vue 3、TypeScript、Vue Router、Pinia、vue-i18n、Tailwind CSS、Element Plus。
- 后端：Node.js、Express 5、TypeScript、Prisma。
- 数据库：MySQL 8.4。
- 运行方式：Docker Compose；前后端分离。
- 安全基础：学生与管理员独立 JWT、RBAC、速率限制、Helmet、请求编号、统一错误响应。

```text
Browser
  ├─ Vue student portal
  └─ Vue admin portal
        │ HTTP/JSON
Express API
  ├─ Authentication and RBAC
  ├─ Course / enrollment / policy services
  ├─ Hybrid assistant
  └─ Education data adapter
        ├─ MySQL / Prisma
        ├─ Mock institutional data
        └─ External institutional API (optional)
```

## 快速启动

### 环境要求

- Docker Desktop
- Docker Compose

在项目根目录执行：

```bash
docker compose up --build -d
```

服务地址：

- 前端：`http://localhost`
- 后端：`http://localhost:3100`
- MySQL：`localhost:3406`
- 健康检查：`http://localhost:3100/api/health`
- 就绪检查：`http://localhost:3100/api/ready`

本地论文演示的初始超级管理员由环境变量创建。默认占位账号为：

```text
admin@openedu.local
change-me-admin-password
```

该密码仅用于本地演示。若项目被放入共享网络，必须在启动前修改。

### 关键环境变量

```env
DATABASE_URL=mysql://root:root@mysql:3306/jiaoyu
JWT_SECRET=replace-with-a-strong-secret
ADMIN_JWT_SECRET=replace-with-another-strong-secret

EDU_DATA_PROVIDER=mock
EDU_API_BASE_URL=
EDU_API_KEY=
EDU_API_TIMEOUT_MS=8000
EDU_API_RETRY_COUNT=1

AI_ENABLED=false
OPENAI_API_KEY=
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=
```

不使用生成式 AI 时保持 `AI_ENABLED=false`。

## 构建与验证

```bash
cd backend
npm run build
npm run test:chatbot
npm run verify
npm run evidence:generate

cd ../frontend
npm run build
```

`verify` 一次运行权限与状态规则、意图契约、外部 API 容错契约和 210 条问答回归评测。`test:e2e` 需要 Docker 服务正常，用于验证数据库中的完整学生—管理员业务闭环。

`evidence:generate` 会重新执行论文相关自动化验证，并在
`backend/evaluation/thesis-evidence/latest/` 生成逐样例数据、模型对比、
语言分组、混淆矩阵、业务验证、答辩图表、HTML 报告和文件哈希清单。

```bash
cd backend
npm run evaluate:chatbot
```

回归数据已经参与工程优化，不能冒充论文最终独立测试结果。正式论文仍需冻结代码后，由未参与开发的人员建立人工标注留出集。详细要求见 [backend/evaluation/README.md](./backend/evaluation/README.md)。

## 主要接口

### 公共与学生接口

- `POST /api/register`
- `POST /api/login`
- `GET /api/me`
- `GET /api/gateway/courses`
- `GET /api/gateway/courses/:id`
- `GET /api/gateway/timetable`
- `GET /api/gateway/grades`
- `POST /api/chatbot`
- `POST /api/chatbot/feedback`
- `GET|POST|DELETE /api/favorites`
- `GET|POST|PATCH|DELETE /api/reminders`
- `GET|POST|PATCH /api/enrollments`

### 管理接口

- `POST /api/admin/login`
- `GET /api/admin/me`
- `GET|POST|PATCH /api/admin/users`
- `GET|PATCH /api/admin/enrollments`
- `GET|POST|PUT|DELETE /api/admin/policies`
- `GET /api/admin/audit-logs`
- `GET|POST|PUT|DELETE /api/courses`
- `POST /api/courses/import-demo/:id`

后台课程目录与学生课程目录使用同一聚合数据源。本地课程标记为可编辑；
演示课程和机构 API 课程标记为只读来源。演示课程可复制为本地版本，
同一课程 ID 始终只向学生展示一条记录，并以本地管理版本优先。

个人课表、成绩、收藏、提醒和报名只从学生 JWT 确认身份，不接受客户端伪造学生编号。

## 文档

- [系统架构与论文设计说明](./System_Architecture_PRD.md)
- [教务 API 集成契约](./INTEGRATION_API_CONTRACT.md)
- [智能助手能力设计](./AI_ASSISTANT_DESIGN.md)
- [产品优化记录](./PRODUCT_OPTIMIZATION_PLAN.md)
- [硕士论文实验实施方案](./THESIS_EXPERIMENT_PLAN.md)
- [答辩演示脚本](./DEFENSE_DEMO_SCRIPT.md)

## 已知限制

- 当前机构数据源默认是演示数据，尚未对接真实学校系统。
- 生成式 AI 默认关闭，当前核心问答为可解释的混合式规则与检索方案。
- 进度按钮包含明确标识的论文演示操作，不代表真实视频播放器自动采集。
- 现有测试重点覆盖核心意图和人工业务流程，仍需补充独立评测集与自动化端到端测试。
- 本项目仅用于硕士论文项目支持，不作为生产环境安全与容量承诺。
