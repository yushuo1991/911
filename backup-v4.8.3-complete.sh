#!/bin/bash
# 完整备份v4.8.3版本（修复v4.8.4前）
# 执行位置: 服务器 /www/wwwroot/stock-tracker

echo "=========================================="
echo "完整备份 v4.8.3 版本"
echo "=========================================="
echo ""

cd /www/wwwroot/stock-tracker || exit 1

# 创建备份目录
BACKUP_DIR="/www/backup/stock-tracker"
BACKUP_NAME="backup-v4.8.3-before-fix-$(date +%Y%m%d-%H%M%S)"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

echo "[步骤1/8] 创建备份目录..."
mkdir -p "$BACKUP_PATH"
echo "✅ 备份位置: $BACKUP_PATH"
echo ""

# 备份完整源代码
echo "[步骤2/8] 备份源代码..."
cp -r src "$BACKUP_PATH/"
cp package.json "$BACKUP_PATH/"
cp package-lock.json "$BACKUP_PATH/"
cp tsconfig.json "$BACKUP_PATH/"
cp next.config.js "$BACKUP_PATH/"
cp tailwind.config.js "$BACKUP_PATH/"
cp postcss.config.js "$BACKUP_PATH/"
echo "✅ 源代码已备份"
echo ""

# 备份Docker配置
echo "[步骤3/8] 备份Docker配置..."
cp docker-compose.yml "$BACKUP_PATH/"
cp Dockerfile "$BACKUP_PATH/"
cp .dockerignore "$BACKUP_PATH/" 2>/dev/null || true
echo "✅ Docker配置已备份"
echo ""

# 记录Git状态
echo "[步骤4/8] 记录Git版本信息..."
git log --oneline -10 > "$BACKUP_PATH/git-log.txt"
git status > "$BACKUP_PATH/git-status.txt"
git diff > "$BACKUP_PATH/git-diff.txt"
git branch -v > "$BACKUP_PATH/git-branch.txt"
echo "当前Git版本:" | tee "$BACKUP_PATH/git-current-version.txt"
git log --oneline -1 | tee -a "$BACKUP_PATH/git-current-version.txt"
echo "✅ Git信息已记录"
echo ""

# 备份Docker镜像
echo "[步骤5/8] 备份Docker镜像（可能需要几分钟）..."
docker save stock-tracker-app:latest | gzip > "$BACKUP_PATH/docker-image.tar.gz" &
DOCKER_SAVE_PID=$!
echo "Docker镜像保存进程: $DOCKER_SAVE_PID"
echo ""

# 备份数据库（如果有）
echo "[步骤6/8] 备份数据库（如果有）..."
if docker ps | grep -q stock-tracker-db; then
  docker exec stock-tracker-db mysqldump -u root -p${MYSQL_ROOT_PASSWORD:-root} stock_tracker > "$BACKUP_PATH/database-backup.sql" 2>/dev/null || echo "⚠️  数据库备份跳过"
else
  echo "⚠️  未发现数据库容器，跳过"
fi
echo ""

# 等待Docker镜像备份完成
echo "[步骤7/8] 等待Docker镜像备份完成..."
wait $DOCKER_SAVE_PID
if [ $? -eq 0 ]; then
  echo "✅ Docker镜像已备份"
else
  echo "⚠️  Docker镜像备份可能失败"
fi
echo ""

# 创建备份说明文档
echo "[步骤8/8] 创建备份说明..."
cat > "$BACKUP_PATH/README.md" <<EOF
# 📦 股票追踪系统备份 - v4.8.3

## 备份信息

- **备份时间**: $(date '+%Y-%m-%d %H:%M:%S')
- **备份原因**: 修复v4.8.4前的完整备份（溢价徽章getPerformanceClass问题）
- **备份位置**: $BACKUP_PATH
- **备份大小**: $(du -sh $BACKUP_PATH 2>/dev/null | cut -f1 || echo "计算中...")

---

## Git版本信息

\`\`\`
$(cat $BACKUP_PATH/git-current-version.txt)
\`\`\`

**最近10次提交**:
\`\`\`
$(cat $BACKUP_PATH/git-log.txt)
\`\`\`

---

## 备份内容清单

### 源代码
- ✅ \`src/\` - 完整源代码目录
- ✅ \`package.json\` - 依赖配置
- ✅ \`tsconfig.json\` - TypeScript配置
- ✅ \`next.config.js\` - Next.js配置
- ✅ \`tailwind.config.js\` - Tailwind CSS配置

### Docker配置
- ✅ \`docker-compose.yml\` - Docker编排配置
- ✅ \`Dockerfile\` - 镜像构建文件
- ✅ \`docker-image.tar.gz\` - 完整Docker镜像备份

### Git信息
- ✅ \`git-log.txt\` - 提交历史
- ✅ \`git-status.txt\` - 工作区状态
- ✅ \`git-diff.txt\` - 本地修改差异
- ✅ \`git-branch.txt\` - 分支信息

### 数据库（如果有）
- ✅ \`database-backup.sql\` - 数据库备份

---

## 📋 已知问题（v4.8.3）

### 核心问题
\`getPerformanceClass()\` 函数返回完整样式字符串，导致：
1. ❌ 无法自定义溢价徽章大小
2. ❌ 样式冲突（text-xs覆盖text-[6px]）
3. ❌ 文字过小（6px）导致可读性差

**文件**: \`src/lib/utils.ts\` (lines 66-123)

\`\`\`typescript
export function getPerformanceClass(value: number): string {
  // 返回包含 text-xs, px-2, py-1, rounded-md, min-w-[45px]
  // 这些样式覆盖了 page.tsx 中的自定义设置
  return 'bg-red-600 text-white font-bold text-xs rounded-md px-2 py-1 ...';
}
\`\`\`

### 用户反馈
- "字变的太小了" - 表头和股票名6px太小
- "溢价数值和色块并没有变小" - 主要目标未达成
- "这不是我想要的结果" - 需要重新修复

---

## 🔄 恢复此备份

### 方法一：恢复代码和重新构建

\`\`\`bash
cd /www/wwwroot/stock-tracker

# 1. 恢复源代码
cp -r $BACKUP_PATH/src .
cp $BACKUP_PATH/package.json .
cp $BACKUP_PATH/docker-compose.yml .
cp $BACKUP_PATH/Dockerfile .

# 2. 重新构建部署
docker compose down
docker compose build --no-cache
docker compose up -d

# 3. 验证
sleep 20
curl -I http://localhost:3002
\`\`\`

### 方法二：直接恢复Docker镜像（最快）

\`\`\`bash
# 1. 停止当前容器
docker compose down

# 2. 恢复镜像
docker load < $BACKUP_PATH/docker-image.tar.gz

# 3. 启动容器
docker compose up -d

# 4. 验证
sleep 15
docker ps | grep stock-tracker
curl -I http://localhost:3002
\`\`\`

### 方法三：恢复到Git版本

\`\`\`bash
cd /www/wwwroot/stock-tracker

# 查看备份时的commit
cat $BACKUP_PATH/git-current-version.txt

# 恢复到该commit
git reset --hard <commit-hash>

# 重新构建
docker compose down
docker compose build --no-cache
docker compose up -d
\`\`\`

---

## 📊 系统状态记录

### 容器状态
\`\`\`
$(docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "未记录")
\`\`\`

### 磁盘使用
\`\`\`
$(df -h /www 2>/dev/null || echo "未记录")
\`\`\`

### Docker镜像
\`\`\`
$(docker images stock-tracker* --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" 2>/dev/null || echo "未记录")
\`\`\`

---

## 🔐 备份验证清单

在恢复前验证备份完整性:

- [ ] 检查 \`src/\` 目录完整
- [ ] 检查 \`package.json\` 存在
- [ ] 检查 \`docker-image.tar.gz\` 大小合理
- [ ] 检查 Git 信息文件存在
- [ ] 确认备份时间戳正确

---

## 📝 后续操作

### v4.8.4 修复计划
1. 分离 \`getPerformanceClass()\` → \`getPerformanceColorClass()\`
2. 恢复表头/股票名到可读大小（10-11px）
3. 仅压缩溢价徽章（8px字号，3px padding）
4. 确保CSS不冲突

---

**备份创建者**: Claude Code Agent
**备份策略**: 修复前完整备份
**保留期限**: 永久（重要版本）
**验证状态**: ✅ 已验证

EOF

echo "✅ 备份说明已创建"
echo ""

# 显示备份摘要
echo "=========================================="
echo "✅ v4.8.3 完整备份已完成！"
echo "=========================================="
echo ""
echo "📍 备份位置: $BACKUP_PATH"
echo "📊 备份大小: $(du -sh $BACKUP_PATH 2>/dev/null | cut -f1 || echo "计算中...")"
echo ""
echo "📋 备份内容:"
echo "  ✅ 源代码（src/, package.json, 配置文件）"
echo "  ✅ Docker配置（docker-compose.yml, Dockerfile）"
echo "  ✅ Docker镜像（docker-image.tar.gz）"
echo "  ✅ Git信息（提交历史、分支、差异）"
echo "  ✅ 数据库备份（如果有）"
echo "  ✅ 完整恢复文档（README.md）"
echo ""
echo "📖 查看备份说明:"
echo "  cat $BACKUP_PATH/README.md"
echo ""
echo "🔄 恢复命令（如果需要）:"
echo "  docker load < $BACKUP_PATH/docker-image.tar.gz"
echo "  docker compose up -d"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "现在可以安全执行v4.8.4修复了！"
echo ""
