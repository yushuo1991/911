@echo off
chcp 65001 >nul
echo ================================
echo 🔍 智能诊断和修复系统
echo ================================
echo.

echo 📤 上传智能修复脚本...
scp smart-fix.sh root@yushuo.click:/www/wwwroot/stock-tracker/
if errorlevel 1 (
    echo ❌ 上传失败！
    pause
    exit /b 1
)
echo ✅ 上传成功
echo.

echo 🚀 执行智能诊断...
echo 这个脚本会:
echo   1. 自动检测所有可能的问题
echo   2. 提供针对性的修复方案
echo   3. 询问是否执行修复
echo.

REM 使用交互式SSH执行
ssh -t root@yushuo.click "cd /www/wwwroot/stock-tracker && chmod +x smart-fix.sh && ./smart-fix.sh"

echo.
echo ================================
echo 📋 执行完成
echo ================================
echo.

echo 如需查看完整日志，可以SSH到服务器查看:
echo   ssh root@yushuo.click
echo   cd /www/wwwroot/stock-tracker
echo   docker compose logs -f stock-tracker
echo.

pause