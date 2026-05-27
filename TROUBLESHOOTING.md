# Mercury 开发环境问题排查

## 常见问题

### 1. 端口被占用：Port 5173 is in use

**现象**：
```
Port 5173 is in use, trying another one...
➜  Local:   http://localhost:5174/
```

**原因**：
- 之前运行的 Vite 开发服务器还在后台运行
- 其他程序占用了 5173 端口

**解决方案**：

#### 方案 A：使用改进后的启动脚本（推荐）
```bash
./dev.sh
```
脚本会自动检测 Vite 实际使用的端口并配置 Electron。

#### 方案 B：手动指定端口
```bash
# 终端 1：启动 Vite（会自动使用 5174）
npm run dev

# 终端 2：指定 Vite 地址启动 Electron
VITE_DEV_SERVER_URL=http://localhost:5174 npm run dev:electron
```

#### 方案 C：停止占用端口的进程
```bash
# 查找占用 5173 端口的进程
lsof -ti:5173 -sTCP:LISTEN

# 停止该进程（替换 PID）
kill <PID>

# 重新启动
./dev.sh
```

### 2. Electron 窗口空白

**可能原因**：
1. Vite 开发服务器未启动
2. 端口不匹配
3. 主进程代码未重新编译

**解决方案**：
```bash
# 1. 确保 Vite 正在运行
npm run dev

# 2. 重新编译主进程
npm run build:main

# 3. 启动 Electron
npm run dev:electron
```

### 3. 修改代码后不生效

**Vue 组件修改**：
- Vite 支持热更新（HMR），保存后自动刷新
- 如果未生效，在 Electron 窗口按 `Ctrl+R` 刷新

**主进程代码修改**：
```bash
# 需要重新编译并重启 Electron
npm run build:main
npm run dev:electron
```

### 4. 依赖安装失败

**现象**：
```
npm ERR! code ELIFECYCLE
```

**解决方案**：
```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install
```

### 5. TypeScript 编译错误

**现象**：
```
error TS2307: Cannot find module 'xxx'
```

**解决方案**：
```bash
# 安装缺失的类型定义
npm install --save-dev @types/xxx

# 或者在 tsconfig.json 中添加 skipLibCheck
```

## 开发流程最佳实践

### 推荐工作流

```bash
# 1. 启动开发环境（一条命令搞定）
./dev.sh

# 2. 修改代码
# - Vue 组件：保存后自动热更新
# - 主进程代码：需要重新编译

# 3. 停止开发环境
# Ctrl+C 停止脚本，会自动清理进程
```
### 分步工作流（调试时使用）

```bash
# 终端 1：启动 Vite
npm run dev

# 终端 2：启动 Electron
npm run build:main
npm run dev:electron

# 修改主进程代码后
# 在终端 2 按 Ctrl+C 停止 Electron
npm run build:main
npm run dev:electron
```

## 调试技巧

### 1. 查看 Vite 日志
Vite 的日志会显示在启动它的终端中，包括：
- 端口信息
- 热更新日志
- 编译错误

### 2. 查看 Electron 控制台
Electron 窗口会自动打开 DevTools，可以查看：
- 渲染进程的 console.log
- 网络请求
- Vue DevTools（需要安装扩展）

### 3. 查看主进程日志
主进程的 console.log 会输出到启动 Electron 的终端。

### 4. 检查进程状态
```bash
# 查看 Node 进程
ps aux | grep node

# 查看端口占用
lsof -i:5173
lsof -i:5174

# 查看 Electron 进程
ps aux | grep electron
```

## 构建和打包

### 开发构建
```bash
npm run build
```
生成的文件在 `dist/` 目录。

### 生产打包（待实现）
```bash
# 将在后续周次实现
npm run package
```

## 环境变量

### VITE_DEV_SERVER_URL
指定 Vite 开发服务器地址：
```bash
VITE_DEV_SERVER_URL=http://localhost:5174 npm run dev:electron
```

### NODE_ENV
```bash
# 开发模式（默认）
NODE_ENV=development npm run dev

# 生产模式
NODE_ENV=production npm run build
```

## 获取帮助

如果遇到其他问题：
1. 查看 GitHub Issues：https://github.com/Yinch-pan/Mercury/issues
2. 查看项目文档：README.md, INIT.md, DEMO_GUIDE.md
3. 联系项目负责人：潘飞扬
