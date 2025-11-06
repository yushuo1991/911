@echo off
chcp 65001 >nul
cls
color 0B

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║                                                          ║
echo ║        GitHub CLI 完全自动化部署                          ║
echo ║        （一键配置，零手动干预）                           ║
echo ║                                                          ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo 此脚本将自动完成：
echo   ✓ 安装/检查 GitHub CLI
echo   ✓ 登录 GitHub
echo   ✓ 创建 GitHub 仓库
echo   ✓ 配置 GitHub Secrets
echo   ✓ 初始化服务器环境
echo   ✓ 推送代码
echo   ✓ 触发自动部署
echo.
echo 服务器信息：
echo   IP: 107.173.154.147
echo   密码: gJ75hNHdy90TA4qGo9
echo.
pause
echo.
echo ════════════════════════════════════════════════════════════
echo   开始自动化配置...
echo ════════════════════════════════════════════════════════════
echo.

powershell.exe -ExecutionPolicy Bypass -File "%~dp0github-cli-auto-deploy.ps1"

echo.
echo ════════════════════════════════════════════════════════════
echo.
if errorlevel 1 (
    echo ✗ 配置过程中出现错误
    echo.
    echo 请查看错误信息并重试
) else (
    echo ✓ 配置完成！
    echo.
    echo 现在只需：
    echo   git add . ^&^& git commit -m "message" ^&^& git push
    echo.
    echo GitHub Actions 会自动部署到服务器！
)
echo.
pause





