# OPML 导入 IPC 克隆错误修复记录

日期：2026-06-01

## 问题现象

在 OPML 导入过程中，渲染进程提示：

```text
导入失败：An object could not be cloned.
```

## 原因

Electron IPC 使用结构化克隆在主进程和渲染进程之间传递数据。某些来自数据库查询或 XML 解析的对象可能不是普通 JSON 对象，导致 IPC 无法克隆。

## 修复内容

### 1. 主进程 IPC 返回值 JSON 化

在 `src/main/index.ts` 中增加：

```ts
function cloneForIpc<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
```

并对 A 模块相关 IPC 返回值统一执行 `cloneForIpc()`。

### 2. Repository 返回值普通对象化

在 `src/main/database/repository.ts` 中，将 Feed、Article、Tag、ArticleContent 的返回字段显式转为 string / number / boolean 等普通类型。

### 3. OPML 解析错误更明确

在 `src/main/services/FeedService.ts` 中：

- `previewOpml()` 返回普通 `{ title, url }` 对象。
- 无效 OPML 或无订阅源时抛出明确错误：

```text
该文件不是有效的 OPML，或其中没有可导入的订阅源
```

### 4. IPC 入参普通对象化

第二次排查确认，导入时仍然报错的直接原因是渲染进程把 Vue props 中的响应式对象传给了 IPC。Electron 在发送参数时同样需要结构化克隆，Vue Proxy 不能直接跨进程传递。

因此又补充修改：

- `src/renderer/components/OpmlImportDialog.vue`
  - emit 前将选中的 feeds 映射为普通 `{ title, url }` 对象。
- `src/renderer/App.vue`
  - 调用 `window.electronAPI.importOpmlFeeds()` 前再次转为普通对象。
- `src/preload/index.ts`
  - 进入 `ipcRenderer.invoke()` 前再次转为普通对象。
- `src/main/index.ts`
  - 主进程接收后再次校验并普通化。

## 验证

构建通过：

```powershell
npm run build
```

Electron 已重启：

```text
MainWindowTitle: Mercury
```

## 后续网络失败处理

继续测试时，`https://www.v2ex.com/index.xml` 在当前 Node/Electron 网络环境中出现连接超时：

```text
ConnectTimeoutError: Connect Timeout Error
```

这不是 OPML 解析或 IPC 问题，而是单个订阅源抓取失败。

已将 OPML 导入改成“部分成功”策略：

- 成功抓取的订阅源正常导入。
- 失败的订阅源不会导致整个 OPML 导入失败。
- UI 会显示“已导入 N 个，失败 M 个”以及失败原因。
