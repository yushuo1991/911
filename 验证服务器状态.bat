@echo off
chcp 65001 >nul
echo ========================================
echo   验证服务器状态
echo ========================================
echo.
echo 正在连接到服务器: 107.173.154.147
echo 请输入密码: gJ75hNHdy90TA4qGo9
echo.
pause

ssh root@107.173.154.147 "echo '=== 1. 磁盘空间使用情况 ==='; df -h | grep -E 'Filesystem|/$|/www'; echo ''; echo '=== 2. PM2 应用状态 ==='; pm2 status; echo ''; echo '=== 3. 应用日志（最近20行）==='; pm2 logs stock-tracker --lines 20 --nostream; echo ''; echo '=== 4. Git 仓库状态 ==='; cd /www/wwwroot/stock-tracker 2>/dev/null || cd ~/stock-tracker; git log -1 --oneline; git status -s | head -5; echo ''; echo '=== 5. Node.js 进程 ==='; ps aux | grep node | grep -v grep | head -3; echo ''; echo '========================================'; echo '  验证完成'; echo '========================================';"

echo.
echo ========================================
echo   验证完成
echo ========================================
echo.
echo 请查看上面的输出结果
echo.
pause




