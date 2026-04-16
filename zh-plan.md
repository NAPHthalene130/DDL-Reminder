# DDL-Reminder 项目计划

## 概述

DDL-Reminder 是一个可自托管的个人 DDL 管理 Web 应用。首页是公开只读看板，打开浏览器即可直接查看任务、剩余时间、DDL 状态和进度条。

只有任务管理区域需要认证。用户无需登录即可查看首页，但新增、编辑、完成、归档或删除任务时，需要进入受保护的管理界面并输入管理密码。

这个项目只给一个人使用，所以默认数据库从 PostgreSQL 调整为 SQLite。SQLite 更轻量，部署更简单，备份也更直接，足够支撑低并发的个人工具。

## 推荐技术栈

- 前端和全栈框架：Next.js App Router + TypeScript
- 样式：Tailwind CSS
- UI 组件：需要时使用 shadcn/ui 或 Radix UI primitives
- 数据库：SQLite
- ORM 和数据库迁移：Prisma
- 输入校验：Zod
- 测试：Vitest
- 邮件发送：Nodemailer + SMTP 配置
- 部署：Docker Compose 或直接运行 Node.js 进程
- 运行服务：
  - `app`：Next.js Web 应用
  - `worker`：提醒扫描和邮件发送服务
- 反向代理：Nginx 或 Caddy，用于 HTTPS、域名转发和可选的额外访问控制

## 数据库选择

第一版使用 SQLite。

原因：

- 这个应用是单用户、低并发场景。
- SQLite 不需要额外维护独立数据库服务。
- 备份简单，数据集中在一个文件中，例如 `data/ddl-reminder.db`。
- 在小型自托管服务器上部署更轻。
- Prisma 对 SQLite 的支持足够满足当前任务、提醒和查询需求。

取舍：

- SQLite 不适合高写入并发，也不适合未来复杂多人协作。
- 如果之后需要多用户、复杂统计或更多集成，可以迁移到 PostgreSQL。
- 当前还没有生产数据依赖，所以从已有 PostgreSQL 计划切换到 SQLite 是安全的。

## 核心功能

### 公开看板

根页面 `/` 直接打开，不需要登录。

页面需要展示：

- 进行中任务，默认按 DDL 从近到远排序。
- 任务标题。
- 可选描述。
- DDL 时间。
- 剩余时间，显示为天、小时和分钟。
- DDL 进度条。
- 任务状态标签：
  - 正常
  - 临近截止
  - 今天截止
  - 已逾期
  - 已完成，仅当展示已完成任务时使用

公开看板只读，不应该暴露新增、编辑、完成、归档或删除操作。

### 受保护管理区

管理区 `/manage` 是唯一需要认证的 UI。

用户可以：

- 输入管理密码。
- 创建任务，包含标题、DDL 时间、可选描述、可选开始时间。
- 编辑任务标题、描述、开始时间和 DDL 时间。
- 标记任务完成。
- 归档或删除任务。
- 退出管理 session。

认证规则：

- 不做注册。
- 不做用户表。
- 不做全站登录。
- 使用 `MANAGE_PASSWORD` 环境变量作为唯一管理密码。
- 使用 `SESSION_SECRET` 对管理 session 签名。
- 使用 HTTP-only cookie 保存管理 session。
- 公开读取 API 允许未认证访问。
- 所有写入 API 必须校验有效管理 session。

### DDL 进度

进度计算方式：

```text
progress = (now - startAt) / (dueAt - startAt)
```

展示出来的进度需要限制在 `0%` 到 `100%` 之间。

如果用户没有提供 `startAt`，则使用任务创建时间作为开始时间。

### 邮件提醒

邮件提醒仍然纳入第一版范围。

worker 服务需要：

- 每 5 分钟运行一次。
- 扫描未完成的进行中任务。
- 通过 SMTP 发送提醒邮件。
- 将发送成功的提醒写入 `ReminderLog`。
- 避免同一个任务、同一种提醒类型重复发送。
- 单封邮件发送失败时记录错误，但不停止整个 worker。

初始提醒类型：

- DDL 前 24 小时提醒。
- DDL 前 1 小时提醒。
- 任务逾期后提醒一次。

## 数据模型

### Task

字段：

- `id`
- `title`
- `description`
- `startAt`
- `dueAt`
- `status`
- `createdAt`
- `updatedAt`

推荐状态：

- `ACTIVE`
- `COMPLETED`
- `ARCHIVED`

对于 SQLite，推荐将状态类字段存为字符串，并在 TypeScript/Zod 层限制合法值。这样可以避免依赖不同数据库之间 enum 行为差异。

### ReminderLog

字段：

- `id`
- `taskId`
- `reminderType`
- `sentAt`

推荐提醒类型：

- `DUE_IN_24H`
- `DUE_IN_1H`
- `OVERDUE`

需要在 `taskId` 和 `reminderType` 上添加唯一约束，防止重复发送同一种提醒。

## API 设计

使用 Next.js Route Handlers。

公开接口：

- `GET /api/tasks`

管理认证接口：

- `POST /api/manage/login`
- `POST /api/manage/logout`
- `GET /api/manage/session`

受保护任务接口：

- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `POST /api/tasks/:id/complete`
- `POST /api/tasks/:id/archive`

输入校验使用 Zod。

校验规则：

- 任务标题不能为空。
- `dueAt` 必须是有效日期。
- 如果提供 `startAt`，它必须是有效日期。
- `dueAt` 必须晚于 `startAt`。
- 任务描述可选。
- 任务状态和提醒类型必须匹配允许的常量。

## UI 规划

### 页面

- `/`：公开只读 DDL 看板。
- `/manage`：受保护任务管理页。
- `/manage/login`：管理密码页，也可以作为 `/manage` 内的未登录状态。

### 公开看板

看板需要以 PC 端 Web 使用体验为主，同时通过响应式布局保证手机端也清晰可用。

推荐区域：

- 顶部栏，包含应用名称。
- 进行中任务列表。
- 可选已完成任务区域。
- 可选 `/manage` 入口，但不要过于显眼。

每个任务卡片需要展示：

- 标题。
- DDL 时间。
- 剩余时间。
- 进度条。
- 状态标签。

### 管理页

管理页需要展示：

- 添加任务入口。
- 进行中任务，以及编辑、完成、归档、删除操作。
- 可选已完成或已归档任务区域。
- 退出管理 session 操作。

### 视觉方向

- PC 端 Web 优先，同时适配手机端响应式布局。
- 任务卡片清晰，尺寸稳定。
- 进度条需要容易读取，不能只依赖颜色表达状态。
- 管理操作需要和公开看板明显区分。
- 避免过度装饰，整体应该像一个专注的个人工具。

## 部署计划

SQLite 部署不需要独立数据库容器。

推荐服务：

- `app`
  - 运行 Next.js 应用。
  - 使用 Next.js standalone 输出。
  - 读写 SQLite 文件。
- `worker`
  - 运行提醒 worker 脚本。
  - 使用同一个 SQLite 文件。
  - 使用 SMTP 环境变量。

推荐持久化路径：

```text
data/ddl-reminder.db
```

如果使用 Docker Compose，挂载持久化 volume 或宿主机目录：

```text
./data:/app/data
```

生产启动时需要运行：

```bash
prisma migrate deploy
```

推荐部署文件：

- `Dockerfile`
- `compose.yaml`
- `.env.example`
- `README.md`

反向代理：

- 使用 Nginx 或 Caddy。
- 在代理层终止 HTTPS。
- 将请求转发到 Next.js app。
- 可以给 `/manage` 额外加保护，例如 Basic Auth、IP 白名单或私有网络访问。

备份：

- 尽量在无写入或暂停写入时备份。
- 备份 `data/ddl-reminder.db`。
- 定期保留离线或异地副本。

## 环境变量

必需变量：

```env
DATABASE_URL=file:./data/ddl-reminder.db
MANAGE_PASSWORD=change-me
SESSION_SECRET=change-me-to-a-long-random-string
APP_URL=http://localhost:3000
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
MAIL_FROM=DDL Reminder <reminder@example.com>
MAIL_TO=you@example.com
TZ=Asia/Shanghai
```

## 实施步骤

1. 保留现有 Next.js + TypeScript 项目基础。
2. 将 Prisma 从 PostgreSQL 改为 SQLite。
3. 用 SQLite 初始 migration 替换当前 PostgreSQL 初始 migration。
4. 移除 PostgreSQL 专属依赖和 Prisma adapter 代码。
5. 添加 SQLite adapter 依赖，并更新 Prisma client 工厂。
6. 保留 `Task` 和 `ReminderLog` 领域模型，并调整为 SQLite 兼容的状态字段。
7. 保留并扩展共享 DDL 计算工具和测试。
8. 实现 `/` 公开只读看板。
9. 实现管理密码 session。
10. 实现受保护管理页 `/manage`。
11. 实现公开读取 API 和受保护写入 API。
12. 基于 SQLite 实现邮件提醒 worker。
13. 添加 Dockerfile 和带持久化 `data` 挂载的 Docker Compose 配置。
14. 添加本地开发、部署和 SQLite 备份说明。
15. 进行本地和 Docker 环境验证。

## 测试计划

### 逻辑测试

- 剩余时间计算。
- 进度百分比计算。
- 进度限制在 `0%` 和 `100%` 之间。
- 今天截止状态。
- 临近截止状态。
- 已逾期状态。
- 已完成任务不应被视为逾期。
- 提醒去重逻辑。

### 数据库测试

- Prisma schema 可以通过 SQLite 校验。
- 初始 SQLite migration 可以成功应用。
- 生成的 Prisma Client 可以使用 SQLite adapter。
- 提醒日志唯一约束可以防止重复提醒。

### API 测试

- `GET /api/tasks` 未认证也可访问。
- 写入 API 会拒绝未认证请求。
- 管理密码正确时登录成功。
- 管理密码错误时登录失败。
- 管理登录后可以创建合法任务。
- 标题为空时创建失败。
- 日期无效时创建失败。
- `dueAt <= startAt` 时创建失败。
- 管理登录后可以更新任务。
- 管理登录后可以标记任务完成。
- 已完成任务会被提醒 worker 忽略。

### UI 验收测试

- 用户可以不登录打开 `/`。
- 公开看板展示任务，但没有破坏性操作。
- 用户可以打开 `/manage` 并输入管理密码。
- 用户可以从 `/manage` 新增任务。
- 用户可以从 `/manage` 编辑任务。
- 用户可以从 `/manage` 标记任务完成。
- 用户可以从 `/manage` 删除或归档任务。
- 刷新页面后任务仍然持久化。
- PC 端可以舒适地浏览和管理多个任务。
- 手机端通过响应式布局清楚展示 DDL 时间、剩余时间和进度。

### 部署测试

- 应用可以使用 `DATABASE_URL=file:./data/ddl-reminder.db` 运行。
- 生产模式下 migration 可以成功运行。
- 容器重启后 SQLite 数据不丢失。
- worker 可以启动并输出扫描日志。
- SMTP 配置正确时可以成功发送提醒邮件。
- 备份并恢复 `data/ddl-reminder.db` 后任务仍然存在。

## 推荐开发顺序

建议用小的纵向切片推进项目。目标是在保留现有基础的同时，尽早切换到轻量存储模型，然后实现公开看板和受保护管理流。

### 阶段 1：项目基础

状态：已完成。

已包含：

- Next.js + TypeScript。
- Tailwind CSS。
- ESLint 和 Prettier。
- Prisma 7 基础配置。
- `.env.example`。
- 最小首页。

### 阶段 2：SQLite 数据库和领域模型

将已有 Phase 2 工作调整为 SQLite。

任务：

- 将 Prisma datasource provider 改为 SQLite。
- 将 PostgreSQL migration 替换为 SQLite migration。
- 移除 PostgreSQL adapter 和 `pg`。
- 添加 SQLite adapter。
- 保留 `Task` 和 `ReminderLog`。
- 保留共享日期和进度计算工具函数。
- 保留进度、剩余时间、计算状态和提醒去重逻辑测试。

完成标准：

- Prisma 可以通过 SQLite 校验。
- 存在 SQLite migration。
- `npm test`、`npm run lint`、`npm run format` 和 `npm run build` 通过。

### 阶段 3：公开看板和管理认证

替代旧的全站登录阶段。

任务：

- 保持 `/` 公开只读。
- 添加 `/manage` 作为受保护任务管理页。
- 使用 `MANAGE_PASSWORD` 实现管理密码登录。
- 使用 `SESSION_SECRET` 添加签名 HTTP-only cookie session。
- 添加退出管理 session。
- 只保护 `/manage` 和写入 API。

完成标准：

- `/` 无需登录即可打开。
- `/manage` 需要管理密码。
- 管理 session 可以创建和清除。
- 未认证用户不能写入任务。

### 阶段 4：任务 API

围绕公开读取和受保护写入构建任务后端。

任务：

- 实现公开 `GET /api/tasks`。
- 实现受保护 `POST /api/tasks`。
- 实现受保护 `PATCH /api/tasks/:id`。
- 实现受保护的完成、归档和删除操作。
- 使用 Zod 校验所有任务输入。
- 确保已完成和已归档任务的处理逻辑一致。

完成标准：

- 任何人都可以读取任务。
- 只有已认证管理 session 可以创建、更新、完成、归档或删除任务。
- 非法任务输入会返回清晰错误。

### 阶段 5：主看板和管理 UI

API 可用后，再构建真正的用户体验。

任务：

- 构建公开看板。
- 构建受保护管理页。
- 添加任务创建 UI。
- 添加任务编辑 UI。
- 添加任务卡片或表格行。
- 展示 DDL 时间、剩余时间、计算状态和进度条。
- 只在管理 UI 中添加完成、归档和删除操作。
- 先构建 PC 端 Web 布局，再补充手机端响应式适配。

完成标准：

- 公开看板不登录也有用。
- 管理 UI 可以完整管理任务。
- 刷新页面后数据仍然持久化。
- DDL 状态和进度展示清晰。
- 页面在 PC 端 Web 上体验舒适，在手机端也保持可用。

### 阶段 6：邮件提醒 Worker

核心应用可用后，再添加提醒系统。

任务：

- 实现 worker 脚本。
- 每 5 分钟扫描未完成的进行中任务。
- 检测 `DUE_IN_24H`、`DUE_IN_1H` 和 `OVERDUE` 提醒窗口。
- 通过 Nodemailer SMTP 发送邮件。
- 将发送成功的提醒写入 `ReminderLog`。
- 使用唯一约束防止重复发送。
- 记录失败日志，但不停止 worker。

完成标准：

- worker 可以找到需要提醒的任务。
- SMTP 配置有效时可以发送提醒邮件。
- 同一任务的同一种提醒不会发送两次。
- 已完成和已归档任务会被忽略。

### 阶段 7：Docker 和自托管部署

本地行为稳定后，再打包到目标服务器。

任务：

- 添加生产环境 `Dockerfile`。
- 添加包含 `app` 和 `worker` 的 `compose.yaml`。
- 添加持久化 `data` 挂载，用于 SQLite。
- 生产启动时运行 `prisma migrate deploy`。
- 记录 Nginx 或 Caddy 反向代理配置方式。
- 记录 SQLite 数据备份预期。

完成标准：

- app 和 worker 可以成功启动。
- 容器重启后 SQLite 数据仍然存在。
- worker 可以访问同一个数据库文件。
- 备份和恢复说明清晰。

### 阶段 8：最终加固

最后处理安全、可靠性和文档。

任务：

- 检查所有必需环境变量。
- 确保生产环境必须提供 `MANAGE_PASSWORD` 和 `SESSION_SECRET`。
- 检查 HTTPS 部署下的 cookie 安全设置。
- 添加有用的空状态和错误提示。
- 添加本地开发和服务器部署 README。
- 运行完整测试套件。
- 进行手动端到端检查。

完成标准：

- 新开发者可以按照 README 跑起项目。
- 服务器部署路径清晰。
- 应用可以优雅处理常见异常状态。
- 测试和手动检查通过。

### 推荐里程碑

里程碑 1：完成 SQLite 支撑的公开看板，任务可以通过脚本或 API 持久化。这能证明轻量存储模型成立。

里程碑 2：完成受保护 `/manage` 页面和完整任务 CRUD。这会让应用真正适合日常使用。

里程碑 3：加入邮件 worker。应用从被动追踪工具变成主动提醒系统。

里程碑 4：加入 Docker Compose 部署和 SQLite 备份文档。应用可以部署到自托管服务器。

## 未来增强

- 任务优先级。
- 标签或分类。
- 搜索和筛选。
- 重复任务。
- 日历视图。
- 浏览器通知。
- 微信、Telegram 或 webhook 提醒。
- 可选私有看板模式。
- JSON 或 CSV 导入导出。
- 已完成和已逾期任务统计。
- 如果未来需要多用户或高负载，再提供 PostgreSQL 迁移路径。

## 假设

- 第一版只面向个人使用。
- 公开看板无需登录即可查看。
- 只有任务管理 UI 和写入 API 需要认证。
- 不需要注册或多用户账号系统。
- SQLite 是默认数据库。
- 邮件提醒属于 v1 范围。
- 浏览器通知和聊天软件提醒不属于 v1 范围。
- 默认时区是 `Asia/Shanghai`。
