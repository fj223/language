# Design Document

## Introduction

本文档描述 Phase 3 学习进度持久化功能的技术设计方案。基于已有的 StudyRecord 数据模型（无需改动 Schema），通过升级后端进度接口、新增查询接口、前端心跳机制和断点续播逻辑，实现完整的学习进度持久化闭环。

---

## 数据模型确认

**StudyRecord 模型无需改动**，现有字段已满足所有需求：

```prisma
model StudyRecord {
  id                  String    @id @default(cuid())
  userId              String    // Phase 3 继续使用 "anonymous"
  courseId            String
  progressPercent     Float     @default(0)   // currentTime/duration*100
  lastPositionSeconds Int       @default(0)   // 断点续播位置
  isCompleted         Boolean   @default(false)
  completedAt         DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@unique([userId, courseId])
}
```

**字段映射**：
- `lastPositionSeconds` ← 前端传入的 `currentTime`
- `progressPercent` ← `(currentTime / duration) * 100`，最大 100
- `isCompleted` ← `currentTime / duration >= 0.9` 时设为 true（不可逆）
- `completedAt` ← isCompleted 首次变为 true 时的服务器时间

---

## API 设计

### POST /api/courses/:id/progress（升级）

**Request Body**：
```json
{
  "currentTime": 120,      // 必填，非负整数，单位秒
  "duration": 600          // 可选，正数，单位秒
}
```

**Response 200**：
```json
{
  "ok": true,
  "data": {
    "recorded": true,
    "studyRecordId": "clxxx...",
    "isCompleted": false,
    "lastPositionSeconds": 120,
    "note": "anonymous mode, will be replaced in Phase 4"
  }
}
```

**完成判断逻辑**：
```
if duration > 0 && currentTime / duration >= 0.9:
  isCompleted = true
  completedAt = now()  (仅在首次完成时设置，已完成不重置)
  progressPercent = min(currentTime / duration * 100, 100)
else if duration > 0:
  progressPercent = currentTime / duration * 100
  // isCompleted 保持现有值（已完成不降级）
```

**错误响应**：
- 400：`currentTime` 缺失或非数字
- 404：课程不存在
- 500：数据库错误

---

### GET /api/courses/:id/progress（新增）

**Response 200（有记录）**：
```json
{
  "ok": true,
  "data": {
    "studyRecordId": "clxxx...",
    "lastPositionSeconds": 120,
    "isCompleted": false,
    "progressPercent": 20.0
  }
}
```

**Response 200（无记录）**：
```json
{
  "ok": true,
  "data": {
    "lastPositionSeconds": 0,
    "isCompleted": false,
    "progressPercent": 0
  }
}
```

**错误响应**：
- 404：课程不存在
- 500：数据库错误

---

## 后端实现方案

### progressController.ts 改动

```typescript
// 新增类型
type ReportProgressBody = {
  currentTime?: unknown
  duration?: unknown
}

// reportCourseProgress 核心逻辑变更
export async function reportCourseProgress(req: Request, res: Response) {
  // 1. 验证 courseId
  // 2. 验证 currentTime（必填，parseFloat，>= 0）
  // 3. 解析 duration（可选，parseFloat，> 0 才有效）
  // 4. 确保 anonymous user 存在（upsert）
  // 5. 计算 progressPercent 和 isCompleted
  // 6. upsert StudyRecord
  //    - update: { lastPositionSeconds, progressPercent, isCompleted, completedAt }
  //    - create: { userId, courseId, lastPositionSeconds, progressPercent, isCompleted, completedAt }
  // 7. 返回响应
}

// 新增函数
export async function getCourseProgress(req: Request, res: Response) {
  // 1. 验证 courseId，课程存在性检查
  // 2. findUnique StudyRecord by { userId: ANONYMOUS, courseId }
  // 3. 若无记录返回默认值，若有记录返回完整字段
}
```

**isCompleted 不可逆处理**（upsert update 字段）：
```typescript
const shouldComplete = duration > 0 && currentTime / duration >= 0.9

const updateData = {
  lastPositionSeconds: Math.round(currentTime),
  ...(duration > 0 && {
    progressPercent: Math.min((currentTime / duration) * 100, 100),
  }),
  ...(shouldComplete && {
    isCompleted: true,
    completedAt: new Date(),
  }),
}
// 注意：不传 isCompleted: false，避免覆盖已完成状态
```

### routes/api.ts 改动

```typescript
import { reportCourseProgress, getCourseProgress } from '../controllers/progressController.js'

// 新增
router.get('/courses/:id/progress', getCourseProgress)
// 保留（处理函数内部升级）
router.post('/courses/:id/progress', reportCourseProgress)
```

---

## 前端实现方案

### Progress_API（frontend/src/api/course.ts 新增）

```typescript
export type ProgressDto = {
  studyRecordId?: string
  lastPositionSeconds: number
  isCompleted: boolean
  progressPercent: number
}

export type ReportProgressResult = {
  recorded: boolean
  studyRecordId: string
  isCompleted: boolean
  lastPositionSeconds: number
  note: string
}

export async function getCourseProgress(courseId: string): Promise<ProgressDto> {
  const res = await http.get<ApiResponse<ProgressDto>>(`/api/courses/${courseId}/progress`)
  return res.data.data
}

export async function reportProgress(
  courseId: string,
  payload: { currentTime: number; duration?: number }
): Promise<ReportProgressResult> {
  const res = await http.post<ApiResponse<ReportProgressResult>>(
    `/api/courses/${courseId}/progress`,
    payload
  )
  return res.data.data
}
```

### CourseDetailView.vue 改动

#### 新增响应式状态

```typescript
const studyRecord = ref<ProgressDto>({ lastPositionSeconds: 0, isCompleted: false, progressPercent: 0 })
const heartbeatTimer = ref<ReturnType<typeof setInterval> | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
```

#### 心跳机制

```typescript
function startHeartbeat(video: HTMLVideoElement) {
  stopHeartbeat()
  heartbeatTimer.value = setInterval(async () => {
    const duration = isFinite(video.duration) && video.duration > 0 ? video.duration : undefined
    try {
      const result = await reportProgress(courseId.value, {
        currentTime: Math.round(video.currentTime),
        ...(duration !== undefined && { duration }),
      })
      // 更新本地状态
      studyRecord.value = {
        studyRecordId: result.studyRecordId,
        lastPositionSeconds: result.lastPositionSeconds,
        isCompleted: result.isCompleted,
        progressPercent: studyRecord.value.progressPercent,
      }
    } catch { /* 静默失败，不中断播放 */ }
  }, 15000)
}

function stopHeartbeat() {
  if (heartbeatTimer.value) {
    clearInterval(heartbeatTimer.value)
    heartbeatTimer.value = null
  }
}
```

#### 断点续播（local 视频）

```typescript
// video 元素绑定 ref="videoRef"
// loadedmetadata 事件处理
function onLoadedMetadata() {
  const pos = studyRecord.value.lastPositionSeconds
  if (pos > 5 && videoRef.value) {
    videoRef.value.currentTime = pos
  }
}
```

#### bilibili embed URL 计算（含断点续播）

```typescript
const bilibiliEmbedUrl = computed(() => {
  if (activeResource.value?.resource_type !== 'bilibili') return ''
  const base = extractBilibiliEmbedUrl(activeResource.value.source_url)
  if (!base) return ''
  const t = studyRecord.value.lastPositionSeconds
  return t > 0 ? `${base}&t=${t}` : base
})
```

#### 进度加载（页面初始化 + 资源切换）

```typescript
async function loadProgress() {
  try {
    studyRecord.value = await getCourseProgress(courseId.value)
  } catch {
    // 静默失败，使用默认值
  }
}

// 在 reload() 函数中调用 loadProgress()
// 在 watch(activeResourceId) 中调用 stopHeartbeat()
```

#### 生命周期清理

```typescript
onUnmounted(() => {
  stopHeartbeat()
})
```

#### 剧集目录 Progress_Indicator 模板

```html
<!-- 在剧集目录每个资源按钮内，资源标签旁 -->
<span
  v-if="studyRecord.isCompleted"
  class="material-symbols-outlined text-green-500 text-base"
  style="font-variation-settings: 'FILL' 1;"
>check_circle</span>
<span
  v-else-if="studyRecord.lastPositionSeconds > 0"
  class="material-symbols-outlined text-blue-500 text-base"
  style="font-variation-settings: 'FILL' 1;"
>radio_button_checked</span>
```

#### video 元素事件绑定

```html
<video
  ref="videoRef"
  class="w-full h-full object-contain bg-black"
  controls
  :src="activeResource.source_url"
  @play="startHeartbeat($event.target as HTMLVideoElement)"
  @pause="stopHeartbeat"
  @ended="onLocalEnded"
  @loadedmetadata="onLoadedMetadata"
/>
```

---

## 正确性属性（Property-Based Testing）

### 属性 1：完成判定不变量

**描述**：对于任意合法的 `currentTime` 和 `duration`，`isCompleted` 的计算结果必须与阈值判断一致。

```
∀ currentTime ∈ [0, ∞), duration ∈ (0, ∞):
  POST /progress({ currentTime, duration }).isCompleted
    === (currentTime / duration >= 0.9)
```

**测试方法**：生成随机的 `(currentTime, duration)` 对，验证响应中 `isCompleted` 与 `currentTime / duration >= 0.9` 的布尔值一致。

---

### 属性 2：progressPercent 范围不变量

**描述**：`progressPercent` 始终在 `[0, 100]` 范围内，且与 `currentTime/duration` 的比值一致。

```
∀ currentTime ∈ [0, ∞), duration ∈ (0, ∞):
  let p = POST /progress({ currentTime, duration }).progressPercent
  0 <= p <= 100
  p === min(currentTime / duration * 100, 100)
```

---

### 属性 3：isCompleted 不可逆性（单调性）

**描述**：一旦 `isCompleted` 变为 `true`，后续任何进度上报（即使 `currentTime` 较小）都不能将其重置为 `false`。

```
∀ sequence of POST /progress calls on same (userId, courseId):
  if any call results in isCompleted = true,
  then all subsequent calls must also return isCompleted = true
```

**测试方法**：先发送一个触发完成的请求（`currentTime/duration >= 0.9`），再发送一个不触发完成的请求（`currentTime/duration < 0.9`），验证第二次响应中 `isCompleted` 仍为 `true`。

---

### 属性 4：GET/POST 数据一致性（Round-Trip）

**描述**：POST 上报成功后，GET 查询返回的数据必须与 POST 响应中的数据一致。

```
∀ valid (courseId, currentTime, duration):
  let postResult = POST /courses/:id/progress({ currentTime, duration })
  let getResult  = GET  /courses/:id/progress
  getResult.lastPositionSeconds === postResult.lastPositionSeconds
  getResult.isCompleted         === postResult.isCompleted
```

**测试方法**：对同一课程先 POST 再 GET，比较两次响应中的关键字段。

---

### 属性 5：bilibili embed URL 的 t 参数正确性

**描述**：当 `lastPositionSeconds > 0` 时，bilibili embed URL 中的 `t` 参数值必须等于 `lastPositionSeconds`。

```
∀ lastPositionSeconds > 0:
  bilibiliEmbedUrl.includes(`&t=${lastPositionSeconds}`) === true
```

**测试方法**：mock `getCourseProgress` 返回不同的 `lastPositionSeconds` 值，验证 `bilibiliEmbedUrl` computed 属性中 `t` 参数的正确性。

---

### 属性 6：默认值不变量（无记录时）

**描述**：当课程无 StudyRecord 时，GET 接口必须返回零值默认响应，不创建新记录。

```
∀ courseId with no StudyRecord:
  GET /courses/:id/progress returns:
    { lastPositionSeconds: 0, isCompleted: false, progressPercent: 0 }
  AND no new StudyRecord is created in DB
```

---

## 文件变更清单

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `backend/src/controllers/progressController.ts` | 修改 | 升级 `reportCourseProgress`，新增 `getCourseProgress` |
| `backend/src/routes/api.ts` | 修改 | 注册 `GET /courses/:id/progress` |
| `frontend/src/api/course.ts` | 修改 | 新增 `getCourseProgress`、`reportProgress` 函数及类型 |
| `frontend/src/views/courses/CourseDetailView.vue` | 修改 | 心跳机制、断点续播、Progress_Indicator、bilibili t 参数 |
| `backend/prisma/schema.prisma` | 无变更 | Schema 已满足需求 |
