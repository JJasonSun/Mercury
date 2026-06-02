# A 模块功能与实现说明

## 1. 模块定位

A 模块是 Mercury 的“订阅与数据系统”，负责主链路前半段：

```text
订阅源导入
  -> Feed 刷新
  -> 文章入库
  -> 正文原始 HTML 抓取
```

它为后续模块提供基础数据：

- 模块 B：使用 raw HTML 做内容清洗。
- 模块 C：基于清洗后的内容做摘要和翻译。
- 模块 D：基于文章数据做标签、导出和设置。

## 2. 后端新增能力

### 2.1 Repository 数据访问层

新增文件：

- `src/main/database/repository.ts`

主要职责：

- 封装 `feeds`、`entries`、`entry_contents`、`tags` 等表的读写。
- 提供 Feed 列表、文章列表、未读数量、文章内容、已读状态等查询。
- 对返回给 IPC/UI 的对象做普通类型转换，避免结构化克隆失败。

### 2.2 FeedService

新增文件：

- `src/main/services/FeedService.ts`

实现能力：

- 添加 RSS/Atom 订阅源。
- 编辑订阅源显示名称。
- 删除订阅源。
- 获取订阅源列表。
- 手动刷新单个订阅源。
- 刷新全部订阅源。
- 自动刷新到期订阅源。
- OPML 预览、导入、导出。
- 文章解析、入库和去重。

使用依赖：

- `rss-parser`：解析 RSS/Atom。
- `fast-xml-parser`：解析和生成 OPML。

### 2.3 ArticleService

新增文件：

- `src/main/services/ArticleService.ts`

实现能力：

- 按 Feed 查询文章列表。
- 查询全部文章。
- 查询未读文章。
- 获取文章详细内容。
- 懒抓取文章 raw HTML 并写入 `entry_contents.raw_html`。
- 标记文章已读/未读。

### 2.4 IPC 与 preload

修改文件：

- `src/main/index.ts`
- `src/preload/index.ts`
- `src/renderer/env.d.ts`

新增或补齐接口：

- `getFeedList()`
- `addFeed(url)`
- `updateFeed(feedId, updates)`
- `resetFeedTitle(feedId)`
- `deleteFeed(feedId)`
- `refreshFeed(feedId)`
- `refreshAllFeeds()`
- `selectOpmlFile()`
- `selectOpmlExportPath()`
- `previewOpml(filePath)`
- `importOpmlFeeds(feeds)`
- `exportOpml(filePath)`
- `getArticleList(feedId)`
- `getAllArticles()`
- `getUnreadArticles()`
- `getArticleContent(articleId)`
- `markArticleRead(articleId)`
- `markArticleUnread(articleId)`

## 3. 数据库实现

### 3.1 基础表

A 模块主要使用：

- `feeds`：订阅源信息。
- `entries`：文章元数据。
- `entry_contents`：文章 raw HTML、cleaned HTML、Markdown。

### 3.2 订阅源名称拆分

`feeds` 表新增字段：

- `feed_title`：RSS/Atom 源站返回的原始标题。
- `custom_title`：用户自定义显示名称。

显示名称优先级：

```text
custom_title -> feed_title -> title
```

这样刷新订阅源时可以更新源站标题，同时不覆盖用户自定义名称。

### 3.3 刷新频率持久化

`feeds` 表新增字段：

- `refresh_interval_minutes`：自动刷新频率，单位分钟，`0` 表示手动刷新。
- `last_refreshed_at`：最近一次刷新时间。
- `last_error`：最近一次刷新失败原因，刷新成功后清空。

启动时会自动迁移旧数据库：

- `feed_title` 为空时用旧 `title` 初始化。
- `refresh_interval_minutes` 默认设为 `0`。
- `last_refreshed_at` 默认设为旧 `updated_at`。
- `last_error` 默认设为空。

## 4. Feed 与文章功能

### 4.1 添加订阅源

流程：

1. 用户输入 RSS/Atom URL。
2. `FeedService.addFeed()` 规范化 URL。
3. 使用 `rss-parser` 抓取并解析 Feed。
4. 写入 `feeds` 表。
5. 解析文章条目并写入 `entries` 表。
6. UI 重新加载订阅源和文章列表。

### 4.2 文章入库与去重

去重策略：

- 优先按规范化后的文章 URL 查重。
- 如果存在 GUID，则按同一 Feed 下的 GUID 查重。
- 如果 GUID 为空，则使用“标题 + 发布时间 + 规范化链接”作为弱去重依据。

文章 URL 规范化规则：

- 去掉尾部 `/`。
- 去掉常见 tracking 参数，例如 `utm_*`、`fbclid`、`gclid`、`mc_cid`、`mc_eid` 等。

重复刷新同一订阅源时，不会重复插入已有文章。

### 4.3 文章状态

支持：

- 点击文章后标记为已读。
- 手动标记已读/未读。
- 查询全部、未读、已读文章。
- Feed 未读数量动态计算。

### 4.4 原始正文抓取

点击文章详情时：

1. 先查 `entry_contents` 是否已有 raw HTML。
2. 没有则根据文章 URL 发起 fetch。
3. 抓取成功后写入 `entry_contents.raw_html`。
4. 抓取失败时保留原文链接作为 fallback。

## 5. OPML 功能

### 5.1 OPML 导入

支持：

- 点击选择 `.opml` / `.xml` 文件。
- 拖拽 `.opml` / `.xml` 文件到导入区域。
- 预览 OPML 中的订阅源。
- 全选/单选订阅源。
- 导入选中的订阅源。
- 部分成功导入。
- 逐项导入进度。

逐项导入时，渲染进程会按订阅源循环调用：

```text
importOpmlFeeds([当前 Feed])
```

每个 Feed 会显示状态：

- 等待导入
- 导入中
- 已导入
- 导入失败

### 5.2 OPML 导出

支持通过原生保存对话框选择路径，并将当前订阅源导出为 OPML 文件。

导出字段包括：

- 标题
- RSS URL
- 站点 URL

## 6. 自动刷新

Electron 主进程启动后会开启一个每分钟执行一次的检查器：

1. 读取全部订阅源。
2. 跳过 `refresh_interval_minutes = 0` 的订阅源。
3. 判断当前时间距离 `last_refreshed_at` 是否达到刷新频率。
4. 到期后调用 `refreshFeed()`。

如果某个订阅源刷新失败，不会影响其他源。失败源会记录本次检查时间和失败原因，避免失效源每分钟重复阻塞，并让 UI 可以展示错误信息。

刷新成功后：

- 更新 `last_refreshed_at`。
- 清空 `last_error`。

刷新失败后：

- 更新 `last_refreshed_at`。
- 写入 `last_error`。
- 单个 Feed 的失败不会阻断 `refreshAllFeeds()` 中其他 Feed 的刷新。

## 7. 前端 UI 实现

### 7.1 添加订阅对话框

新增文件：

- `src/renderer/components/AddSubscriptionDialog.vue`

能力：

- 输入订阅源 URL。
- 输入可选自定义名称。
- 添加过程中显示 loading。
- 添加失败时在对话框内展示错误。

### 7.2 编辑订阅对话框

新增文件：

- `src/renderer/components/EditSubscriptionDialog.vue`

能力：

- 展示不可编辑的订阅源 URL。
- 编辑自定义名称。
- 查看源站原始名称。
- 一键恢复源站原始名称。
- 设置刷新频率。
- 删除订阅源。
- 删除前展示该订阅源下的文章数量。
- 未保存修改时关闭前确认。

### 7.3 OPML 导入对话框

新增文件：

- `src/renderer/components/OpmlImportDialog.vue`

能力：

- 点击选择 OPML 文件。
- 拖拽上传 OPML 文件。
- 预览订阅源列表。
- 全选/单选。
- 显示逐项导入进度。
- 显示部分失败原因。
- 预览阶段标记订阅源状态：
  - `新增`
  - `已存在`
  - `重复`
  - `无效 URL`
- 重复和无效 URL 默认不可选，避免误导入。

### 7.4 Feed Sidebar

修改文件：

- `src/renderer/components/FeedSidebar.vue`

能力：

- 添加订阅。
- 刷新当前订阅源。
- 导入 OPML。
- 导出 OPML。
- 展示 Feed 标题、URL、未读数。
- 展示选中 Feed 的上次刷新时间。
- 刷新失败时展示失败提示和错误原因。
- Feed hover 或选中时显示编辑按钮。
- 无订阅源时显示空状态。

### 7.5 Article List

修改文件：

- `src/renderer/components/ArticleList.vue`

能力：

- 全部 / 未读 / 已读筛选。
- 加载状态。
- 空状态。
- 未读视觉提示。

### 7.6 Reader View

修改文件：

- `src/renderer/components/ReaderView.vue`

能力：

- 打开文章时自动标记已读。
- 新增“标记未读”按钮，调用已有 `markArticleUnread` IPC。
- 标记未读后刷新文章列表状态和 Feed 未读数。

## 8. 本轮优化内容

本轮围绕 A 模块可验收性和真实使用稳定性做了以下优化：

| 优化项 | 实现说明 |
|---|---|
| 刷新错误隔离 | `refreshAllFeeds()` 对每个 Feed 单独捕获错误，某个 Feed 失败不会影响其他 Feed。 |
| 刷新失败记录 | `feeds.last_error` 持久化失败原因，成功刷新后清空。 |
| 刷新状态展示 | Feed Sidebar 显示选中 Feed 的上次刷新时间和刷新失败原因。 |
| 去重规则增强 | 文章 URL 去尾部 `/`、清理 tracking 参数；GUID 为空时使用弱去重。 |
| OPML 预览状态 | 导入前显示新增、已存在、重复、无效 URL，并禁用重复/无效项。 |
| 删除前数量提示 | 删除订阅源前展示会删除的文章数量。 |
| 标记未读 UI | Reader View 增加“标记未读”按钮，并更新未读数量。 |
| 固定手测夹具 | 新增 `test/` 目录，提供本地 RSS 服务、OPML 文件和手动测试说明。 |

## 9. 已完成的 A 模块功能清单

- RSS/Atom Feed 解析。
- Feed 添加、编辑、删除。
- Feed 手动刷新。
- Feed 自动定时刷新。
- 刷新频率持久化。
- 用户自定义名称。
- 恢复源站原始名称。
- 文章入库与去重。
- Feed 未读数量计算。
- Feed 上次刷新时间展示。
- Feed 刷新失败原因记录和展示。
- 文章全部/未读/已读筛选。
- 文章已读/未读状态管理。
- 文章 raw HTML 懒抓取和存储。
- 增强文章去重规则。
- OPML 点击选择导入。
- OPML 拖拽上传。
- OPML 预览、全选、单选。
- OPML 新增/已存在/重复/无效 URL 预览状态。
- OPML 逐项导入进度。
- OPML 部分成功/失败汇总。
- OPML 导出。
- A 模块 IPC handlers 和 preload API。
- Electron 环境真实数据接入，浏览器环境保留 mock fallback。

## 10. 不属于 A 模块的功能

以下能力在文档中归属其他模块，A 模块只提供基础数据：

| 功能 | 归属 |
|---|---|
| cleaned HTML / cleaned Markdown | 模块 B |
| 阅读样式系统 | 模块 B |
| AI 摘要 | 模块 C |
| AI 翻译 | 模块 C |
| LLM 配置 | 模块 D |
| 标签 CRUD | 模块 D |
| 技术 / 产品 / 设计分类 | 模块 D |
| Markdown 导出文章 | 模块 D |
| 全文搜索 | 更偏模块 D 或后续 P1 可选 |

## 11. 验证方式

已执行：

```powershell
npm run build
```

结果：构建通过。

### 11.1 固定本地测试用例

新增目录：

- `test/README.md`
- `test/server.cjs`
- `test/opml/module-a-basic.opml`
- `test/opml/module-a-preview-status.opml`

从项目根目录启动本地测试 RSS 服务：

```powershell
node test/server.cjs
```

服务地址：

```text
http://127.0.0.1:8787
```

测试 Feed：

| Feed | URL | 测试目的 |
|---|---|---|
| Mercury Basic Feed | `http://127.0.0.1:8787/feed/basic.xml` | 添加订阅、文章入库、打开文章 |
| Mercury Growing Feed | `http://127.0.0.1:8787/feed/growing.xml` | 刷新后新增文章 |
| Mercury Flaky Feed | `http://127.0.0.1:8787/feed/flaky.xml` | 刷新失败隔离和错误展示 |
| Mercury Duplicate Feed | `http://127.0.0.1:8787/feed/duplicates.xml` | URL 规范化和文章去重 |

测试控制地址：

| 控制地址 | 作用 |
|---|---|
| `http://127.0.0.1:8787/control/growing/add` | 让 growing feed 新增第三篇文章 |
| `http://127.0.0.1:8787/control/growing/reset` | 重置 growing feed 为两篇文章 |
| `http://127.0.0.1:8787/control/flaky/fail` | 让 flaky feed 返回 HTTP 503 |
| `http://127.0.0.1:8787/control/flaky/ok` | 恢复 flaky feed 正常响应 |

OPML 测试文件：

- `test/opml/module-a-basic.opml`
- `test/opml/module-a-preview-status.opml`

详细手测步骤见：

```text
test/README.md
```

### 11.2 外部真实 Feed 建议

1. 添加 `https://www.ruanyifeng.com/blog/atom.xml`。
2. 刷新订阅源，确认文章不会重复插入。
3. 编辑订阅源名称，刷新后确认自定义名称不被覆盖。
4. 点击“恢复源站原始名称”。
5. 设置刷新频率，关闭后重新打开确认保存成功。
6. 导入 OPML，测试点击选择和拖拽上传。
7. 选择多个订阅源导入，观察逐项进度和失败提示。
8. 导出 OPML，确认文件可生成。
