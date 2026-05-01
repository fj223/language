# 🎓 EDU — 在线教育学习平台

一个现代化的在线教育平台，支持课程管理、视频播放、AI 学习助手和闪卡复习功能。前后端分离架构，开箱即用。

---

## ✨ 功能特性

### 学习端
- **课程列表** — 支持关键词搜索、资源类型筛选、分页浏览
- **课程详情 & 视频播放** — 支持本地视频、YouTube、Bilibili、外链等多种资源类型
- **学习进度记录** — 自动保存播放位置，90% 进度自动标记完成
- **AI 学习助手** — 基于 OpenAI 兼容接口的流式对话，上下文感知课程内容
- **闪卡复习** — 针对视频内容创建术语卡片，辅助记忆

### 管理端
- **课程管理** — 创建、编辑、删除课程，管理封面和描述
- **资源管理** — 为课程添加多种类型的视频资源，支持拖拽排序
- **管理员鉴权** — 基于 Token 的后台访问控制

---

## 🛠 技术栈

### 前端
| 技术 | 说明 |
|------|------|
| Vue 3 + TypeScript | 核心框架，Composition API |
| Vite | 构建工具 |
| Pinia | 状态管理 |
| Vue Router | 路由管理 |
| Element Plus | UI 组件库 |
| Tailwind CSS v4 | 原子化样式 |
| Axios | HTTP 请求 |
| Marked + DOMPurify | Markdown 渲染与安全过滤 |

### 后端
| 技术 | 说明 |
|------|------|
| Node.js + Express 5 | Web 服务框架 |
| TypeScript + tsx | 类型安全开发 |
| Prisma ORM | 数据库访问层 |
| MySQL | 关系型数据库 |
| Helmet + CORS | 安全中间件 |
| express-rate-limit | 接口限流 |

---

## 📁 项目结构

```
├── frontend/          # Vue 3 前端应用
│   ├── src/
│   │   ├── api/       # API 请求封装
│   │   ├── components/# 公共组件（播放器、AI聊天等）
│   │   ├── views/     # 页面视图
│   │   ├── stores/    # Pinia 状态
│   │   ├── router/    # 路由配置
│   │   └── domain/    # 领域模型
│   └── package.json
│
├── backend/           # Express 后端服务
│   ├── src/
│   │   ├── routes/    # API 路由
│   │   ├── middleware/# 中间件（鉴权、限流、错误处理）
│   │   ├── lib/       # 工具函数
│   │   ├── db/        # Prisma 客户端
│   │   └── config/    # 环境配置
│   ├── prisma/
│   │   └── schema.prisma  # 数据库模型
│   └── package.json
```

---

## 🚀 快速开始

### 环境要求
- Node.js >= 18
- MySQL >= 8.0

### 1. 克隆项目

```bash
git clone https://github.com/fj223/EDU.git
cd EDU
```

### 2. 配置后端环境变量

```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件：

```env
DATABASE_URL="mysql://用户名:密码@localhost:3306/edu_db"
ADMIN_TOKEN="your-admin-token"
CORS_ORIGIN="http://localhost:5173"

# AI 助手配置（可选）
AI_API_KEY="your-openai-api-key"
AI_BASE_URL="https://api.openai.com"
AI_MODEL="gpt-4o-mini"
```

### 3. 初始化数据库

```bash
cd backend
npm install
npm run prisma:migrate
```

### 4. 启动后端

```bash
npm run dev
# 服务运行在 http://localhost:3000
```

### 5. 配置并启动前端

```bash
cd ../frontend
npm install
```

创建 `.env.local` 文件：

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_ADMIN_TOKEN=your-admin-token
```

```bash
npm run dev
# 应用运行在 http://localhost:5173
```

---

## 📡 API 接口概览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/courses` | 获取课程列表（支持搜索、筛选、分页） |
| POST | `/api/courses` | 创建课程（需管理员权限） |
| GET | `/api/courses/:id` | 获取课程详情 |
| PUT | `/api/courses/:id` | 更新课程（需管理员权限） |
| DELETE | `/api/courses/:id` | 删除课程（需管理员权限） |
| POST | `/api/courses/:id/progress` | 上报学习进度 |
| GET | `/api/courses/:id/progress` | 获取学习进度 |
| GET | `/api/flashcards` | 获取闪卡列表 |
| POST | `/api/flashcards` | 创建闪卡 |
| DELETE | `/api/flashcards/:id` | 删除闪卡 |
| POST | `/api/chat` | AI 对话（SSE 流式响应） |
| GET | `/api/health` | 健康检查 |

---

## 🗄 数据库模型

```
Course          — 课程（标题、封面、描述）
VideoResource   — 视频资源（类型：local/youtube/bilibili/external_link）
Flashcard       — 闪卡（术语、定义、示例）
StudyRecord     — 学习记录（进度、完成状态）
```

---

## 📦 构建部署

### 前端构建

```bash
cd frontend
npm run build
# 产物在 dist/ 目录
```

### 后端构建

```bash
cd backend
npm run build
npm start
```

---

## 📄 License

MIT
