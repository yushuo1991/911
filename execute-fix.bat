@echo off
chcp 65001 >nul
echo ================================
echo 🚀 执行一键修复
echo ================================
echo.

echo 📤 步骤1: 上传修复脚本到服务器...
scp one-click-fix.sh root@yushuo.click:/www/wwwroot/stock-tracker/
if errorlevel 1 (
    echo ❌ 上传失败！
    pause
    exit /b 1
)
echo ✅ 上传成功
echo.

echo 🔧 步骤2: 执行修复脚本...
echo ⚠️ 这将重建Docker容器，预计需要3-5分钟
echo.
set /p confirm=确认执行？(Y/N):
if /i not "%confirm%"=="Y" (
    echo 已取消
    pause
    exit /b 0
)
echo.

echo 🚀 开始执行修复...
echo.
ssh root@yushuo.click "cd /www/wwwroot/stock-tracker && chmod +x one-click-fix.sh && ./one-click-fix.sh" > fix-result-20250930.txt 2>&1

echo.
echo ================================
echo 📋 修复结果
echo ================================
type fix-result-20250930.txt
echo ================================
echo.

echo 💾 完整日志已保存到: fix-result-20250930.txt
echo.

echo 🌐 下一步操作:
echo 1. 在浏览器中打开 https://yushuo.click/stock
echo 2. 按 Ctrl+Shift+R 强制刷新
echo 3. 检查是否显示新版本
echo.

pause