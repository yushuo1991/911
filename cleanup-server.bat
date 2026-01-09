@echo off
chcp 65001 >nul
echo ====================================
echo 服务器磁盘清理脚本
echo ====================================
echo.

echo [步骤1/5] 检查磁盘使用情况...
ssh root@107.173.154.147 "df -h"
echo.

echo [步骤2/5] 清理旧的构建文件...
ssh root@107.173.154.147 "cd /www/wwwroot/stock-tracker && rm -rf .next node_modules backup log && echo '清理完成：.next, node_modules, backup, log'"
echo.

echo [步骤3/5] 清理npm缓存...
ssh root@107.173.154.147 "npm cache clean --force && echo 'npm缓存已清理'"
echo.

echo [步骤4/5] 清理PM2日志...
ssh root@107.173.154.147 "pm2 flush && echo 'PM2日志已清理'"
echo.

echo [步骤5/5] Git垃圾回收...
ssh root@107.173.154.147 "cd /www/wwwroot/stock-tracker && git gc --aggressive --prune=now && echo 'Git垃圾回收完成'"
echo.

echo [完成] 检查清理后磁盘使用情况...
ssh root@107.173.154.147 "df -h"
echo.

echo ====================================
echo 清理完成！现在可以重新部署了
echo ====================================
pause
