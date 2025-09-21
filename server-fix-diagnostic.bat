@echo off
chcp 65001 >nul
echo ==========================================
echo 服务器502错误诊断和修复脚本
echo 服务器IP: 107.173.154.147
echo ==========================================

echo.
echo 📊 1. 检查当前Node.js进程状态
tasklist | findstr node.exe
echo.

echo 📊 2. 检查3000端口监听状态
netstat -ano | findstr :3000
if %errorlevel% neq 0 (
    echo ❌ 端口3000未被监听 - 这是502错误的原因
) else (
    echo ✅ 端口3000正在监听
)
echo.

echo 📊 3. 检查项目目录结构
if exist "package.json" (
    echo ✅ package.json 存在
) else (
    echo ❌ package.json 不存在
)

if exist ".next" (
    echo ✅ .next 构建目录存在
) else (
    echo ❌ .next 构建目录不存在 - 需要构建项目
)

if exist "node_modules" (
    echo ✅ node_modules 存在
) else (
    echo ❌ node_modules 不存在 - 需要安装依赖
)
echo.

echo 📊 4. 检查环境配置
if exist ".env.local" (
    echo ✅ .env.local 存在
    echo 📋 环境变量内容:
    type .env.local | findstr /v "TOKEN"
) else (
    echo ❌ .env.local 不存在
)
echo.

echo 🔧 5. 修复步骤开始...

echo 步骤1: 停止所有Node.js进程
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo table /nh') do (
    echo 正在停止进程 %%i
    taskkill /pid %%i /f >nul 2>&1
)
echo ✅ 已停止所有Node.js进程

echo.
echo 步骤2: 检查并安装依赖
if not exist "node_modules" (
    echo 📦 安装项目依赖...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
) else (
    echo ✅ 依赖已存在，跳过安装
)

echo.
echo 步骤3: 构建项目
if not exist ".next" (
    echo 🔨 构建Next.js项目...
    npm run build
    if %errorlevel% neq 0 (
        echo ❌ 项目构建失败
        pause
        exit /b 1
    )
    echo ✅ 项目构建完成
) else (
    echo 🔨 重新构建项目以确保最新状态...
    npm run build
    echo ✅ 项目重新构建完成
)

echo.
echo 步骤4: 启动应用
echo 🚀 启动Node.js应用...
start /b npm run start

echo.
echo 等待应用启动...
timeout /t 10 /nobreak >nul

echo.
echo 📊 6. 验证修复结果
echo 检查3000端口监听状态:
netstat -ano | findstr :3000
if %errorlevel% neq 0 (
    echo ❌ 应用启动失败，端口3000仍未监听
    echo.
    echo 🔍 诊断信息:
    echo 请检查控制台输出的错误信息
    echo 常见问题:
    echo 1. 环境变量配置错误
    echo 2. 数据库连接失败
    echo 3. 端口被占用
    echo 4. 权限问题
    pause
    exit /b 1
) else (
    echo ✅ 应用启动成功，端口3000正在监听
)

echo.
echo 测试本地访问:
curl -s http://127.0.0.1:3000 >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 本地访问失败
) else (
    echo ✅ 本地访问成功
)

echo.
echo ==========================================
echo 🎉 修复完成！
echo ==========================================
echo.
echo 📱 访问地址:
echo • 服务器IP: http://107.173.154.147
echo • 本地测试: http://127.0.0.1:3000
echo • API测试: http://107.173.154.147/api/stocks
echo.
echo 🔧 如果仍有问题，请检查:
echo 1. 宝塔面板中的网站配置
echo 2. Nginx反向代理设置
echo 3. 防火墙端口开放情况
echo 4. 应用日志错误信息
echo.
echo 按任意键退出...
pause >nul