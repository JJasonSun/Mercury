# Electron 与 better-sqlite3 兼容问题总结

日期：2026-06-01

## 1. 问题现象

在完成模块 A 后，启动 Electron 开发窗口时报错，窗口无法正常打开。

典型报错：

```text
The module '...\node_modules\better-sqlite3\build\Release\better_sqlite3.node'
was compiled against a different Node.js version using
NODE_MODULE_VERSION 127.
This version of Node.js requires NODE_MODULE_VERSION 146.
```

含义是：当前 `better-sqlite3` 的原生二进制文件不是给当前 Electron 运行时编译的。

## 2. 为什么之前没有模块 A 时没问题

模块 A 之前，项目虽然已经安装了 `better-sqlite3`，但 Electron 启动时没有真正执行数据库初始化，也就没有真正加载 `better_sqlite3.node` 这个原生模块。

完成模块 A 后，主进程启动流程发生变化：

1. Electron 启动主进程。
2. `src/main/index.ts` 初始化数据库。
3. `src/main/database/init.ts` 加载 `better-sqlite3`。
4. Electron 尝试加载 `better_sqlite3.node`。
5. 发现该二进制文件 ABI 与 Electron 当前 ABI 不匹配，于是启动失败。

所以模块 A 不是制造了版本问题，而是第一次触发了原来潜伏的原生依赖兼容问题。

## 3. 根本原因

这是 Electron 与 `better-sqlite3` 的原生模块兼容问题，分两层。

### 3.1 ABI 不匹配

普通 `npm install` 默认会按照系统 Node.js 环境安装或编译原生模块。

但 Electron 内部自带 Node/V8 运行时，ABI 与系统 Node.js 不一定一致。

当时的情况是：

```text
better-sqlite3 编译产物 ABI: 127
Electron 42.3.0 需要 ABI: 146
```

因此 Electron 无法加载该模块。

### 3.2 Electron 42 与 better-sqlite3 源码编译不兼容

安装 Windows C++ Build Tools 后，重新编译流程可以启动，但 `better-sqlite3@12.10.0` 在编译到 Electron `42.3.0` 时又出现 V8 API 兼容错误：

```text
error C2668: v8::Template::SetNativeDataProperty: ambiguous call
error C2660: v8::External::Value: function does not take 0 arguments
error C2660: v8::External::New: function does not take 2 arguments
```

这说明当前 `better-sqlite3@12.10.0` 与 Electron `42.3.0` 所带的 V8/Node 头文件不兼容。

## 4. 排查与尝试过程

### 4.1 尝试直接重编译 better-sqlite3

使用当前 Electron 版本对应参数：

```powershell
npm rebuild better-sqlite3 --runtime=electron --target=42.3.0 --abi=146 --dist-url=https://electronjs.org/headers
```

结果：没有找到预编译包，转为本地编译，但当时本机缺少 Visual Studio C++ Build Tools，失败。

### 4.2 安装 electron-builder 并使用 install-app-deps

安装：

```powershell
npm install --save-dev electron-builder
```

执行：

```powershell
npx electron-builder install-app-deps
```

结果：`electron-builder` 正确调用了 `@electron/rebuild`，但仍然因为缺少 C++ 编译工具链失败。

### 4.3 安装 Windows C++ Build Tools

通过 winget 安装 Visual Studio 2022 Build Tools：

```powershell
winget install --id Microsoft.VisualStudio.2022.BuildTools --exact --source winget --accept-package-agreements --accept-source-agreements --override "--quiet --wait --norestart --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```

安装完成后检测到路径：

```text
C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools
```

再次执行：

```powershell
npx electron-builder install-app-deps
```

结果：工具链问题解决，但 `better-sqlite3@12.10.0` 与 Electron `42.3.0` 的 V8 API 不兼容，编译失败。

## 5. 最终修复方案

将 Electron 从 `^42.3.0` 调整为 `^38.4.0`：

```powershell
$env:HTTP_PROXY='http://127.0.0.1:7890'
$env:HTTPS_PROXY='http://127.0.0.1:7890'
$env:ELECTRON_MIRROR='https://npmmirror.com/mirrors/electron/'
npm install --save-dev electron@38.4.0
```

然后重新构建 Electron 原生依赖：

```powershell
npx electron-builder install-app-deps
```

执行成功：

```text
executing @electron/rebuild electronVersion=38.4.0 arch=x64
preparing moduleName=better-sqlite3 arch=x64
finished moduleName=better-sqlite3 arch=x64
completed installing native dependencies
```

## 6. 当前验证结果

项目构建通过：

```powershell
npm run build
```

Electron 开发窗口已成功启动，检测到主窗口：

```text
MainWindowTitle: Mercury
```

说明当前 Electron 桌面应用已经可以正常加载数据库模块并运行。

## 7. 当前依赖状态

关键依赖版本：

```json
{
  "electron": "^38.4.0",
  "electron-builder": "^26.8.1",
  "better-sqlite3": "^12.10.0"
}
```

## 8. 注意事项

现在 `better-sqlite3` 已经被编译成 Electron 使用的 ABI。

因此，如果直接用系统 Node.js 执行某些脚本，例如：

```powershell
node A\module-a-verification.cjs
```

可能会出现反向 ABI 不匹配：

```text
better-sqlite3 was compiled against NODE_MODULE_VERSION 139
This version of Node.js requires NODE_MODULE_VERSION 127
```

这是因为当前 `better-sqlite3.node` 是给 Electron `38.4.0` 编译的，而不是给系统 Node.js 编译的。

对于本项目来说，主要运行目标是 Electron 桌面应用，所以当前状态是正确的。

## 9. 一句话总结

模块 A 启用数据库后触发了 `better-sqlite3` 原生模块加载；原先 Electron `42.3.0` 与 `better-sqlite3@12.10.0` 不兼容，最终通过安装 C++ Build Tools、引入 `electron-builder`、并将 Electron 调整到 `38.4.0` 后成功修复。
