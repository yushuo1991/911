@echo off
echo ====================================
echo 服务器部署问题诊断脚本
echo ====================================
echo.

echo 正在连接服务器进行问题诊断...
echo.

echo 步骤1: 检查当前Git状态
ssh root@yushuo.click "cd /www/wwwroot/stock-tracker && echo '=== Git状态检查 ===' && git status && echo '' && git log --oneline -3"

echo.
echo 步骤2: 检查远程仓库连接
ssh root@yushuo.click "cd /www/wwwroot/stock-tracker && echo '=== 远程仓库检查 ===' && git remote -v && echo '' && git branch -a"

echo.
echo 步骤3: 尝试拉取最新代码
ssh root@yushuo.click "cd /www/wwwroot/stock-tracker && echo '=== 拉取代码 ===' && git pull origin main"

echo.
echo 步骤4: 检查代码是否有变更
ssh root@yushuo.click "cd /www/wwwroot/stock-tracker && echo '=== 代码变更检查 ===' && git status && git diff --name-only HEAD~1"

echo.
echo 步骤5: 检查Docker状态
ssh root@yushuo.click "cd /www/wwwroot/stock-tracker && echo '=== Docker状态检查 ===' && docker compose ps"

echo.
echo 步骤6: 清理Docker系统
ssh root@yushuo.click "cd /www/wwwroot/stock-tracker && echo '=== 清理Docker缓存 ===' && docker system prune -f && docker volume prune -f"

echo.
echo 步骤7: 重新构建镜像（带详细输出）
ssh root@yushuo.click "cd /www/wwwroot/stock-tracker && echo '=== 重新构建Docker镜像 ===' && docker compose build --no-cache --progress=plain"

echo.
echo 步骤8: 启动服务
ssh root@yushuo.click "cd /www/wwwroot/stock-tracker && echo '=== 启动Docker服务 ===' && docker compose up -d"

echo.
echo 步骤9: 检查服务状态和日志
ssh root@yushuo.click "cd /www/wwwroot/stock-tracker && echo '=== 检查服务状态 ===' && docker compose ps && echo '' && echo '=== 检查服务日志 ===' && docker compose logs --tail=20"

echo.
echo 步骤10: 检查网站是否可访问
ssh root@yushuo.click "cd /www/wwwroot/stock-tracker && echo '=== 检查网站访问 ===' && curl -I http://localhost:3000 || echo '本地访问失败' && curl -I http://bk.yushuo.click || echo '外网访问失败'"

echo.
echo ====================================
echo 诊断完成！
echo ====================================
echo.
echo 请检查上述输出中的错误信息：
echo 1. Git拉取是否有错误
echo 2. Docker构建是否成功
echo 3. 服务是否正常启动
echo 4. 网站是否可访问
echo.
pause