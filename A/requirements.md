# 模块 A 需求总结

已阅读的来源文档：

- `AGENTS.md`
- `README.md`
- `INIT.md`
- `WEEK1_DELIVERY.md`
- `design/plan.md`
- `design/target.md`

## 模块职责

模块 A 负责订阅与数据系统，主要包括：

- RSS/Atom Feed 解析。
- Feed 订阅管理。
- OPML 导入和导出。
- Feed 刷新和文章同步。
- 文章入库和去重。
- 文章已读/未读状态管理。
- 为模块 B 抓取原始文章 HTML。
- 封装基于 `better-sqlite3` 的 Repository 层。
- 注册与 preload API 匹配的主进程 IPC handlers。

## 交付标准

- 可以通过 URL 添加 Feed。
- 可以导入 OPML，并批量创建 Feed。
- 可以刷新 Feed，并自动写入文章。
- 可以避免重复文章入库。
- 可以抓取并持久化原始 HTML。
- 可以提供文章列表和文章内容 API。

## 基础版实现决策

基础版实现模块 A 列出的全部核心功能。数据库操作使用同步 `better-sqlite3` 调用，并通过异步 Service API 对外暴露。网络请求放在 Service 层，持久化逻辑集中在 Repository 层。
