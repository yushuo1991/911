@echo off
echo ===== 股票追踪系统诊断修复脚本 =====
echo 执行时间: %date% %time%
echo.

echo [1/6] 停止所有Node进程...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 >nul

echo [2/6] 清理端口占用...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3002') do taskkill /f /pid %%a >nul 2>&1

echo [3/6] 清理npm缓存...
npm cache clean --force >nul 2>&1

echo [4/6] 重新安装依赖...
npm install

echo [5/6] 启动开发服务器...
echo 正在启动服务器，请等待...
start /b npm run dev

echo [6/6] 等待服务器启动...
timeout /t 5 >nul

echo.
echo ===== 诊断完成 =====
echo 服务器状态检查:
netstat -ano | findstr :3000
echo.
echo 如果看到监听状态，请访问: http://localhost:3000
echo 日志文件位置: log/server-diagnostic.md
pause