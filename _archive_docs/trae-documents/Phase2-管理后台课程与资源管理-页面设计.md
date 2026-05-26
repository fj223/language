# Phase 2 页面设计（桌面优先）

## Global Styles（全局）
- 设计基调：后台管理台（浅色为主），信息密度较高。
- 颜色（建议沿用现有管理台页面用色）：
  - Background: #f8f9fa
  - Surface: #ffffff / #f1f4f6 / #dbe4e7（分层容器）
  - Primary: #335ea1（主按钮、强调）
  - Text: #2b3437（主文本），#586064（次文本）
  - Error: 红色系（用于删除与错误提示）
- 字体与层级：
  - H1 20–24px（页面标题），H2 16–18px（区块标题），Body 14px（表格/表单），Meta 12px（说明/提示）。
- 交互状态：
  - 按钮 hover：背景加深/轻微阴影；active：scale(0.98)；disabled：opacity 0.6。
  - 表格行 hover：浅底色高亮。
- 响应式（桌面优先）：
  - ≥1280px：左侧固定侧边栏 256px；主内容左边距 256px。
  - 768–1279px：侧边栏可折叠为 icon 栏；筛选项可换行。
  - <768px：不作为本期重点，但应确保表格可横向滚动。

---

## 页面 1：管理后台（课程列表）

### Layout
- Hybrid：左侧固定 SideNav（position: fixed）+ 顶部 TopBar（sticky）+ 主内容区（margin-left 对齐侧边栏宽度）。
- 主内容采用 Flex + 表格（table）组合；筛选条为 flex-wrap 以适配不同宽度。

### Meta Information
- title: 管理后台 - 课程管理
- description: 管理员维护课程与资源的列表入口
- og:title/og:description：与 title/description 同步

### Page Structure
1. SideNav（固定）
2. TopBar（含全局搜索占位，可复用但本期以课程搜索为准）
3. Page Header（标题 + 新建课程按钮）
4. 搜索/筛选区（Search & Filter Bar）
5. 列表表格（Course Table）
6. 分页器（Pagination Footer）

### Sections & Components
- 搜索框（关键字 q）
  - 输入框 + 清空按钮；回车触发；loading 时显示 spinner。
- 筛选（resource_type）
  - 下拉选择：All/local/youtube/bilibili/external_link。
- 表格列（建议最小可用集）：
  - 课程ID（短显示，可复制）
  - 封面缩略图
  - 标题 + 描述摘要
  - 资源数
  - 更新时间
  - 操作：预览 / 编辑 / 删除
- 分页器：
  - 左侧显示“共 X 条”；右侧页码按钮（上一页/下一页/页码）+ pageSize 选择。
  - 页码变化与 pageSize 变化会触发重新请求列表。
- 空/错/加载态：
  - 空：显示“暂无课程”+ 引导创建。
  - 错：展示错误文本（来自后端 error），提供“重试”。

---

## 页面 2：课程编辑页

### Layout
- 2 列布局（desktop）：
  - 左列（主列，约 60–70%）：课程基本信息表单。
  - 右列（辅列，约 30–40%）：资源列表与排序操作。
- 页面顶部保留面包屑/返回按钮，便于回到课程列表。

### Meta Information
- title: 管理后台 - 编辑课程
- description: 编辑课程信息与资源列表
- og:title/og:description：与 title/description 同步

### Page Structure
1. 顶部：返回“课程列表” + 当前课程标题（只读显示）
2. 课程信息卡片（Course Form Card）
3. 资源管理卡片（Resource Manager Card）
4. 底部操作条（保存 / 取消）

### Sections & Components
- Course Form Card
  - 字段：标题（必填）、封面 URL（可选）、描述（可选）。
  - 校验：标题为空禁止保存；URL 字段允许空。
- Resource Manager Card
  - 资源列表（按 sortOrder 升序）
    - 每行：拖拽把手（或上移/下移按钮）、资源标题、资源类型 Tag、source_url 摘要、编辑/删除。
  - 新增资源
    - “新增资源”按钮打开弹窗/抽屉表单：resource_type、source_url、title。
  - 编辑资源
    - 与新增共用表单，提交 PUT。
  - 删除资源
    - 二次确认；删除后列表即时更新。
  - 排序
    - 拖拽后立即在前端更新顺序并标记“未保存”；点击保存时调用排序接口。
- 底部操作条
  - 保存：聚合提交（课程信息 PUT + 资源变更（POST/PUT/DELETE）+ 排序 PUT），或按你的实现拆分提交；保存中禁用所有按钮。
  - 取消：放弃本地更改并返回课程列表。

### Interaction Notes
- 若进入页面时接口返回 404：展示“课程不存在”，提供返回列表。
- 若 401：提示管理员令牌无效，并引导重新配置后重试。
