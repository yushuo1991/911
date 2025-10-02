#!/bin/bash
# ========================================
# 完整版本备份脚本
# 版本: v4.2-stable (2025-09-30)
# ========================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
PROJECT_DIR="/www/wwwroot/stock-tracker"
BACKUP_BASE_DIR="/www/backup/stock-tracker"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_BASE_DIR}/backup_${TIMESTAMP}"
VERSION_TAG="v4.2-stable-$(date +%Y%m%d)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   股票追踪系统 - 完整备份脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}备份时间:${NC} ${TIMESTAMP}"
echo -e "${GREEN}版本标签:${NC} ${VERSION_TAG}"
echo -e "${GREEN}备份目录:${NC} ${BACKUP_DIR}"
echo ""

# 创建备份目录
echo -e "${YELLOW}▶ 步骤1: 创建备份目录...${NC}"
mkdir -p "${BACKUP_DIR}"/{code,docker,database,nginx,logs}
echo -e "${GREEN}✓ 备份目录创建成功${NC}"
echo ""

# 进入项目目录
cd "${PROJECT_DIR}"

# ========================================
# 1. Git代码备份
# ========================================
echo -e "${YELLOW}▶ 步骤2: Git代码备份...${NC}"

# 创建Git标签
echo "  创建Git版本标签: ${VERSION_TAG}"
git tag -a "${VERSION_TAG}" -m "Stable version backup - $(date '+%Y-%m-%d %H:%M:%S')"
git push origin "${VERSION_TAG}" 2>/dev/null || echo "  (Git push可能需要认证，跳过远程推送)"

# 导出完整代码
echo "  导出代码到备份目录..."
git archive --format=tar.gz --prefix=stock-tracker/ -o "${BACKUP_DIR}/code/source-${VERSION_TAG}.tar.gz" HEAD

# 记录Git信息
git log -1 --pretty=format:"Commit: %H%nAuthor: %an <%ae>%nDate: %ad%nMessage: %s%n" > "${BACKUP_DIR}/code/git-info.txt"
git branch -a > "${BACKUP_DIR}/code/branches.txt"
git remote -v > "${BACKUP_DIR}/code/remotes.txt"

echo -e "${GREEN}✓ Git代码备份完成${NC}"
echo ""

# ========================================
# 2. Docker镜像和容器备份
# ========================================
echo -e "${YELLOW}▶ 步骤3: Docker备份...${NC}"

# 保存容器状态
echo "  记录容器状态..."
docker compose ps > "${BACKUP_DIR}/docker/containers-status.txt"
docker compose config > "${BACKUP_DIR}/docker/docker-compose-resolved.yml"

# 导出Docker镜像
echo "  导出应用镜像..."
docker save stock-tracker-stock-tracker:latest | gzip > "${BACKUP_DIR}/docker/app-image.tar.gz"

echo "  导出MySQL镜像..."
docker save mysql:8.0 | gzip > "${BACKUP_DIR}/docker/mysql-image.tar.gz"

# 保存容器配置
docker inspect stock-tracker-app > "${BACKUP_DIR}/docker/app-container-config.json"
docker inspect stock-tracker-mysql > "${BACKUP_DIR}/docker/mysql-container-config.json"

# 复制Docker配置文件
cp docker-compose.yml "${BACKUP_DIR}/docker/"
cp Dockerfile "${BACKUP_DIR}/docker/"
cp init.sql "${BACKUP_DIR}/docker/" 2>/dev/null || echo "  (init.sql不存在，跳过)"
cp .dockerignore "${BACKUP_DIR}/docker/" 2>/dev/null || echo "  (.dockerignore不存在，跳过)"

echo -e "${GREEN}✓ Docker备份完成${NC}"
echo ""

# ========================================
# 3. 数据库备份
# ========================================
echo -e "${YELLOW}▶ 步骤4: 数据库备份...${NC}"

# 获取数据库配置
DB_ROOT_PASSWORD="root_password_2025"
DB_NAME="stock_tracker"
DB_USER="stock_user"

# 导出数据库
echo "  导出数据库: ${DB_NAME}"
docker exec stock-tracker-mysql mysqldump \
  -uroot -p${DB_ROOT_PASSWORD} \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  ${DB_NAME} | gzip > "${BACKUP_DIR}/database/${DB_NAME}-${TIMESTAMP}.sql.gz"

# 导出数据库结构（仅结构，无数据）
docker exec stock-tracker-mysql mysqldump \
  -uroot -p${DB_ROOT_PASSWORD} \
  --no-data \
  ${DB_NAME} > "${BACKUP_DIR}/database/${DB_NAME}-schema.sql"

# 统计数据库信息
docker exec stock-tracker-mysql mysql -uroot -p${DB_ROOT_PASSWORD} -e "
SELECT
  TABLE_NAME as 'Table',
  TABLE_ROWS as 'Rows',
  ROUND(DATA_LENGTH/1024/1024, 2) as 'Data_MB',
  ROUND(INDEX_LENGTH/1024/1024, 2) as 'Index_MB'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = '${DB_NAME}';" > "${BACKUP_DIR}/database/database-stats.txt"

echo -e "${GREEN}✓ 数据库备份完成${NC}"
echo ""

# ========================================
# 4. Nginx配置备份
# ========================================
echo -e "${YELLOW}▶ 步骤5: Nginx配置备份...${NC}"

# 备份Nginx配置
cp /www/server/panel/vhost/nginx/bk.yushuo.click.conf "${BACKUP_DIR}/nginx/" 2>/dev/null || \
cp /etc/nginx/sites-available/bk.yushuo.click "${BACKUP_DIR}/nginx/" 2>/dev/null || \
echo "  警告: 未找到Nginx配置文件"

# 备份Nginx日志（最近1000行）
tail -1000 /www/wwwlogs/bk.yushuo.click.log > "${BACKUP_DIR}/nginx/access.log" 2>/dev/null || echo "  (访问日志不存在)"
tail -1000 /www/wwwlogs/bk.yushuo.click.error.log > "${BACKUP_DIR}/nginx/error.log" 2>/dev/null || echo "  (错误日志不存在)"

# 测试Nginx配置
nginx -t > "${BACKUP_DIR}/nginx/config-test.txt" 2>&1

echo -e "${GREEN}✓ Nginx配置备份完成${NC}"
echo ""

# ========================================
# 5. 应用日志备份
# ========================================
echo -e "${YELLOW}▶ 步骤6: 应用日志备份...${NC}"

# Docker容器日志
docker compose logs --tail=1000 stock-tracker > "${BACKUP_DIR}/logs/app.log" 2>&1
docker compose logs --tail=1000 mysql > "${BACKUP_DIR}/logs/mysql.log" 2>&1

# 复制应用日志目录
if [ -d "${PROJECT_DIR}/logs" ]; then
  cp -r "${PROJECT_DIR}/logs" "${BACKUP_DIR}/logs/app-logs"
fi

echo -e "${GREEN}✓ 日志备份完成${NC}"
echo ""

# ========================================
# 6. 环境配置备份
# ========================================
echo -e "${YELLOW}▶ 步骤7: 环境配置备份...${NC}"

# 创建环境信息文件
cat > "${BACKUP_DIR}/environment-info.txt" << EOF
========================================
环境信息
========================================
备份时间: $(date)
服务器主机: $(hostname)
操作系统: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)
内核版本: $(uname -r)
Docker版本: $(docker --version)
Docker Compose版本: $(docker compose version)
Nginx版本: $(nginx -v 2>&1)
Node版本: $(docker exec stock-tracker-app node --version 2>/dev/null || echo "N/A")

========================================
应用配置
========================================
项目目录: ${PROJECT_DIR}
访问域名: http://bk.yushuo.click
应用端口: 3002
数据库端口: 3307

========================================
容器状态
========================================
$(docker compose ps)

========================================
磁盘使用情况
========================================
$(df -h ${PROJECT_DIR})

========================================
备份内容
========================================
1. Git代码 (标签: ${VERSION_TAG})
2. Docker镜像 (app + mysql)
3. 数据库完整备份
4. Nginx配置
5. 应用日志
6. 环境配置
EOF

# 复制关键配置文件
cp package.json "${BACKUP_DIR}/code/" 2>/dev/null || true
cp next.config.js "${BACKUP_DIR}/code/" 2>/dev/null || true
cp tsconfig.json "${BACKUP_DIR}/code/" 2>/dev/null || true
cp tailwind.config.js "${BACKUP_DIR}/code/" 2>/dev/null || true

echo -e "${GREEN}✓ 环境配置备份完成${NC}"
echo ""

# ========================================
# 7. 创建恢复脚本
# ========================================
echo -e "${YELLOW}▶ 步骤8: 创建恢复脚本...${NC}"

cat > "${BACKUP_DIR}/restore.sh" << 'RESTORE_SCRIPT'
#!/bin/bash
# ========================================
# 完整版本恢复脚本
# ========================================

set -e

echo "========================================="
echo "   股票追踪系统 - 恢复脚本"
echo "========================================="
echo ""
echo "警告: 此操作将恢复备份的版本，可能覆盖当前数据！"
echo ""
read -p "确认恢复？(输入 YES 继续): " confirm

if [ "$confirm" != "YES" ]; then
  echo "已取消恢复操作"
  exit 0
fi

BACKUP_DIR=$(dirname "$0")
RESTORE_DIR="/www/wwwroot/stock-tracker-restored"

echo ""
echo "▶ 步骤1: 恢复代码..."
mkdir -p "${RESTORE_DIR}"
tar -xzf "${BACKUP_DIR}/code/source-"*.tar.gz -C "${RESTORE_DIR}" --strip-components=1

echo "▶ 步骤2: 加载Docker镜像..."
docker load < "${BACKUP_DIR}/docker/app-image.tar.gz"
docker load < "${BACKUP_DIR}/docker/mysql-image.tar.gz"

echo "▶ 步骤3: 恢复Docker配置..."
cp "${BACKUP_DIR}/docker/docker-compose.yml" "${RESTORE_DIR}/"
cp "${BACKUP_DIR}/docker/Dockerfile" "${RESTORE_DIR}/"

echo "▶ 步骤4: 启动容器..."
cd "${RESTORE_DIR}"
docker compose up -d

echo "▶ 步骤5: 等待MySQL启动..."
sleep 30

echo "▶ 步骤6: 恢复数据库..."
DB_BACKUP=$(ls "${BACKUP_DIR}/database/"*.sql.gz | head -1)
gunzip -c "${DB_BACKUP}" | docker exec -i stock-tracker-mysql mysql -uroot -proot_password_2025 stock_tracker

echo "▶ 步骤7: 恢复Nginx配置..."
cp "${BACKUP_DIR}/nginx/bk.yushuo.click.conf" /www/server/panel/vhost/nginx/ 2>/dev/null || \
cp "${BACKUP_DIR}/nginx/bk.yushuo.click.conf" /etc/nginx/sites-available/bk.yushuo.click

nginx -t && systemctl reload nginx

echo ""
echo "========================================="
echo "✅ 恢复完成！"
echo "========================================="
echo ""
echo "恢复位置: ${RESTORE_DIR}"
echo "访问地址: http://bk.yushuo.click"
echo ""
echo "验证步骤："
echo "1. docker compose ps"
echo "2. curl -I http://bk.yushuo.click"
echo "3. 浏览器访问测试"
echo ""
RESTORE_SCRIPT

chmod +x "${BACKUP_DIR}/restore.sh"

echo -e "${GREEN}✓ 恢复脚本创建完成${NC}"
echo ""

# ========================================
# 8. 压缩备份
# ========================================
echo -e "${YELLOW}▶ 步骤9: 压缩备份包...${NC}"

cd "${BACKUP_BASE_DIR}"
tar -czf "stock-tracker-backup-${TIMESTAMP}.tar.gz" "backup_${TIMESTAMP}"

BACKUP_SIZE=$(du -sh "stock-tracker-backup-${TIMESTAMP}.tar.gz" | cut -f1)

echo -e "${GREEN}✓ 备份压缩完成${NC}"
echo ""

# ========================================
# 9. 生成备份报告
# ========================================
cat > "${BACKUP_DIR}/BACKUP-REPORT.txt" << EOF
========================================
备份完成报告
========================================
备份时间: $(date)
版本标签: ${VERSION_TAG}
备份目录: ${BACKUP_DIR}
压缩包: ${BACKUP_BASE_DIR}/stock-tracker-backup-${TIMESTAMP}.tar.gz
压缩包大小: ${BACKUP_SIZE}

========================================
备份内容清单
========================================
✓ Git代码 (标签: ${VERSION_TAG})
✓ Docker镜像 (应用 + MySQL)
✓ 数据库完整备份 (含结构和数据)
✓ Nginx配置文件
✓ 应用日志 (最近1000行)
✓ 环境配置信息
✓ 恢复脚本

========================================
备份文件结构
========================================
$(tree -L 2 "${BACKUP_DIR}" 2>/dev/null || find "${BACKUP_DIR}" -maxdepth 2 -type f)

========================================
恢复说明
========================================
1. 解压备份包:
   tar -xzf stock-tracker-backup-${TIMESTAMP}.tar.gz

2. 执行恢复脚本:
   cd backup_${TIMESTAMP}
   chmod +x restore.sh
   ./restore.sh

3. 或手动恢复:
   - 代码: 解压 code/source-*.tar.gz
   - Docker: docker load < docker/app-image.tar.gz
   - 数据库: gunzip -c database/*.sql.gz | mysql
   - Nginx: 复制 nginx/*.conf

========================================
下载备份到本地
========================================
# 使用SCP下载:
scp root@yushuo.click:${BACKUP_BASE_DIR}/stock-tracker-backup-${TIMESTAMP}.tar.gz ./

# 或使用SFTP/WinSCP/FileZilla下载:
路径: ${BACKUP_BASE_DIR}/stock-tracker-backup-${TIMESTAMP}.tar.gz

========================================
定期备份建议
========================================
1. 每天自动备份数据库
2. 每周完整备份一次
3. 重大更新前手动备份
4. 保留最近7天的备份
5. 定期下载到本地存储

可以添加到crontab:
0 2 * * * ${PROJECT_DIR}/backup-current-version.sh

========================================
EOF

# ========================================
# 完成
# ========================================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ 备份完成！${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}备份位置:${NC}"
echo "  目录: ${BACKUP_DIR}"
echo "  压缩包: ${BACKUP_BASE_DIR}/stock-tracker-backup-${TIMESTAMP}.tar.gz"
echo "  大小: ${BACKUP_SIZE}"
echo ""
echo -e "${GREEN}Git标签:${NC} ${VERSION_TAG}"
echo ""
echo -e "${YELLOW}重要提示:${NC}"
echo "  1. 建议下载备份到本地保存"
echo "  2. 查看备份报告: cat ${BACKUP_DIR}/BACKUP-REPORT.txt"
echo "  3. 测试恢复: ${BACKUP_DIR}/restore.sh"
echo ""
echo -e "${BLUE}下载命令:${NC}"
echo "  scp root@yushuo.click:${BACKUP_BASE_DIR}/stock-tracker-backup-${TIMESTAMP}.tar.gz ./"
echo ""
echo -e "${GREEN}备份已完成并安全保存！${NC}"
echo ""