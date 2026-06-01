# 模块 A UI 与交互补齐记录

日期：2026-06-01

## 依据

本次修改基于 `A/a-module-design-requirements.md` 中整理的项目文档与 HTML 原型要求。

重点参考：

- `design/plan.md`
- `design/Mercury_产品边界与架构说明.md`
- `design/html-prototypes/main-interface-complete.html`
- `design/html-prototypes/add-subscription-dialog.html`
- `design/html-prototypes/edit-subscription-dialog.html`
- `design/html-prototypes/opml-import-dialog.html`
- `design/html-prototypes/empty-states.html`
- `design/html-prototypes/loading-error-states.html`

## 本次补齐内容

### 1. 添加订阅对话框

新增：

- `src/renderer/components/AddSubscriptionDialog.vue`

实现内容：

- 点击“添加订阅”后打开页面内对话框，不再依赖浏览器 `prompt()`。
- 支持输入订阅源 URL。
- 支持输入自定义名称。
- 添加过程中显示“添加中...”。
- 添加失败时在对话框内显示错误。
- 添加成功后自动选择新订阅源并加载文章列表。

### 2. 编辑订阅对话框

新增：

- `src/renderer/components/EditSubscriptionDialog.vue`

实现内容：

- Feed 项 hover 或选中时显示编辑按钮。
- 点击编辑按钮打开编辑对话框。
- URL 显示但不可编辑。
- 可修改订阅源显示名称。
- 刷新频率保留为“手动刷新”占位，因为当前数据模型尚未支持自动刷新频率。
- 支持删除订阅源，并使用确认提示避免误删。

### 3. OPML 导入对话框

新增：

- `src/renderer/components/OpmlImportDialog.vue`

实现内容：

- 左侧侧边栏新增“导入 OPML”入口。
- 使用 Electron 原生文件选择器选择 `.opml` / `.xml` 文件。
- 预览 OPML 中的订阅源列表。
- 支持全选/单选。
- 支持导入选中的订阅源。
- 导入失败时在对话框内显示错误。

### 4. OPML 导出入口

实现内容：

- 左侧侧边栏新增“导出 OPML”入口。
- 使用 Electron 原生保存对话框选择导出路径。
- 调用现有 `FeedService.exportOpml(filePath)` 完成导出。

### 5. Feed Sidebar

修改：

- `src/renderer/components/FeedSidebar.vue`

实现内容：

- 添加订阅、刷新、导入 OPML、导出 OPML 四个操作入口。
- 刷新时显示 loading 状态。
- 无订阅源时显示空状态，并提供添加订阅入口。
- Feed 项增加编辑按钮。

### 6. Article List

修改：

- `src/renderer/components/ArticleList.vue`

实现内容：

- “全部 / 未读 / 已读”筛选按钮接入真实状态。
- 文章列表加载时显示 loading 状态。
- 无文章时显示空状态。
- 保留未读蓝点和未读视觉区分。

### 7. IPC / Preload 补充

修改：

- `src/main/index.ts`
- `src/preload/index.ts`
- `src/renderer/env.d.ts`
- `src/main/services/FeedService.ts`
- `src/main/services/interfaces.ts`
- `src/main/types/index.ts`

新增能力：

- `selectOpmlFile()`
- `selectOpmlExportPath()`
- `previewOpml(filePath)`
- `importOpmlFeeds(feeds)`

## 验证结果

构建通过：

```powershell
npm run build
```

Electron 窗口已重启并打开：

```text
MainWindowTitle: Mercury
```

## 当前仍保留为后续扩展的内容

- 自动定时刷新。
- 刷新频率持久化。
- 收藏文章。
- OPML 拖拽上传。
- 更完整的文章操作菜单。
