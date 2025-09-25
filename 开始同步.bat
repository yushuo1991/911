@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 Stock Tracker GitHub同步开始
echo ========================================
echo.

cd /d "%~dp0"

echo [步骤1] 检查Git环境...
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git未安装，请先安装Git
    echo 下载地址: https://git-scm.com/download/win
    pause
    exit /b 1
)
echo ✅ Git环境正常

echo.
echo [步骤2] 初始化Git仓库...
if not exist ".git" (
    git init
    echo ✅ Git仓库初始化完成
) else (
    echo ✅ Git仓库已存在
)

echo.
echo [步骤3] 配置Git用户信息...
git config user.name "Stock Tracker Admin"
git config user.email "admin@stock-tracker.com"
echo ✅ Git用户信息配置完成

echo.
echo [步骤4] 添加所有文件到Git...
git add .
echo ✅ 文件添加完成

echo.
echo [步骤5] 创建首次提交...
git commit -m "🚀 首次提交: Stock Tracker自动同步配置" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  没有新的文件变更，跳过提交
) else (
    echo ✅ 提交创建完成
)

echo.
echo [步骤6] 设置主分支...
git branch -M main
echo ✅ 主分支设置完成

echo.
echo ========================================
echo 📋 下一步操作指南
echo ========================================
echo.
echo 1. 在GitHub创建新仓库:
echo    - 访问: https://github.com/new
echo    - 仓库名: stock-tracker
echo    - 不要勾选"Add a README file"
echo.
echo 2. 复制仓库地址后，运行以下命令:
echo    git remote add origin [你的仓库地址]
echo    git push -u origin main
echo.
echo 3. 或者直接运行: 推送到GitHub.bat
echo.
echo ========================================
echo 🎯 准备完成！按任意键继续...
echo ========================================
pause