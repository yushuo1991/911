@echo off
REM 当网络恢复后执行此脚本推送到GitHub
REM 或者手动复制下面的命令到Git Bash执行

echo ==========================================
echo 尝试推送 v4.20 到 GitHub
echo ==========================================
echo.

cd /d "%~dp0"

echo [1/3] 测试GitHub连接...
ping -n 2 github.com
if %ERRORLEVEL% NEQ 0 (
    echo ❌ GitHub无法访问
    pause
    exit /b 1
)
echo ✅ GitHub可访问
echo.

echo [2/3] 推送代码...
git push origin main
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 推送失败
    echo.
    echo 可能的原因:
    echo   1. 网络仍不稳定
    echo   2. 需要等待几分钟后重试
    echo   3. 使用下面的服务器直接部署命令
    echo.
    pause
    exit /b 1
)
echo ✅ 推送成功
echo.

echo [3/3] 显示最新commit...
git log --oneline -3
echo.

echo ==========================================
echo ✅ GitHub推送完成！
echo ==========================================
echo.
echo 现在可以在服务器执行:
echo   cd /www/wwwroot/stock-tracker
echo   git pull origin main
echo   docker compose down
echo   docker compose build
echo   docker compose up -d
echo.
pause
