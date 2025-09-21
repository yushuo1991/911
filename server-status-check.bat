@echo off
echo ========================================
echo 股票追踪系统状态检查
echo ========================================

echo 1. 检查PM2状态:
pm2 list

echo.
echo 2. 检查端口3000:
netstat -an | findstr ":3000"

echo.
echo 3. 测试首页访问:
curl -s -o nul -w "状态码: %%{http_code}" http://localhost:3000/

echo.
echo 4. 测试API访问:
curl -s -o nul -w "状态码: %%{http_code}" http://localhost:3000/api/cron

echo.
echo 5. 检查应用进程:
tasklist | findstr "node"

echo.
echo ========================================
echo 检查完成
echo ========================================