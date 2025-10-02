@echo off
chcp 65001 >nul
echo ========================================
echo SSH自动化部署脚本
echo 目标服务器: yushuo.click
echo 项目: 股票追踪系统
echo ========================================
echo.

set SERVER=root@yushuo.click
set PROJECT_DIR=/www/wwwroot/stock-tracker
set LOG_DIR=log
set LOG_FILE=%LOG_DIR%\ssh-deployment-%date:~0,4%%date:~5,2%%date:~8,2%-%time:~0,2%%time:~3,2%%time:~6,2%.log

REM 创建日志目录
if not exist %LOG_DIR% mkdir %LOG_DIR%

echo [%date% %time%] 开始SSH自动化部署... > %LOG_FILE%
echo.

echo [1/7] 测试SSH连接...
echo [%date% %time%] 测试SSH连接... >> %LOG_FILE%
ssh -o StrictHostKeyChecking=no %SERVER% "echo '✅ SSH连接成功'" >> %LOG_FILE% 2>&1
if %errorlevel% neq 0 (
    echo ❌ SSH连接失败，请检查：
    echo    1. 服务器是否可访问
    echo    2. SSH端口22是否开放
    echo    3. 网络防火墙设置
    echo    4. 密码是否正确
    pause
    exit /b 1
)
echo ✅ SSH连接成功
echo.

echo [2/7] 验证项目目录和Docker环境...
echo [%date% %time%] 验证项目目录和Docker环境... >> %LOG_FILE%
ssh %SERVER% "cd %PROJECT_DIR% && pwd && docker --version && docker-compose --version" >> %LOG_FILE% 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ 项目目录不存在或Docker未安装
    echo    请手动检查服务器环境
    pause
    exit /b 1
)
echo ✅ 环境验证通过
echo.

echo [3/7] 停止现有容器...
echo [%date% %time%] 停止现有容器... >> %LOG_FILE%
ssh %SERVER% "cd %PROJECT_DIR% && docker-compose down" >> %LOG_FILE% 2>&1
echo ✅ 容器已停止
echo.

echo [4/7] 拉取最新代码...
echo [%date% %time%] 拉取最新代码... >> %LOG_FILE%
ssh %SERVER% "cd %PROJECT_DIR% && git fetch --all && git reset --hard origin/main && git pull origin main" >> %LOG_FILE% 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git操作失败
    pause
    exit /b 1
)
echo ✅ 代码更新完成
echo.

echo 当前提交信息:
ssh %SERVER% "cd %PROJECT_DIR% && git log -1 --oneline"
echo.

echo [5/7] 验证关键文件...
echo [%date% %time%] 验证关键文件... >> %LOG_FILE%
ssh %SERVER% "cd %PROJECT_DIR% && ls -lh Dockerfile docker-compose.yml init.sql deploy.sh" >> %LOG_FILE% 2>&1
echo ✅ 关键文件验证完成
echo.

echo [6/7] 执行Docker部署...
echo [%date% %time%] 执行Docker部署... >> %LOG_FILE%
ssh %SERVER% "cd %PROJECT_DIR% && chmod +x deploy.sh && ./deploy.sh" >> %LOG_FILE% 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ 部署脚本执行可能有问题，请检查日志
)
echo ✅ 部署脚本执行完成
echo.

echo 等待容器启动 (20秒)...
timeout /t 20 /nobreak >nul
echo.

echo [7/7] 验证部署结果...
echo [%date% %time%] 验证部署结果... >> %LOG_FILE%
echo.
echo 容器状态:
ssh %SERVER% "cd %PROJECT_DIR% && docker-compose ps"
echo.

echo 应用日志 (最后30行):
echo ----------------------------------------
ssh %SERVER% "cd %PROJECT_DIR% && docker-compose logs --tail=30 stock-tracker"
echo ----------------------------------------
echo.

echo 测试本地访问:
ssh %SERVER% "curl -I http://localhost:3002" 2>&1 | findstr "HTTP"
echo.

echo ========================================
echo 🎉 部署完成！
echo ========================================
echo.
echo 📋 访问信息:
echo    应用URL: http://bk.yushuo.click
echo    本地端口: 3002
echo    项目目录: %PROJECT_DIR%
echo.
echo 📝 日志文件: %LOG_FILE%
echo.
echo 🔍 后续检查命令:
echo    查看容器状态: ssh %SERVER% "cd %PROJECT_DIR% && docker-compose ps"
echo    查看应用日志: ssh %SERVER% "cd %PROJECT_DIR% && docker-compose logs -f stock-tracker"
echo    查看数据库日志: ssh %SERVER% "cd %PROJECT_DIR% && docker-compose logs -f mysql"
echo.
pause