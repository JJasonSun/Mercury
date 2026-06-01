# Windows C++ Build Tools 安装结果

日期：2026-06-01

## 使用的命令

```powershell
winget install --id Microsoft.VisualStudio.2022.BuildTools --exact --source winget --accept-package-agreements --accept-source-agreements --override "--quiet --wait --norestart --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```

## 结果

安装成功完成。

检测到安装路径：

```text
C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools
```

## 安装后的重建结果

安装工具链后，重新执行以下命令：

```powershell
npx electron-builder install-app-deps
```

失败原因从“找不到 Visual Studio”变成了 `better-sqlite3` 针对 Electron `42.3.0` 头文件编译时的 C++ 源码/API 错误：

```text
executing @electron/rebuild electronVersion=42.3.0 arch=x64
preparing moduleName=better-sqlite3 arch=x64
better_sqlite3.cpp
error C2668: v8::Template::SetNativeDataProperty: ambiguous call
error C2660: v8::External::Value: function does not take 0 arguments
error C2660: v8::External::New: function does not take 2 arguments
MSBuild.exe failed with exit code: 1
```

## 含义

缺少 C++ 工具链的问题已经解决。当前剩余问题是 `better-sqlite3@12.10.0` 与 Electron `42.3.0` 自带的 V8/Node 头文件之间存在兼容性问题。

Electron `42.3.0` 对应 ABI `146`。现在该依赖已经能够进入针对该目标的本地编译阶段，但其 C++ 代码无法通过当前 Electron/V8 API 的编译。
