#!/bin/bash

# 启动 Vite 开发服务器
npm run dev &
VITE_PID=$!

# 等待 Vite 启动并获取实际端口
echo "等待 Vite 启动..."
sleep 3

# 检测 Vite 实际使用的端口
VITE_PORT=$(lsof -ti:5173 -sTCP:LISTEN 2>/dev/null || lsof -ti:5174 -sTCP:LISTEN 2>/dev/null || echo "5173")
export VITE_DEV_SERVER_URL="http://localhost:${VITE_PORT}"

echo "Vite 运行在端口: ${VITE_PORT}"

# 构建并启动 Electron
npm run dev:electron

# 清理
kill $VITE_PID 2>/dev/null
