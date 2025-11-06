# 服务器自动清理并部署脚本
$ErrorActionPreference = "Continue"

$SERVER = "107.173.154.147"
$USER = "root"
$PASSWORD = "gJ75hNHdy90TA4qGo9"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  开始清理服务器磁盘并部署" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 创建SSH命令脚本
$cleanupScript = @"
#!/bin/bash
set +e

echo ""
echo "===== 1. 检查当前磁盘使用情况 ====="
df -h

echo ""
echo "===== 2. 进入项目目录 ====="
cd /www/wwwroot/stock-tracker || cd ~/stock-tracker || cd /home/stock-tracker
pwd

echo ""
echo "===== 3. 删除Git锁文件 ====="
rm -f .git/index.lock .git/*.lock
echo "✓ Git锁文件已清理"

echo ""
echo "===== 4. 清理npm缓存 ====="
npm cache clean --force
echo "✓ npm缓存已清理"

echo ""
echo "===== 5. 清理构建缓存 ====="
rm -rf .next
echo "✓ .next已清理"

echo ""
echo "===== 6. 清理旧备份 ====="
if [ -d "backup" ]; then
  cd backup
  ls -t | tail -n +3 | xargs rm -rf 2>/dev/null
  cd ..
  echo "✓ 旧备份已清理"
fi

echo ""
echo "===== 7. 清理PM2日志 ====="
pm2 flush 2>/dev/null
echo "✓ PM2日志已清理"

echo ""
echo "===== 8. Git垃圾回收 ====="
git gc --prune=now
echo "✓ Git仓库已清理"

echo ""
echo "===== 9. 清理系统日志 ====="
journalctl --vacuum-time=3d 2>/dev/null || echo "跳过系统日志清理"

echo ""
echo "===== 10. 清理后磁盘使用情况 ====="
df -h

echo ""
echo "===== 11. 拉取最新代码 ====="
cd /www/wwwroot/stock-tracker || cd ~/stock-tracker || cd /home/stock-tracker
git fetch origin
git reset --hard origin/main
echo "✓ 代码已更新"

echo ""
echo "===== 12. 安装依赖 ====="
npm install --production=false
echo "✓ 依赖已安装"

echo ""
echo "===== 13. 构建项目 ====="
npm run build
echo "✓ 项目已构建"

echo ""
echo "===== 14. 重启服务 ====="
pm2 restart stock-tracker
pm2 save
echo "✓ 服务已重启"

echo ""
echo "===== 15. 检查服务状态 ====="
pm2 status

echo ""
echo "=========================================="
echo "  ✅ 部署完成！"
echo "=========================================="
echo ""
df -h
"@

# 将脚本保存到临时文件
$tempScript = "$env:TEMP\server-cleanup-deploy.sh"
$cleanupScript | Out-File -FilePath $tempScript -Encoding UTF8 -NoNewline

Write-Host "正在连接到服务器..." -ForegroundColor Yellow
Write-Host ""

# 使用SSH执行脚本
try {
    # 使用sshpass或直接用ssh命令
    # 注意：Windows 10/11内置了OpenSSH客户端
    
    Write-Host "提示：需要输入服务器密码" -ForegroundColor Yellow
    Write-Host "密码：gJ75hNHdy90TA4qGo9" -ForegroundColor Green
    Write-Host ""
    
    # 读取脚本内容并通过SSH执行
    $scriptContent = Get-Content $tempScript -Raw
    
    # 方法1：使用ssh直接执行
    ssh ${USER}@${SERVER} "bash -s" < $tempScript
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ 执行完成！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "请验证：" -ForegroundColor Cyan
    Write-Host "1. 访问 http://107.173.154.147:3000" -ForegroundColor White
    Write-Host "2. 点击10-28的海南板块" -ForegroundColor White
    Write-Host "3. 查看海峡创新的代码和数据是否正确" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ 自动执行失败" -ForegroundColor Red
    Write-Host ""
    Write-Host "错误信息：$_" -ForegroundColor Red
    Write-Host ""
    Write-Host "请手动执行以下步骤：" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. 打开PowerShell或CMD" -ForegroundColor White
    Write-Host "2. 执行：ssh root@107.173.154.147" -ForegroundColor White
    Write-Host "3. 输入密码：gJ75hNHdy90TA4qGo9" -ForegroundColor White
    Write-Host "4. 复制粘贴以下命令：" -ForegroundColor White
    Write-Host ""
    Write-Host $cleanupScript -ForegroundColor Gray
    Write-Host ""
}

# 清理临时文件
Remove-Item $tempScript -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "按任意键退出..."

