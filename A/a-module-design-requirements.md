# 模块 A 功能与 UI 设计要求整理

日期：2026-06-01

## 1. 文档来源

本次整理查看了项目内所有主要文档与设计原型，包括：

- `AGENTS.md`
- `README.md`
- `INIT.md`
- `DEMO_GUIDE.md`
- `WEEK1_DELIVERY.md`
- `TROUBLESHOOTING.md`
- `WSL2_SETUP.md`
- `design/plan.md`
- `design/target.md`
- `design/Mercury_产品边界与架构说明.md`
- `design/research-similar-projects.md`
- `design/html-prototypes/README.md`
- `design/html-prototypes/NAVIGATION.md`
- `design/html-prototypes/PLAN-COVERAGE.md`
- `design/html-prototypes/OPTIMIZATION-SUMMARY.md`
- `design/html-prototypes/main-interface-complete.html`
- `design/html-prototypes/add-subscription-dialog.html`
- `design/html-prototypes/edit-subscription-dialog.html`
- `design/html-prototypes/opml-import-dialog.html`
- `design/html-prototypes/loading-error-states.html`
- `design/html-prototypes/empty-states.html`

## 2. 模块 A 定位

模块 A 是“订阅与数据系统”，负责 Mercury 主链路的前半段：

```text
订阅源导入
  → Feed 刷新
  → 文章入库
  → 正文抓取
```

它为后续模块提供文章元数据和原始 HTML，是模块 B/C/D 的基础数据来源。

## 3. 功能设计要求

### 3.1 RSS / Atom Feed 解析

- 支持通过 URL 添加 RSS/Atom 订阅源。
- 使用 `rss-parser` 解析 Feed URL。
- 解析内容至少包括：
  - Feed 标题
  - Feed 链接
  - Feed 描述
  - 文章标题
  - 文章链接
  - 作者
  - 发布时间
  - 摘要或内容片段
  - GUID 或等价唯一标识

### 3.2 Feed 订阅管理

- 支持添加订阅源。
- 支持删除订阅源。
- 支持编辑订阅源标题。
- 订阅源 URL 应保持唯一。
- Feed Sidebar 需要展示：
  - 订阅源标题
  - 订阅源 URL
  - 未读数量
  - 当前选中状态
  - 编辑入口

### 3.3 OPML 导入 / 导出

- 支持导入 OPML 文件并批量添加订阅源。
- 使用 `fast-xml-parser` 或 `opml-parser`。
- 导入时应支持预览订阅源列表。
- 预览列表应支持全选/单选。
- 支持导出当前订阅源为 OPML 文件。

### 3.4 Feed 刷新

- 支持手动刷新当前订阅源。
- 自动定时刷新属于可选项，可以后续实现。
- 刷新后应更新文章列表。
- 刷新过程中需要有加载状态。
- 刷新失败需要有错误反馈。

### 3.5 文章入库与去重

- 解析后的文章写入 `entries` 表。
- 文章应基于 URL 或 GUID 去重。
- 重复刷新同一 Feed 不应重复插入同一篇文章。
- Feed 未读数量应根据未读文章动态计算。

### 3.6 文章状态管理

- 支持文章已读/未读状态。
- 点击文章后可标记为已读。
- Article List 应支持：
  - 全部
  - 未读
  - 已读
- 设计原型里还出现了“收藏”，但当前数据模型没有收藏字段，可作为后续扩展。

### 3.7 正文抓取

- 根据文章 URL 抓取原始 HTML。
- 抓取结果存入 `entry_contents.raw_html`。
- 抓取失败时，应保留原文链接作为 fallback。
- 模块 B 依赖该原始 HTML 做内容清洗。

### 3.8 对外接口

文档要求模块 A 至少提供：

```ts
FeedService.addFeed(url): Promise<Feed>
FeedService.refreshFeed(feedId): Promise<Entry[]>
FeedService.importOpml(filePath): Promise<Feed[]>
ArticleService.getEntries(feedId): Promise<Entry[]>
ArticleService.getEntryContent(entryId): Promise<EntryContent>
ArticleService.markRead(entryId): void
```

当前代码中的等价接口包括：

```ts
FeedService.addFeed(url)
FeedService.refreshFeed(feedId)
FeedService.importOpml(filePath)
FeedService.exportOpml(filePath)
ArticleService.getArticlesByFeed(feedId)
ArticleService.getArticleContent(articleId)
ArticleService.markAsRead(articleId)
ArticleService.markAsUnread(articleId)
```

后续联调时需要注意 `getEntryContent` 与 `getArticleContent` 的命名统一。

## 4. 数据库设计要求

模块 A 直接相关的数据表：

- `feeds`：订阅源信息。
- `entries`：文章元数据。
- `entry_contents`：文章原始 HTML、cleaned HTML、cleaned Markdown。
- `tags` / `entry_tags`：文章标签关系，目前主要由模块 D 使用，但文章列表会展示标签。

关键要求：

- 使用 SQLite 本地存储。
- 使用 `better-sqlite3`。
- UI 不直接访问数据库。
- 数据库访问应封装在 Repository 层。
- Service 层协调业务逻辑。

## 5. UI 设计要求

### 5.1 主界面三栏布局

设计要求主界面为三栏：

- 左侧：Feed Sidebar，宽度约 280px。
- 中间：Article List，宽度约 380px。
- 右侧：Reader View。

模块 A 主要涉及左侧 Feed Sidebar 和中间 Article List。

### 5.2 Feed Sidebar

Feed Sidebar 需要包含：

- 添加订阅按钮。
- 刷新按钮。
- Feed 列表。
- 每个 Feed 项显示标题、URL、未读数量。
- Feed 项选中态。
- Feed 项 hover 时显示编辑按钮。
- 标签筛选可以保留，但标签能力主要属于模块 D。

### 5.3 添加订阅对话框

设计原型文件：`design/html-prototypes/add-subscription-dialog.html`

要求：

- 点击“添加订阅”后打开对话框，而不是使用浏览器 `prompt()`。
- 对话框标题：添加订阅源。
- 表单字段：
  - 订阅源 URL，必填。
  - 自定义名称，可选，留空则使用订阅源标题。
- 显示提示：支持 RSS 和 Atom 格式。
- 按钮：
  - 取消。
  - 添加订阅。
- 添加过程中应有 loading 状态。
- 添加失败时应显示错误信息。

### 5.4 编辑订阅对话框

设计原型文件：`design/html-prototypes/edit-subscription-dialog.html`

要求：

- Feed 项 hover 时显示编辑按钮。
- 点击编辑按钮打开编辑订阅源对话框。
- URL 显示但不可编辑。
- 可编辑自定义名称。
- 可选择刷新频率。
- 包含危险操作区。
- 支持删除订阅源，并提示删除会同时删除该源下文章数据。
- 按钮：
  - 删除订阅源。
  - 取消。
  - 保存修改。

当前后端已支持更新标题和删除 Feed。刷新频率需要数据模型支持，基础版可先保留为 UI 占位。

### 5.5 OPML 导入对话框

设计原型文件：`design/html-prototypes/opml-import-dialog.html`

要求：

- 点击“导入 OPML”后打开导入对话框。
- 支持选择 OPML 文件。
- 支持拖拽上传区域。
- 显示预览订阅源列表。
- 显示订阅源数量。
- 支持全选/单选。
- 点击“导入选中的订阅源”后批量导入。
- 导入过程中显示进度或 loading。
- 导入失败显示错误信息。

当前后端支持按文件路径导入 OPML，但 preload/UI 尚未提供原生文件选择器和预览能力。

### 5.6 Article List

设计要求：

- 显示文章列表标题。
- 提供筛选控制：
  - 全部
  - 未读
  - 已读
  - 收藏（可后续扩展）
- 每篇文章显示：
  - 标题
  - 摘要
  - 作者或来源
  - 发布时间
  - 标签
  - 未读蓝点
- 未读文章应有视觉区分。
- 点击文章后右侧 Reader View 展示文章内容，并更新已读状态。

### 5.7 空状态

设计原型文件：`design/html-prototypes/empty-states.html`

要求：

- 无订阅源时，展示空状态，并提供“添加订阅源”和“导入 OPML”入口。
- 某订阅源无文章时，展示“暂无文章”，并提供刷新订阅源按钮。
- 未选择文章时，Reader View 展示“选择一篇文章开始阅读”。

### 5.8 加载与错误状态

设计原型文件：`design/html-prototypes/loading-error-states.html`

要求：

- Feed 刷新中状态。
- OPML 导入进度。
- 文章列表加载骨架屏。
- 网络错误提示。
- Feed 解析错误提示。
- 数据库错误提示。
- 错误状态应提供重试或返回操作。

## 6. 当前应优先补齐的 A 模块 UI 差距

结合文档和当前代码，优先级如下：

1. 将添加订阅从 `prompt()` 改为真正的对话框。
2. 添加 Feed 项编辑入口和编辑/删除订阅对话框。
3. 增加文章列表的全部/未读/已读筛选。
4. 增加 A 模块相关 loading/error/empty 状态。
5. 增加 OPML 导入入口，至少先支持选择文件路径后导入；预览和单选可作为增强。
6. 增加 OPML 导出入口，可先接入现有 `exportOpml(filePath)` IPC。

## 7. 本次代码修改边界

本次应围绕模块 A 修改：

- `src/renderer/App.vue`
- `src/renderer/components/FeedSidebar.vue`
- `src/renderer/components/ArticleList.vue`
- 必要时新增模块 A 相关对话框组件。
- 必要时补充 preload 和主进程 IPC，用于文件选择器或 OPML 操作。

不应修改模块 B/C/D 的核心业务逻辑。
