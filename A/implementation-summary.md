# 模块 A 实现总结

## 新增内容

- `src/main/database/repository.ts`
  - 封装 Feed、文章、文章内容、标签和已读状态相关的 SQLite 读写操作。
- `src/main/services/FeedService.ts`
  - 实现 Feed 添加、更新、删除、列表查询。
  - 使用 `rss-parser` 实现 RSS/Atom 解析。
  - 实现 Feed 刷新和文章去重。
  - 使用 `fast-xml-parser` 实现 OPML 导入/导出。
- `src/main/services/ArticleService.ts`
  - 实现文章列表查询。
  - 实现未读文章查询。
  - 实现原始 HTML 懒加载抓取和持久化。
  - 实现已读/未读状态管理。
- `src/renderer/env.d.ts`
  - 为渲染进程补充 `window.electronAPI` 类型定义。
- `A/module-a-verification.cjs`
  - 使用临时数据库的模块 A 独立验证脚本。

## 修改内容

- `src/main/database/init.ts`
  - 新增可复用的 `initDatabaseAtPath()`，方便测试。
  - 启用 SQLite 外键。
  - 调整 SQL 定义格式。
- `src/main/index.ts`
  - 初始化数据库和服务。
  - 注册模块 A 的 IPC handlers。
  - 修正当前构建布局下的 preload 路径。
- `src/preload/index.ts`
  - 暴露模块 A IPC API。
- `src/main/services/interfaces.ts`
  - 增加 Feed 更新接口和兼容用的文章别名接口。
- `src/renderer/App.vue`
  - 在 Electron 环境中通过 IPC 加载真实 Feed 和文章数据。
  - 保留浏览器 demo 模式下的 mock fallback。
  - 增加基于 prompt 的添加 Feed 和刷新行为。

## 已实现的模块 A 功能

- RSS/Atom Feed 解析。
- Feed 订阅基础 CRUD。
- OPML 导入/导出。
- 文章同步、存储和去重。
- 文章列表和未读列表。
- 文章已读/未读状态。
- 原始 HTML 抓取和存储。
- 用于渲染进程集成的 IPC handlers。

## 暂缓内容

- 自动定时刷新。
- 完整的订阅编辑 UI。
- OPML 导入/导出的原生文件选择器。
- 更完善的 favicon 发现逻辑。
