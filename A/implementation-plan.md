# 模块 A 实现计划

## 新增文件

- `src/main/database/repository.ts`
- `src/main/services/FeedService.ts`
- `src/main/services/ArticleService.ts`

## 修改文件

- `src/main/database/init.ts`
- `src/main/index.ts`
- `src/preload/index.ts`
- `src/main/types/index.ts`
- `src/renderer/App.vue`

## 实现细节

- 使用 `crypto.randomUUID()` 生成稳定 ID。
- 在 `feeds.url` 上保证 Feed URL 唯一。
- 文章优先按 `entries.url` 去重；如果有 GUID，则作为补充标识。
- 保持面向 UI 的类型与现有 `Feed`、`Article`、`ArticleContent` 兼容。
- 当调用 `getArticleContent()` 且本地缺少内容时，再懒加载抓取原始 HTML。
- 数据库初始化保持幂等，并启用外键约束。

## 验证计划

- `npm run build`
- 主进程 TypeScript 编译。
- 渲染进程构建。
- 使用隔离的临时 SQLite 数据库运行模块 A 验证脚本。
