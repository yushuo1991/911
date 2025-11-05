@echo off
echo ====================================
echo v4.8.24 部署脚本 - 个股排序优化+板块排序图表增强
echo ====================================
echo.

echo 正在部署到服务器...
echo.

REM 连接到服务器并执行部署命令
echo 步骤1: 连接服务器并拉取最新代码
ssh root@yushuo.click "cd /www/wwwroot/stock-tracker && echo '当前目录:' && pwd && echo '开始拉取代码...' && git pull origin main"

echo.
echo 步骤2: 重新构建Docker镜像
ssh root@yushuo.click "cd /www/wwwroot/stock-tracker && echo '开始构建Docker镜像...' && docker compose build --no-cache"

echo.
echo 步骤3: 重启服务
ssh root@yushuo.click "cd /www/wwwroot/stock-tracker && echo '开始重启服务...' && docker compose up -d"

echo.
echo 步骤4: 检查服务状态
ssh root@yushuo.click "cd /www/wwwroot/stock-tracker && echo '检查服务状态...' && docker compose ps"

echo.
echo ====================================
echo 部署完成！
echo ====================================
echo.
echo 新版本功能:
echo 1. 个股排序逻辑优化 - 连板排序时状态为主，涨停时间为辅
echo 2. 7天板块排序页面增强 - 无涨停显示0值
echo 3. 新增左侧板块涨停家数曲线图
echo 4. 左右分栏布局，数据可视化增强
echo.
echo 访问地址: http://bk.yushuo.click
echo.
pause