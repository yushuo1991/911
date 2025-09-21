@echo off
chcp 65001 >nul
echo ==========================================
echo 服务器部署状态检查
echo 目标服务器: 107.173.154.147
echo ==========================================

echo.
echo 🔍 1. 检查本地应用状态
echo 本地3000端口监听:
netstat -ano | findstr :3000
if %errorlevel% neq 0 (
    echo ❌ 本地3000端口未监听
) else (
    echo ✅ 本地3000端口正在监听
)

echo.
echo 🔍 2. 测试本地应用访问
curl -s -o nul -w "HTTP状态码: %%{http_code}" http://localhost:3000
echo.

echo.
echo 🔍 3. 测试服务器IP访问
echo 测试外部访问 107.173.154.147:
curl -s -o nul -w "HTTP状态码: %%{http_code}" http://107.173.154.147 --connect-timeout 10
echo.

echo.
echo 📋 问题诊断:
echo ==========================================
echo 如果本地访问正常但服务器访问502，说明:
echo.
echo ❌ 问题原因:
echo    1. 当前应用只在本地运行，服务器上没有运行应用
echo    2. 需要在实际服务器 107.173.154.147 上部署应用
echo    3. 宝塔面板中的应用可能未启动或配置错误
echo.
echo ✅ 解决方案:
echo    1. 登录服务器 107.173.154.147
echo    2. 在服务器上运行相同的启动命令
echo    3. 或通过宝塔面板管理应用启动
echo    4. 确保服务器上的应用监听在0.0.0.0:3000而不是localhost:3000
echo.
echo 🔧 服务器部署命令:
echo    ssh root@107.173.154.147
echo    cd /www/wwwroot/stock-tracker
echo    npm install
echo    npm run build
echo    npm run start
echo.
echo 🎯 宝塔面板检查:
echo    访问: http://107.173.154.147:8888
echo    检查: Node.js项目管理 -^> stock-tracker 状态
echo    确认: 应用是否正在运行
echo    配置: 确保监听地址为 0.0.0.0:3000
echo.
echo ==========================================
pause