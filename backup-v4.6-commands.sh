#!/bin/bash
# v4.6 版本备份脚本
# 在宝塔终端中执行

echo "=========================================="
echo "开始备份 v4.6 版本"
echo "=========================================="

# 1. 创建备份目录
BACKUP_DIR="/www/backup/stock-tracker"
mkdir -p $BACKUP_DIR

# 2. 备份完整项目代码
echo "[1/5] 备份项目代码..."
cd /www/wwwroot/stock-tracker
tar -czf $BACKUP_DIR/v4.6-source-$(date +%Y%m%d-%H%M%S).tar.gz \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  .

# 3. 备份Docker镜像
echo "[2/5] 备份Docker镜像..."
docker save stock-tracker:latest | gzip > $BACKUP_DIR/v4.6-docker-image-$(date +%Y%m%d-%H%M%S).tar.gz

# 4. 备份数据库
echo "[3/5] 备份MySQL数据库..."
docker exec stock-tracker-mysql mysqldump -uroot -p123456 stock_data > $BACKUP_DIR/v4.6-database-$(date +%Y%m%d-%H%M%S).sql

# 5. 备份配置文件
echo "[4/5] 备份配置文件..."
cp /www/wwwroot/stock-tracker/docker-compose.yml $BACKUP_DIR/v4.6-docker-compose-$(date +%Y%m%d-%H%M%S).yml

# 6. 创建备份清单
echo "[5/5] 生成备份清单..."
cat > $BACKUP_DIR/v4.6-backup-info.txt <<EOF
v4.6 版本备份信息
==================

备份时间: $(date '+%Y-%m-%d %H:%M:%S')
备份位置: $BACKUP_DIR
Git提交: $(git rev-parse HEAD)
Git分支: $(git branch --show-current)

备份内容:
1. 项目代码: v4.6-source-*.tar.gz
2. Docker镜像: v4.6-docker-image-*.tar.gz
3. 数据库: v4.6-database-*.sql
4. Docker配置: v4.6-docker-compose-*.yml

版本特性:
- ✅ 修复7天阶梯弹窗使用真实API数据
- ✅ 日期点击显示涨停个股数前5名
- ✅ 板块弹窗支持连板数/涨幅排序切换
- ✅ "其他"和"ST板块"不参与7天涨停排行

恢复方法:
请参考 RESTORE-v4.6-GUIDE.md
EOF

# 7. 显示备份结果
echo ""
echo "=========================================="
echo "✅ v4.6 版本备份完成！"
echo "=========================================="
echo ""
ls -lh $BACKUP_DIR/v4.6-* | tail -10
echo ""
echo "备份位置: $BACKUP_DIR"
echo "备份清单: $BACKUP_DIR/v4.6-backup-info.txt"
