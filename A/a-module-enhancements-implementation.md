# A 模块增强项实现记录

## 本次完成范围

本次补齐了 A 模块中此前尚未完成的 5 个增强项：

1. 自动定时刷新。
2. 刷新频率持久化。
3. 恢复源站原始名称。
4. OPML 拖拽上传。
5. OPML 逐项导入进度。

## 数据结构调整

`feeds` 表新增兼容字段：

- `feed_title`：RSS/Atom 源站返回的原始标题。
- `custom_title`：用户自定义显示名称。
- `refresh_interval_minutes`：自动刷新频率，单位分钟，`0` 表示手动刷新。
- `last_refreshed_at`：最近一次刷新时间。

启动时会自动迁移旧数据库：

- 旧的 `title` 会继续保留，不删除。
- `feed_title` 为空时用旧 `title` 初始化。
- `refresh_interval_minutes` 默认设置为 `0`。
- `last_refreshed_at` 默认设置为旧 `updated_at`。

## 名称逻辑

显示名称优先级：

1. `custom_title`
2. `feed_title`
3. 旧字段 `title`

刷新订阅源时只更新 `feed_title`，不会覆盖 `custom_title`。

编辑订阅源窗口新增“恢复源站原始名称”按钮。点击后会清空 `custom_title`，显示名称回到源站标题。用户也可以把自定义名称输入框清空后保存，效果相同。

## 自动刷新逻辑

Electron 主进程启动后会开启一个每分钟执行一次的检查器：

- 读取所有订阅源。
- 跳过 `refresh_interval_minutes = 0` 的订阅源。
- 判断 `当前时间 - last_refreshed_at` 是否达到设置频率。
- 达到频率后调用现有 `refreshFeed()`。

如果某个源刷新失败，不会中断其他源刷新；失败源会记录本次检查时间，避免同一个失效源每分钟重复阻塞。

## OPML 拖拽上传

OPML 导入弹窗支持两种方式：

- 点击选择 `.opml` / `.xml` 文件。
- 将 `.opml` / `.xml` 文件拖拽到上传区域。

拖拽文件路径通过 Electron preload 中的 `webUtils.getPathForFile()` 获取，再复用已有 `previewOpml(filePath)` 解析流程。

## OPML 逐项导入进度

导入时不再一次性批量提交所有选中订阅源，而是在渲染进程中逐个调用：

```text
importOpmlFeeds([当前 Feed])
```

界面会显示每个 Feed 的状态：

- 等待导入
- 导入中
- 已导入
- 导入失败

如果部分源失败，会保留弹窗并显示失败原因；已成功的源会正常写入数据库。

## 影响文件

- `src/main/database/init.ts`
- `src/main/database/repository.ts`
- `src/main/services/FeedService.ts`
- `src/main/services/interfaces.ts`
- `src/main/index.ts`
- `src/preload/index.ts`
- `src/renderer/env.d.ts`
- `src/renderer/App.vue`
- `src/renderer/components/EditSubscriptionDialog.vue`
- `src/renderer/components/OpmlImportDialog.vue`

## 验证结果

已运行：

```powershell
npm run build
```

结果：构建通过。

## 手动测试建议

1. 启动应用后添加或选择一个订阅源。
2. 打开编辑订阅源窗口，设置自定义名称并保存。
3. 手动刷新该源，确认自定义名称不会被覆盖。
4. 再次编辑，点击“恢复源站原始名称”，确认名称回到 RSS/Atom 原始标题。
5. 在编辑窗口设置刷新频率，例如“每 15 分钟”，关闭窗口后重新打开，确认频率被保存。
6. 打开 OPML 导入窗口，分别测试点击选择文件和拖拽文件。
7. 选择多个 OPML 源导入，观察逐项状态和进度条。
