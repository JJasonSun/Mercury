# 模块 A 验证记录

## 构建验证

命令：

```powershell
npm run build
```

结果：

- Vite 渲染进程构建通过。
- 主进程 TypeScript 构建通过。

## 独立验证脚本

命令：

```powershell
node A\module-a-verification.cjs
```

结果：

```text
Module A verification passed
```

## 覆盖场景

- 通过 URL 添加 RSS Feed。
- 解析 Feed 元数据和文章条目。
- 将文章写入 SQLite。
- 计算 Feed 未读数量。
- 刷新 Feed 时不重复插入已有文章。
- 抓取并存储原始文章 HTML。
- 标记文章已读，并更新未读查询结果。
- 导入 OPML。
- 导出 OPML。

## 说明

- 验证脚本使用隔离的临时 SQLite 数据库和 mock 网络响应。
- 该脚本不会修改真实 Electron 用户数据数据库。
