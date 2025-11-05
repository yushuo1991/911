#!/bin/bash

echo "🔧 开始综合修复生产环境..."

# 1. 停止并移除当前容器
echo "⏹️ 停止当前容器..."
ssh root@107.173.154.147 "docker stop stock-app || true"
ssh root@107.173.154.147 "docker rm stock-app || true"

# 2. 重新创建容器
echo "🆕 重新创建容器..."
ssh root@107.173.154.147 "docker run -d --name stock-app -p 3000:3000 node:18-alpine sh -c 'sleep infinity'"

# 3. 设置基础环境
echo "⚙️ 设置基础环境..."
ssh root@107.173.154.147 "docker exec stock-app sh -c 'apk add --no-cache git && mkdir -p /app && cd /app && npm init -y'"

# 4. 安装基础依赖
echo "📦 安装基础依赖..."
ssh root@107.173.154.147 "docker exec stock-app sh -c 'cd /app && npm install next@14.2.32 react@18 react-dom@18 typescript @types/node @types/react @types/react-dom tailwindcss postcss autoprefixer'"

echo "🏁 基础环境准备完成，准备传输文件..."