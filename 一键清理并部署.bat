@echo off
chcp 65001 >nul
echo ========================================
echo   一键清理服务器磁盘并部署
echo ========================================
echo.
echo 正在连接到服务器...
echo 服务器: 107.173.154.147
echo.
echo ----------------------------------------
echo 即将执行的操作：
echo 1. 清理 Git 锁文件
echo 2. 清理 npm 缓存
echo 3. 清理构建缓存
echo 4. 清理旧备份
echo 5. 清理 PM2 日志
echo 6. Git 垃圾回收
echo 7. 拉取最新代码
echo 8. 安装依赖并构建
echo 9. 重启服务
echo ----------------------------------------
echo.
echo 请在SSH提示时输入密码: gJ75hNHdy90TA4qGo9
echo.
pause

ssh root@107.173.154.147 "cd /www/wwwroot/stock-tracker 2>/dev/null || cd ~/stock-tracker 2>/dev/null || cd /home/stock-tracker; echo '开始清理...'; rm -f .git/index.lock .git/*.lock; echo '✓ Git锁文件已清理'; npm cache clean --force 2>&1 | tail -1; echo '✓ npm缓存已清理'; rm -rf .next; echo '✓ 构建缓存已清理'; if [ -d 'backup' ]; then cd backup && ls -t | tail -n +3 | xargs rm -rf 2>/dev/null; cd ..; echo '✓ 旧备份已清理'; fi; pm2 flush 2>/dev/null; echo '✓ PM2日志已清理'; git gc --aggressive --prune=now 2>&1 | tail -3; echo '✓ Git仓库已清理'; journalctl --vacuum-time=3d 2>/dev/null | tail -1; echo '===== 清理后磁盘使用情况 ====='; df -h | grep -E 'Filesystem|/$|/www'; echo ''; echo '开始部署...'; git fetch origin 2>&1 | tail -2; git reset --hard origin/main 2>&1 | tail -1; echo '✓ 代码已更新'; npm install 2>&1 | tail -3; echo '✓ 依赖已安装'; npm run build 2>&1 | tail -5; echo '✓ 构建完成'; pm2 restart stock-tracker 2>&1; pm2 save 2>&1 | tail -1; echo ''; echo '========================================'; echo '  ✅ 部署完成！'; echo '========================================'; pm2 status"

echo.
echo ========================================
echo   脚本执行完成
echo ========================================
echo.
echo 请查看上面的输出，确认：
echo - 磁盘使用率是否降低
echo - PM2 状态是否为 online
echo.
pause
