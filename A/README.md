# 模块 A 工作记录

本文件夹记录 Mercury 模块 A 的实现过程，范围包括订阅管理、文章数据、OPML、Feed 刷新和原始正文抓取。

## 处理流程

1. 阅读项目文档，整理模块 A 的功能范围。
2. 检查现有数据库结构、类型定义、服务接口、preload API 和主进程代码。
3. 实现 Repository、FeedService、ArticleService 和 IPC handlers。
4. 在可行范围内将渲染进程 demo 接入模块 A 的 IPC 接口。
5. 执行构建和验证。

## 基础版范围

- Feed 基础 CRUD：添加、列表、删除。
- 使用 `rss-parser` 解析 RSS/Atom。
- Feed 刷新、文章入库和去重。
- 使用 `fast-xml-parser` 实现 OPML 导入/导出。
- 文章查询：按 Feed 查询、查询全部、查询未读。
- 文章已读/未读状态管理。
- 抓取并存储原始 HTML，供后续清洗模块使用。
- 模块 A 对应的 IPC handlers。

## 说明

- 基础版暂不实现自动定时刷新，只实现手动刷新；后续可以在此基础上安全加入调度机制。
- 模块 B/C/D 后续联调时会使用模块 A 存储的原始 HTML 和文章元数据。
