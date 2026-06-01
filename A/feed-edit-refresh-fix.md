# Feed 编辑与刷新交互修复记录

日期：2026-06-01

## 修复内容

### 1. 刷新后自定义名称不再重置

问题：

```text
用户编辑订阅源名称 → 点击刷新 → 名称被 RSS 源标题覆盖
```

原因：

`FeedService.refreshFeed()` 在刷新时把解析到的 `parsed.title` 写回 `feeds.title`。

修复：

刷新时不再更新 `title` 字段，只更新：

- `description`
- `siteUrl`
- `updatedAt`
- 文章列表

这样用户自定义名称会保留。

### 2. 编辑订阅窗口不再点击背景关闭

问题：

编辑订阅源窗口点击外层背景就会关闭，容易误操作。

修复：

移除 `EditSubscriptionDialog.vue` 的背景点击关闭逻辑。

现在只能通过：

- 右上角关闭按钮
- 取消按钮
- 保存成功
- 删除成功

关闭编辑窗口。

### 3. 未保存修改关闭前确认

问题：

用户修改名称后，如果误点关闭/取消，会直接丢失修改。

修复：

如果当前输入名称与原名称不同，点击关闭或取消时会提示：

```text
当前修改尚未保存，确定放弃修改吗？
```

## 验证

构建通过：

```powershell
npm run build
```

Electron 已重启：

```text
MainWindowTitle: Mercury
```
