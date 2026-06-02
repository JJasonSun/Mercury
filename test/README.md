# Mercury Module A 手动测试用例

这组测试用例用于在 UI 中手动验证模块 A：订阅管理、OPML 导入、刷新、去重、刷新错误、已读/未读、删除订阅。

## 1. 启动本地测试 RSS 服务

在项目根目录运行：

```bash
node test/server.cjs
```

默认服务地址：

```text
http://127.0.0.1:8787
```

浏览器打开上面的地址可以看到所有测试 Feed 和控制按钮。

## 2. 可用测试 Feed

| 用例 | URL | 用途 |
|---|---|---|
| 稳定订阅源 | `http://127.0.0.1:8787/feed/basic.xml` | 测试添加订阅、文章入库、打开文章抓取 HTML |
| 可增长订阅源 | `http://127.0.0.1:8787/feed/growing.xml` | 测试刷新后新增文章 |
| 可失败订阅源 | `http://127.0.0.1:8787/feed/flaky.xml` | 测试刷新错误隔离和 UI 错误展示 |
| 重复文章订阅源 | `http://127.0.0.1:8787/feed/duplicates.xml` | 测试 URL 规范化和文章去重 |

## 3. OPML 文件

| 文件 | 用途 |
|---|---|
| `test/opml/module-a-basic.opml` | 导入稳定源、可增长源、可失败源 |
| `test/opml/module-a-preview-status.opml` | 测试 OPML 预览中的新增、已存在、重复、无效 URL 状态 |

## 4. 测试用例

### TC-A1 添加订阅并入库

1. 启动 Mercury。
2. 点击左侧 `添加订阅`。
3. 输入 `http://127.0.0.1:8787/feed/basic.xml`。
4. 点击 `添加订阅`。

预期：
- 左侧出现 `Mercury Basic Feed`。
- 未读数为 `2`。
- 中间文章列表出现两篇文章。
- 点击文章后文章变为已读，未读数减少。

### TC-A2 刷新新增文章

1. 添加 `http://127.0.0.1:8787/feed/growing.xml`。
2. 确认初始文章数为 `2`。
3. 浏览器访问 `http://127.0.0.1:8787/control/growing/add`。
4. 回到 Mercury，选中 `Mercury Growing Feed`，点击 `刷新`。

预期：
- 中间文章列表新增 `Growing Article Three`。
- 左侧显示上次刷新时间。
- 重复点击刷新不会重复插入已有文章。

重置增长源：

```text
http://127.0.0.1:8787/control/growing/reset
```

### TC-A3 刷新失败隔离和错误展示

1. 添加 `http://127.0.0.1:8787/feed/flaky.xml`。
2. 浏览器访问 `http://127.0.0.1:8787/control/flaky/fail`。
3. 回到 Mercury，选中 `Mercury Flaky Feed`，点击 `刷新`。

预期：
- UI 弹出刷新失败提示。
- 左侧选中 Feed 附近显示 `刷新失败` 和失败原因。
- 上次刷新时间会更新。
- 其他订阅源仍可继续刷新，不受影响。

恢复失败源：

```text
http://127.0.0.1:8787/control/flaky/ok
```

恢复后再次刷新，预期错误提示消失。

### TC-A4 文章去重增强

1. 添加 `http://127.0.0.1:8787/feed/duplicates.xml`。
2. 查看中间文章列表。
3. 多次点击 `刷新`。

预期：
- Feed XML 中包含带 `utm_*` 参数、尾部 `/` 差异、不同 GUID 的重复文章。
- UI 中不应出现重复文章堆积。
- 多次刷新后文章数量保持稳定。

### TC-A5 OPML 基础导入

1. 点击左侧 `导入 OPML`。
2. 选择 `test/opml/module-a-basic.opml`。
3. 确认预览列表。
4. 点击 `导入选中的订阅源`。

预期：
- 三个订阅源被导入。
- 每个导入项显示导入进度。
- 导入后左侧 Feed 列表更新。

### TC-A6 OPML 预览状态

建议先完成 TC-A5，让 `basic/growing/flaky` 已经存在。

1. 点击左侧 `导入 OPML`。
2. 选择 `test/opml/module-a-preview-status.opml`。

预期：
- 已存在的 Feed 显示 `已存在`。
- OPML 中重复出现的 Feed 显示 `重复`，不可选。
- 无效 URL 显示 `无效 URL`，不可选。
- 新 Feed 显示 `新增`。

### TC-A7 标记未读

1. 打开任意一篇文章。
2. 确认未读圆点消失或左侧未读数减少。
3. 点击 ReaderView 顶部的 `标记未读`。

预期：
- 当前文章重新变为未读。
- 左侧 Feed 未读数增加。
- 文章列表的未读筛选能看到该文章。

### TC-A8 删除订阅源

1. 鼠标悬停某个 Feed，点击右下角编辑按钮。
2. 查看危险区域提示。
3. 点击 `删除订阅源`。

预期：
- 删除确认框显示将删除的文章数量。
- 确认后该 Feed 从左侧消失。
- 该 Feed 下文章也不再显示。

## 5. 常见问题

### 添加 Feed 失败

确认测试服务仍在运行：

```bash
curl http://127.0.0.1:8787/feed/basic.xml
```

### 右侧正文为空

模块 A 只负责抓取并存储 `rawHtml`。`cleanedHtml` 的清洗和渲染属于模块 B。当前测试重点是文章能打开、已读状态变化、原文链接存在。

### 端口冲突

这套 OPML 写死了 `8787` 端口。若端口被占用，先关闭占用进程，或改 OPML 文件和启动端口保持一致。
