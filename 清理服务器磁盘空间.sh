#!/bin/bash

# 服务器磁盘空间清理脚本
# 使用方法：ssh到服务器后运行此脚本

echo "=========================================="
echo "  服务器磁盘空间清理脚本"
echo "=========================================="
echo ""

# 1. 查看当前磁盘使用情况
echo "1. 当前磁盘使用情况："
echo "--------------------------------------"
df -h
echo ""

# 2. 查看哪些目录占用最多空间
echo "2. 查找大文件（>100MB）："
echo "--------------------------------------"
find /www/wwwroot/stock-tracker -type f -size +100M -exec ls -lh {} \; 2>/dev/null | head -20
echo ""

# 3. 清理 npm 缓存
echo "3. 清理 npm 缓存..."
echo "--------------------------------------"
npm cache clean --force
echo "✓ npm 缓存已清理"
echo ""

# 4. 清理项目中的 node_modules（如果需要）
echo "4. 清理 node_modules..."
echo "--------------------------------------"
cd /www/wwwroot/stock-tracker || cd ~/stock-tracker || cd /home/stock-tracker
if [ -d "node_modules" ]; then
  echo "发现 node_modules 目录，大小："
  du -sh node_modules
  read -p "是否清理 node_modules？(y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf node_modules
    echo "✓ node_modules 已清理"
  fi
else
  echo "未发现 node_modules 目录"
fi
echo ""

# 5. 清理 .next 构建缓存
echo "5. 清理 .next 构建缓存..."
echo "--------------------------------------"
if [ -d ".next" ]; then
  du -sh .next
  rm -rf .next
  echo "✓ .next 已清理"
else
  echo "未发现 .next 目录"
fi
echo ""

# 6. 清理备份文件
echo "6. 清理旧备份..."
echo "--------------------------------------"
if [ -d "backup" ]; then
  echo "备份目录大小："
  du -sh backup
  # 只保留最近3个备份
  cd backup
  ls -t | tail -n +4 | xargs rm -rf 2>/dev/null
  cd ..
  echo "✓ 旧备份已清理（保留最近3个）"
else
  echo "未发现 backup 目录"
fi
echo ""

# 7. 清理系统日志（需要root权限）
echo "7. 清理系统日志..."
echo "--------------------------------------"
if [ "$EUID" -eq 0 ]; then
  journalctl --vacuum-time=7d 2>/dev/null
  echo "✓ 系统日志已清理"
else
  echo "⚠ 需要root权限才能清理系统日志"
  echo "  可以手动运行: sudo journalctl --vacuum-time=7d"
fi
echo ""

# 8. 清理 PM2 日志
echo "8. 清理 PM2 日志..."
echo "--------------------------------------"
if command -v pm2 > /dev/null; then
  pm2 flush
  echo "✓ PM2 日志已清理"
else
  echo "未安装 PM2"
fi
echo ""

# 9. 清理 Git 垃圾
echo "9. 清理 Git 仓库..."
echo "--------------------------------------"
cd /www/wwwroot/stock-tracker || cd ~/stock-tracker || cd /home/stock-tracker
if [ -d ".git" ]; then
  # 删除 Git 锁文件（如果存在）
  rm -f .git/index.lock
  rm -f .git/*.lock
  
  # 运行 Git 垃圾回收
  git gc --aggressive --prune=now
  echo "✓ Git 仓库已清理"
else
  echo "未发现 .git 目录"
fi
echo ""

# 10. 最终磁盘使用情况
echo "=========================================="
echo "  清理完成！当前磁盘使用情况："
echo "=========================================="
df -h
echo ""

echo "建议："
echo "1. 如果磁盘使用率仍然>90%，考虑升级服务器磁盘"
echo "2. 定期运行此脚本清理磁盘"
echo "3. 考虑将日志文件定期归档到其他存储"




