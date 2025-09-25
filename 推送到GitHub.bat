@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 推送项目到GitHub
echo ========================================
echo.

cd /d "%~dp0"

echo 请输入你的GitHub用户名:
set /p GITHUB_USER=用户名:

echo.
echo 你的仓库地址将会是:
echo https://github.com/%GITHUB_USER%/stock-tracker.git
echo.
echo 确认无误请按任意键继续，否则关闭窗口重新运行...
pause

echo.
echo [步骤1] 添加远程仓库...
git remote remove origin >nul 2>&1
git remote add origin https://github.com/%GITHUB_USER%/stock-tracker.git
echo ✅ 远程仓库配置完成

echo.
echo [步骤2] 检查并添加最新文件...
git add .
git status

echo.
echo [步骤3] 创建新提交（如有变更）...
git commit -m "📦 更新: 添加GitHub自动同步配置" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  没有新的变更，使用现有提交
) else (
    echo ✅ 新提交已创建
)

echo.
echo [步骤4] 推送到GitHub...
echo 注意：如果是第一次推送，需要输入GitHub用户名和密码
echo （密码使用Personal Access Token）
echo.
git push -u origin main

if errorlevel 1 (
    echo.
    echo ❌ 推送失败！可能的原因：
    echo 1. 仓库不存在 - 请先在GitHub创建仓库
    echo 2. 认证失败 - 检查用户名和密码/Token
    echo 3. 网络问题 - 检查网络连接
    echo.
    echo 🔧 解决方案：
    echo 1. 访问 https://github.com/new 创建仓库
    echo 2. 获取Personal Access Token:
    echo    GitHub → Settings → Developer settings → Personal access tokens
    echo 3. 重新运行此脚本
    pause
    exit /b 1
)

echo.
echo ========================================
echo 🎉 GitHub推送成功！
echo ========================================
echo.
echo 📍 你的仓库地址:
echo https://github.com/%GITHUB_USER%/stock-tracker
echo.
echo 📋 下一步：配置自动部署
echo 1. 运行服务器配置: 配置服务器.bat
echo 2. 或手动上传 一键执行.sh 到服务器
echo.
pause