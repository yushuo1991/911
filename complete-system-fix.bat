@echo off
echo ========================================
echo 股票追踪系统完整修复脚本
echo ========================================

echo 步骤1: 清理所有进程和端口
pm2 delete all
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
    taskkill /f /pid %%a 2>nul
)

echo.
echo 步骤2: 设置正确的npm配置
npm config set registry https://registry.npmjs.org/

echo.
echo 步骤3: 安装依赖并构建
npm install
npm run build

echo.
echo 步骤4: 启动应用
npm start

echo.
echo ========================================
echo 修复完成！
echo ========================================
echo.
echo 请在另一个命令行窗口中运行以下命令进行测试:
echo curl http://localhost:3000/api/cron
echo.
echo 如果看到JSON响应，说明修复成功！