@echo off
chcp 65001 >nul
echo ========================================
echo 🧪 测试GitHub自动部署
echo ========================================
echo.

cd /d "%~dp0"

echo 当前时间: %date% %time%
echo 项目目录: %cd%
echo.

echo [检查1] 验证Git仓库状态...
git status --porcelain >nul 2>&1
if errorlevel 1 (
    echo ❌ 不是Git仓库，请先运行 开始同步.bat
    pause
    exit /b 1
)

git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo ❌ 未配置GitHub远程仓库，请先运行 推送到GitHub.bat
    pause
    exit /b 1
)
echo ✅ Git仓库状态正常

echo.
echo [检查2] 查看远程仓库信息...
for /f "tokens=*" %%i in ('git remote get-url origin') do set REPO_URL=%%i
echo 🔗 仓库地址: %REPO_URL%

for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set BRANCH=%%i
echo 🌿 当前分支: %BRANCH%

echo.
echo [检查3] 创建测试提交...
echo # 自动部署测试 >> test-deploy.txt
echo. >> test-deploy.txt
echo 测试时间: %date% %time% >> test-deploy.txt
echo 测试内容: GitHub Actions自动部署功能验证 >> test-deploy.txt

git add test-deploy.txt
git commit -m "🧪 测试自动部署 - %date% %time%" >nul 2>&1

if errorlevel 1 (
    echo ⚠️  没有新的变更，使用现有提交进行测试
) else (
    echo ✅ 测试提交已创建
)

echo.
echo [执行] 推送到GitHub触发自动部署...
echo 📤 正在推送到 %REPO_URL%...
git push origin %BRANCH%

if errorlevel 1 (
    echo ❌ 推送失败！请检查：
    echo 1. 网络连接是否正常
    echo 2. GitHub认证是否有效
    echo 3. 远程仓库是否存在
    pause
    exit /b 1
)

echo ✅ 推送成功！

echo.
echo ========================================
echo 🎯 GitHub Actions自动部署已触发
echo ========================================
echo.
echo 📋 查看部署状态:
echo 1. 访问GitHub仓库Actions页面:
set "REPO_URL=%REPO_URL:.git=%"
echo    %REPO_URL%/actions
echo.
echo 2. 查看工作流执行状态:
echo    - 🟡 黄色圆点 = 正在执行
echo    - ✅ 绿色勾号 = 部署成功
echo    - ❌ 红色叉号 = 部署失败
echo.
echo 3. 预计部署时间: 3-5分钟
echo.

echo ========================================
echo ⏰ 自动验证部署结果
echo ========================================
echo.
echo 正在等待部署完成...请稍候...
echo （预计需要3-5分钟时间）
echo.

rem 等待一段时间让部署开始
timeout /t 30 /nobreak >nul

echo 尝试验证部署结果...
echo.

echo [验证1] 测试网站访问...
curl -I -m 10 http://bk.yushuo.click >nul 2>&1
if errorlevel 1 (
    echo ⏳ 网站暂未响应，可能还在部署中...
) else (
    echo ✅ 网站访问正常！
)

echo.
echo [验证2] 测试API接口...
curl -I -m 10 http://bk.yushuo.click/api/stocks >nul 2>&1
if errorlevel 1 (
    echo ⏳ API暂未响应，可能还在部署中...
) else (
    echo ✅ API接口正常！
)

echo.
echo ========================================
echo 📊 测试结果总结
echo ========================================
echo.
echo 🚀 部署任务已成功触发
echo 📝 测试提交已推送到GitHub
echo 🔄 GitHub Actions正在执行部署
echo.
echo 📋 接下来请：
echo 1. 访问GitHub查看Actions执行状态
echo 2. 等待3-5分钟让部署完成
echo 3. 访问 http://bk.yushuo.click 验证结果
echo 4. 如有问题，查看GitHub Actions日志
echo.
echo 🎯 如果看到绿色✅表示部署成功！
echo 🔧 如果看到红色❌请查看详细日志排查问题
echo.

echo 是否立即打开GitHub Actions页面? (Y/N)
set /p OPEN_GITHUB=请选择:
if /i "%OPEN_GITHUB%"=="Y" (
    echo 正在打开GitHub Actions页面...
    start "" "%REPO_URL%/actions"
)

echo.
echo ========================================
echo 🎉 测试完成！
echo ========================================
echo.
echo 📞 如遇到问题：
echo 1. 查看 GitHub完整配置手册.md
echo 2. 运行 配置服务器.bat 重新配置
echo 3. 查看 log/故障排查手册.md
echo.
pause