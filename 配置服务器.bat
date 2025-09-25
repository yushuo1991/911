@echo off
chcp 65001 >nul
echo ========================================
echo 🔧 配置服务器自动同步
echo ========================================
echo.

cd /d "%~dp0"

echo 请选择配置方式:
echo.
echo 1. 我有SSH工具，直接连接服务器
echo 2. 我使用宝塔面板，通过文件上传
echo 3. 查看详细配置步骤
echo.
set /p choice=请输入选择 [1-3]:

if "%choice%"=="1" goto ssh_config
if "%choice%"=="2" goto baota_config
if "%choice%"=="3" goto show_steps
goto invalid_choice

:ssh_config
echo.
echo ========================================
echo 🖥️ SSH直接配置方式
echo ========================================
echo.
echo 服务器信息:
echo IP: 107.173.154.147
echo 用户: root
echo.
echo 请在你的SSH工具中执行以下命令:
echo.
echo # 1. 连接服务器
echo ssh root@107.173.154.147
echo.
echo # 2. 进入项目目录
echo cd /www/wwwroot/stock-tracker
echo.
echo # 3. 上传并执行一键配置脚本
echo # (请先通过宝塔面板或SCP上传 一键执行.sh)
echo chmod +x 一键执行.sh
echo ./一键执行.sh
echo.
echo # 4. 复制显示的SSH私钥到GitHub Secrets
echo.
goto end_config

:baota_config
echo.
echo ========================================
echo 🌐 宝塔面板配置方式
echo ========================================
echo.
echo 步骤1: 上传文件到服务器
echo --------------------------------
echo 1. 登录宝塔面板: http://107.173.154.147:8888
echo 2. 点击【文件】菜单
echo 3. 进入目录: /www/wwwroot/stock-tracker/
echo 4. 上传以下关键文件:
echo    - 一键执行.sh
echo    - .github/workflows/deploy.yml
echo    - 所有源码文件
echo.
echo 步骤2: 执行配置脚本
echo --------------------------------
echo 1. 在宝塔面板点击【终端】
echo 2. 执行命令:
echo    cd /www/wwwroot/stock-tracker
echo    chmod +x 一键执行.sh
echo    ./一键执行.sh
echo.
echo 步骤3: 配置GitHub Secrets
echo --------------------------------
echo 1. 复制脚本显示的SSH私钥
echo 2. 在GitHub仓库设置Secrets:
echo    - SERVER_HOST: 107.173.154.147
echo    - SERVER_USER: root
echo    - SERVER_SSH_KEY: (SSH私钥内容)
echo.
goto end_config

:show_steps
echo.
echo ========================================
echo 📖 详细配置步骤文档
echo ========================================
echo.
echo 打开以下文件查看详细步骤:
echo.
echo 📄 详细操作步骤.md - 完整操作指南
echo 📄 GitHub配置截图说明.md - 图文教程
echo 📄 log/github-sync-guide.md - 部署指南
echo 📄 log/故障排查手册.md - 故障处理
echo.
echo 推荐按照 "详细操作步骤.md" 进行配置
echo.
goto end_config

:invalid_choice
echo ❌ 无效选择，请重新运行脚本
pause
exit /b 1

:end_config
echo.
echo ========================================
echo 📋 配置完成后测试步骤
echo ========================================
echo.
echo 1. 修改任意文件测试自动部署:
echo    echo "测试自动部署" ^>^> README.md
echo    git add .
echo    git commit -m "🧪 测试自动部署"
echo    git push origin main
echo.
echo 2. 查看GitHub Actions执行状态:
echo    访问你的GitHub仓库 → Actions 标签
echo.
echo 3. 验证部署结果:
echo    访问 http://bk.yushuo.click
echo.
echo 🎯 配置完成后每次推送代码都会自动部署！
echo.
pause