@echo off
chcp 65001 >nul
echo ==========================================
echo 502 Bad Gateway 错误快速修复脚本
echo ==========================================
echo.

echo [问题分析]
echo 502错误表示: Nginx无法连接到后端应用
echo 可能原因:
echo 1. Docker容器未启动或崩溃
echo 2. 应用端口未监听（Next.js未运行在3000端口）
echo 3. Nginx配置错误
echo 4. 构建失败导致容器无法启动
echo.

echo ==========================================
echo 开始自动修复...
echo ==========================================
echo.

echo [步骤1/6] 检查Docker容器状态
ssh root@yushuo.click "cd /www/wwwroot/stock-tracker && docker compose ps"
echo.

echo [步骤2/6] 查看应用日志（最近50行）
ssh root@yushuo.click "cd /www/wwwroot/stock-tracker && docker compose logs --tail=50"
echo.

echo [步骤3/6] 停止所有服务
ssh root@yushuo.click "cd /www/wwwroot/stock-tracker && docker compose down"
echo.

echo [步骤4/6] 拉取最新代码
ssh root@yushuo.click "cd /www/wwwroot/stock-tracker && git pull origin main"
echo.

echo [步骤5/6] 重新构建并启动（无缓存）
ssh root@yushuo.click "cd /www/wwwroot/stock-tracker && docker compose build --no-cache && docker compose up -d"
echo.

echo [步骤6/6] 验证修复结果
timeout /t 10 /nobreak >nul
ssh root@yushuo.click "cd /www/wwwroot/stock-tracker && echo '=== 容器状态 ===' && docker compose ps && echo '' && echo '=== 应用日志 ===' && docker compose logs --tail=30 && echo '' && echo '=== 本地访问测试 ===' && curl -I http://localhost:3000"
echo.

echo ==========================================
echo 修复完成！
echo ==========================================
echo.
echo 请检查上方输出：
echo - 容器状态应该是 "Up"
echo - 日志中应该看到 "ready started server on"
echo - curl测试应该返回 200 OK
echo.
echo 如果仍然502，请运行以下命令手动检查：
echo ssh root@yushuo.click "cd /www/wwwroot/stock-tracker && docker compose logs -f"
echo.

pause
