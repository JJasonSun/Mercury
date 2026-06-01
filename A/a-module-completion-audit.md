# 模块 A 完成度核查

日期：2026-06-01

## 1. 核查范围

本次重新查看了项目根目录文档、`design/` 设计文档和 `design/html-prototypes/` 原型说明，并对照当前代码实现。

重点来源：

- `AGENTS.md`
- `README.md`
- `INIT.md`
- `DEMO_GUIDE.md`
- `WEEK1_DELIVERY.md`
- `design/plan.md`
- `design/target.md`
- `design/Mercury_产品边界与架构说明.md`
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

## 2. A 模块核心要求完成情况

| 编号 | 要求 | 当前状态 | 说明 |
|---|---|---|---|
| A1 | RSS / Atom Feed 解析 | 已完成 | `FeedService.addFeed()` 使用 `rss-parser` 解析 Feed URL。 |
| A2 | Feed 订阅管理 | 已完成 | 支持添加、编辑名称、删除；UI 有添加/编辑对话框。 |
| A3 | OPML 导入 | 已完成 | 支持选择 OPML 文件、预览、全选/单选、部分成功导入。 |
| A4 | 文章入库与去重 | 已完成 | 文章写入 `entries`，按 URL/GUID 去重。 |
| A5 | Feed 手动刷新 | 已完成 | 支持刷新当前 Feed，并更新文章列表。 |
| A6 | 文章状态管理 | 已完成 | 支持已读/未读，Article List 支持全部/未读/已读筛选。 |
| A7 | 正文抓取 raw HTML | 已完成 | 点击文章时通过 `ArticleService.getArticleContent()` 懒抓取 raw HTML 并存储。 |
| A8 | OPML 导出 | 已完成 | 支持选择保存路径并导出 OPML。 |
| IPC | 主进程 handler + preload API | 已完成 | A 模块相关接口已暴露给渲染进程。 |
| Repository | SQLite 数据访问层 | 已完成 | `src/main/database/repository.ts` 封装 Feed/Article/Content 读写。 |

## 3. 仍未完成或部分完成的 A 模块增强项

### 3.1 自动定时刷新

状态：未完成。

文档位置：

- `design/plan.md`：A5 写到“手动刷新 + 定时刷新（可选）”。
- `A/a-module-ui-implementation-update.md`：已记录为后续扩展。

判断：

这是 A 模块功能，但文档明确标注为可选项。当前基础版只实现手动刷新是合理的。

### 3.2 刷新频率持久化

状态：未完成。

文档位置：

- `design/html-prototypes/edit-subscription-dialog.html`
- `design/html-prototypes/README.md`
- `design/html-prototypes/NAVIGATION.md`

当前状态：

编辑订阅窗口里显示“刷新频率：手动刷新”，但控件禁用，没有数据库字段和调度逻辑。

判断：

属于 A 模块增强项。若要完成，需要：

- `feeds` 表增加刷新频率字段。
- Repository 支持读写。
- FeedService 支持刷新策略。
- 主进程定时调度或应用级刷新任务。

### 3.3 恢复源站原始名称

状态：未完成。

当前问题：

现在 `feeds.title` 同时承担“显示名称”和“Feed 源标题”。为了避免刷新覆盖用户自定义名称，当前刷新时不再更新 `title`。

影响：

用户可以自定义名称，但没有“一键恢复 RSS 源原始标题”的能力。

判断：

属于 A 模块订阅管理增强项。更完整做法是拆分：

```text
feed_title      RSS 源原始标题
custom_title    用户自定义标题，可为空
display_title   显示名称，取 custom_title || feed_title
```

### 3.4 OPML 拖拽上传

状态：未完成。

文档位置：

- `design/html-prototypes/opml-import-dialog.html`

当前状态：

已支持点击选择文件，但尚未支持拖拽文件到对话框。

判断：

属于 A 模块 UI 增强项，不影响核心导入功能。

### 3.5 更细的 OPML 导入进度

状态：部分完成。

当前状态：

已支持 loading、预览、部分成功/失败汇总。

未完成：

- 没有逐个订阅源的实时进度条。

判断：

属于 A 模块体验增强项。

### 3.6 文章收藏

状态：未完成。

文档位置：

- HTML 原型中 Article List 有“收藏”筛选。
- `NAVIGATION.md` 提到文章操作菜单可包含收藏。

判断：

不建议算作 A 模块核心。收藏更接近文章操作/标签/整理能力，可能归模块 D 或后续 P2。当前数据库也没有收藏字段。

### 3.7 文章搜索 / 全文搜索

状态：未完成。

文档位置：

- `design/html-prototypes/NAVIGATION.md`
- `design/html-prototypes/OPTIMIZATION-SUMMARY.md`
- `design/html-prototypes/PLAN-COVERAGE.md`

判断：

不属于 A 模块核心。`design/plan.md` 将“多篇导出 / 全文搜索（P1 可选）”放在模块 D。A 模块只需要提供稳定文章数据。

### 3.8 文章右键菜单 / 快捷键

状态：未完成。

文档位置：

- `design/html-prototypes/NAVIGATION.md`
- `design/html-prototypes/PLAN-COVERAGE.md`

判断：

属于 P2 体验优化，不是 A 模块核心交付。

## 4. 不属于 A 模块的内容

| 功能 | 归属 |
|---|---|
| 技术 / 产品 / 设计等标签分类 | 模块 D |
| 标签 CRUD、文章打标签、按标签筛选真实逻辑 | 模块 D |
| AI 摘要 | 模块 C |
| AI 翻译 | 模块 C |
| cleaned HTML / cleaned Markdown | 模块 B |
| 阅读样式系统 | 模块 B |
| Markdown 导出文章 | 模块 D |
| LLM 配置 | 模块 D |
| 全文搜索 | 文档中更偏模块 D / P1 可选 |

## 5. 当前结论

模块 A 的基础版核心功能已经基本完成：

- 订阅源添加、编辑、删除。
- RSS/Atom 解析。
- OPML 导入/导出。
- Feed 手动刷新。
- 文章入库和去重。
- 文章列表和未读状态。
- 文章 raw HTML 抓取。
- IPC 与 UI 基础闭环。

剩余主要是增强项：

1. 自动定时刷新。
2. 刷新频率持久化。
3. 源站原始名称与自定义名称分离，并支持恢复源站名称。
4. OPML 拖拽上传。
5. OPML 逐项导入进度。

如果目标是“基础 demo 可汇报、可测试”，当前 A 模块已经达到要求；如果目标是“完全贴齐所有 UI 原型细节”，还需要补上述增强项。
