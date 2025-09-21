@echo off
echo ========================================
echo 修复API路由问题
echo ========================================

echo 步骤1: 停止所有PM2进程
pm2 delete all

echo.
echo 步骤2: 清理端口3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
    echo 杀死进程 %%a
    taskkill /f /pid %%a 2>nul
)

echo.
echo 步骤3: 重新构建项目
npm run build

echo.
echo 步骤4: 使用PM2启动应用
pm2 start ecosystem.config.js --env production

echo.
echo 步骤5: 等待5秒应用启动
timeout /t 5

echo.
echo 步骤6: 检查应用状态
pm2 list
pm2 logs --lines 5

echo.
echo 步骤7: 测试API
curl -X GET "http://localhost:3000/api/cron" -H "Content-Type: application/json"

echo.
echo ========================================
echo 修复完成，检查上述测试结果
echo ========================================