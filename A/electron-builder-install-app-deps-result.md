# electron-builder install-app-deps 执行结果

日期：2026-06-01

## 已做修改

将 `electron-builder` 安装为开发依赖：

```powershell
npm install --save-dev electron-builder
```

安装版本：

```text
electron-builder 26.8.1
```

## 尝试的命令

```powershell
$env:HTTP_PROXY='http://127.0.0.1:7890'
$env:HTTPS_PROXY='http://127.0.0.1:7890'
npx electron-builder install-app-deps
```

## 结果

该命令在重建 `better-sqlite3` 时失败。

关键输出：

```text
electron-builder version=26.8.1
executing @electron/rebuild electronVersion=42.3.0 arch=x64 buildFromSource=false
preparing moduleName=better-sqlite3 arch=x64
Error: Could not find any Visual Studio installation to use
node-gyp failed to rebuild '...\\node_modules\\better-sqlite3'
```

## 含义

`electron-builder install-app-deps` 确实走了预期的 Electron 感知型重建流程。它正确识别了 Electron `42.3.0`，并将原生依赖重建交给 `@electron/rebuild` 处理。

失败原因与直接执行 rebuild 命令一致：Windows 本地编译需要安装带 C++ 桌面开发工作负载的 Visual Studio C++ Build Tools。

## 构建检查

安装 `electron-builder` 后，TypeScript/Vite 构建仍然通过：

```powershell
npm run build
```

结果：

```text
build passed
```
