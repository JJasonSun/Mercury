# Electron ABI 修复结果

日期：2026-06-01

## 问题

模块 A 开始在 Electron 主进程中加载 SQLite 后，Electron 无法加载 `better-sqlite3`，原因是原生 `.node` 二进制文件没有按 Electron 运行时 ABI 编译。

Electron `42.3.0` 需要 ABI `146`，但将 `better-sqlite3@12.10.0` 重编译到 Electron `42.3.0` 时，会出现 V8 C++ API 编译错误。

## 修复方式

将 Electron 从 `^42.3.0` 调整为 `^38.4.0`：

```powershell
$env:HTTP_PROXY='http://127.0.0.1:7890'
$env:HTTPS_PROXY='http://127.0.0.1:7890'
$env:ELECTRON_MIRROR='https://npmmirror.com/mirrors/electron/'
npm install --save-dev electron@38.4.0
```

然后重建应用原生依赖：

```powershell
npx electron-builder install-app-deps
```

## 结果

原生依赖重建成功：

```text
executing @electron/rebuild electronVersion=38.4.0 arch=x64
preparing moduleName=better-sqlite3 arch=x64
finished moduleName=better-sqlite3 arch=x64
completed installing native dependencies
```

## 验证

项目构建通过：

```powershell
npm run build
```

在 Vite 运行于 `http://127.0.0.1:5173` 的情况下，Electron 开发窗口成功启动。

检测到 Electron 主窗口：

```text
MainWindowTitle: Mercury
```

## 说明

将 `better-sqlite3` 重建为 Electron 版本后，直接加载 `better-sqlite3` 的独立 Node 脚本可能会出现反向 ABI 不匹配。原因是当前本地二进制文件已经按 Electron ABI `139` 编译，而系统 Node.js 需要 ABI `127`。

对于这个 Electron 应用来说，主要运行时是 Electron。因此，能够成功重建并启动 Electron 桌面应用就是当前正确状态。
