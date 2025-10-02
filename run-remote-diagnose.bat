@echo off
chcp 65001 >nul
echo ================================
echo 远程部署诊断执行器
echo ================================
echo.

REM 上传诊断脚本到服务器
echo 📤 上传诊断脚本到服务器...
scp diagnose-deployment.sh root@yushuo.click:/www/wwwroot/stock-tracker/
if errorlevel 1 (
    echo ❌ 上传失败！
    pause
    exit /b 1
)
echo ✅ 上传成功
echo.

REM 远程执行诊断脚本
echo 🔍 执行远程诊断...
echo.
ssh root@yushuo.click "cd /www/wwwroot/stock-tracker && chmod +x diagnose-deployment.sh && ./diagnose-deployment.sh" > diagnostic-report-20250930.txt 2>&1
if errorlevel 1 (
    echo ⚠️ 诊断执行可能有错误，但已保存报告
) else (
    echo ✅ 诊断执行完成
)
echo.

REM 显示报告
echo 📋 诊断报告已保存到: diagnostic-report-20250930.txt
echo.
echo 正在显示报告内容...
echo ================================
type diagnostic-report-20250930.txt
echo ================================
echo.

echo 💾 报告已保存到本地: diagnostic-report-20250930.txt
echo.
pause