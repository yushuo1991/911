#!/bin/bash
# 备份服务器当前v4.19版本，然后部署v4.20
# 执行位置: 服务器 /www/wwwroot/stock-tracker

echo "=========================================="
echo "备份当前版本 → 部署v4.20"
echo "=========================================="
echo ""

cd /www/wwwroot/stock-tracker || exit 1

# 创建备份目录
BACKUP_DIR="/www/backup/stock-tracker"
BACKUP_NAME="backup-v4.19-before-v4.20-$(date +%Y%m%d-%H%M%S)"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

echo "[步骤1] 创建备份目录..."
mkdir -p "$BACKUP_PATH"
echo "✅ 备份目录: $BACKUP_PATH"
echo ""

# 备份代码
echo "[步骤2] 备份当前代码..."
cp -r src "$BACKUP_PATH/"
cp package.json "$BACKUP_PATH/"
cp docker-compose.yml "$BACKUP_PATH/"
cp Dockerfile "$BACKUP_PATH/"
echo "✅ 代码文件已备份"
echo ""

# 记录当前Git状态
echo "[步骤3] 记录当前Git版本..."
git log --oneline -5 > "$BACKUP_PATH/git-version.txt"
git status > "$BACKUP_PATH/git-status.txt"
git diff > "$BACKUP_PATH/git-diff.txt"
echo "✅ Git状态已记录"
echo ""

# 备份Docker镜像
echo "[步骤4] 备份当前Docker镜像..."
docker save stock-tracker-app:latest | gzip > "$BACKUP_PATH/docker-image-v4.19.tar.gz"
echo "✅ Docker镜像已备份"
echo ""

# 创建备份说明
echo "[步骤5] 创建备份说明..."
cat > "$BACKUP_PATH/README.txt" <<EOF
╔══════════════════════════════════════════════════════════════╗
║         备份信息 - v4.19 (部署v4.20前)                        ║
╚══════════════════════════════════════════════════════════════╝

备份时间: $(date '+%Y-%m-%d %H:%M:%S')
备份原因: 部署v4.20超精细化优化前的安全备份
备份位置: $BACKUP_PATH

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

备份内容:
  ✅ src/ - 完整源代码目录
  ✅ package.json - 依赖配置
  ✅ docker-compose.yml - Docker编排配置
  ✅ Dockerfile - Docker镜像构建文件
  ✅ docker-image-v4.19.tar.gz - Docker镜像备份
  ✅ git-version.txt - Git提交历史
  ✅ git-status.txt - Git工作区状态
  ✅ git-diff.txt - 本地修改差异

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

恢复此备份:

1. 恢复代码:
   cd /www/wwwroot/stock-tracker
   cp -r $BACKUP_PATH/src .
   cp $BACKUP_PATH/package.json .
   cp $BACKUP_PATH/docker-compose.yml .
   cp $BACKUP_PATH/Dockerfile .

2. 恢复Docker镜像:
   docker load < $BACKUP_PATH/docker-image-v4.19.tar.gz

3. 重启容器:
   docker compose down
   docker compose up -d

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

当前Git版本:
$(cat $BACKUP_PATH/git-version.txt | head -3)

备份大小:
$(du -sh $BACKUP_PATH | cut -f1)

EOF
echo "✅ 备份说明已创建"
echo ""

# 显示备份信息
echo "=========================================="
echo "✅ 备份完成！"
echo "=========================================="
echo ""
echo "备份位置: $BACKUP_PATH"
echo "备份大小: $(du -sh $BACKUP_PATH | cut -f1)"
echo ""
cat "$BACKUP_PATH/README.txt"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "现在可以安全部署v4.20了！"
echo "执行以下命令继续:"
echo ""
echo "  git checkout -- src/app/page.tsx"
echo "  git pull origin main"
echo "  docker compose down"
echo "  docker compose build"
echo "  docker compose up -d"
echo ""
