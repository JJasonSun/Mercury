# Electron better-sqlite3 重编译命令结果

日期：2026-06-01

## 尝试的命令

```powershell
$env:HTTP_PROXY='http://127.0.0.1:7890'
$env:HTTPS_PROXY='http://127.0.0.1:7890'
npm rebuild better-sqlite3 --runtime=electron --target=42.3.0 --abi=146 --dist-url=https://electronjs.org/headers
```

## 结果

该命令已经进入正确的 Electron 目标重编译流程，但最终失败。

关键输出：

```text
No prebuilt binaries found (target=42.3.0 runtime=electron arch=x64 platform=win32)
Could not find any Visual Studio installation to use
You need to install the latest version of Visual Studio including the "Desktop development with C++" workload.
```

## 含义

当前 Electron 运行时需要 `NODE_MODULE_VERSION 146`。重编译命令使用的是 Electron `42.3.0` 和 ABI `146`，与当前应用运行时匹配。

但是，`better-sqlite3` 没有为这个精确的 Electron 目标提供 Windows 预编译二进制包，所以 npm 回退到通过 `node-gyp` 进行本地编译。本地编译无法继续，因为当时机器上没有安装 Visual Studio C++ Build Tools。

这说明当时的阻塞点是缺少 Windows C++ 编译工具链，而不是命令目标版本错误，也不是缺少 SQLite 数据库文件。
