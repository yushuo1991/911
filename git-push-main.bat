@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在推送到 GitHub...
git push origin main
if %errorlevel% == 0 (
    echo.
    echo ✓ 推送成功！
) else (
    echo.
    echo ✗ 推送失败，错误代码: %errorlevel%
)
pause



