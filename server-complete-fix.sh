#!/bin/bash

echo "========================================"
echo "股票追踪系统完整修复脚本"
echo "========================================"

# 检查当前位置
pwd
echo "当前工作目录: $(pwd)"

# 停止所有相关进程
echo "步骤1: 清理进程"
pm2 delete all 2>/dev/null || true
pkill -f "next start" 2>/dev/null || true
pkill -f ":3000" 2>/dev/null || true

# 检查端口
echo "步骤2: 检查端口3000"
netstat -tulpn | grep :3000

# 设置npm配置
echo "步骤3: 配置npm"
npm config set registry https://registry.npmjs.org/

# 安装依赖
echo "步骤4: 安装依赖"
npm install

# 构建应用
echo "步骤5: 构建应用"
npm run build

# 检查构建结果
echo "步骤6: 检查构建输出"
ls -la .next/

# 直接启动应用（不使用PM2）
echo "步骤7: 启动应用"
echo "使用 npm start 启动应用..."

# 等待5秒
sleep 5 &

# 启动应用
npm start &

# 等待应用启动
sleep 10

# 测试应用
echo "步骤8: 测试应用"
curl -s -o /dev/null -w "首页状态码: %{http_code}\n" http://localhost:3000/
curl -s -o /dev/null -w "API状态码: %{http_code}\n" http://localhost:3000/api/cron

echo "========================================"
echo "修复完成！"
echo "========================================"
echo "如果API状态码是200，说明修复成功！"
echo "访问地址: http://bk.yushuo.click"