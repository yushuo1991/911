#!/bin/bash

# Git仓库修复脚本
# 创建时间: 2025-09-26
# 用途: 修复损坏的Git仓库，强制重新克隆

set -e

echo "=========================================="
echo "Git仓库修复脚本"
echo "=========================================="
echo ""

# 配置变量
PROJECT_DIR="/www/wwwroot/stock-tracker"
BACKUP_DIR="/www/backup/$(date +%Y%m%d_%H%M%S)_git_repair_backup"
LOG_FILE="/tmp/git_repair_$(date +%Y%m%d_%H%M%S).log"
REPO_URL="https://github.com/yushuo1991/911.git"
TARGET_VERSION="v4.3"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "开始Git仓库修复，日志文件: $LOG_FILE"

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    log "错误: 请使用root用户运行此脚本"
    echo "运行命令: sudo ./git-repair.sh"
    exit 1
fi

echo ""
echo "[1/6] 环境检查和诊断..."

# 检查磁盘空间
DISK_AVAILABLE=$(df -BG "$PROJECT_DIR" 2>/dev/null | awk 'NR==2 {print $4}' | sed 's/G//' || echo "0")
log "磁盘可用空间: ${DISK_AVAILABLE}GB"

if [ "$DISK_AVAILABLE" -lt 2 ]; then
    log "警告: 磁盘空间不足 (${DISK_AVAILABLE}GB)，这可能是Git损坏的原因"
    echo "建议先清理磁盘空间后再继续"
    read -p "是否继续修复？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "用户选择退出修复"
        exit 1
    fi
fi

# 检查项目目录是否存在
if [ ! -d "$PROJECT_DIR" ]; then
    log "项目目录不存在: $PROJECT_DIR"
    echo "将创建新的项目目录"
    mkdir -p "$PROJECT_DIR"
fi

echo ""
echo "[2/6] 备份损坏的仓库..."

if [ -d "$PROJECT_DIR/.git" ]; then
    log "发现Git仓库，创建备份..."
    mkdir -p "$BACKUP_DIR"

    # 备份重要文件（非Git对象）
    cp -r "$PROJECT_DIR"/{*.sh,*.json,*.md,src,log,data} "$BACKUP_DIR/" 2>/dev/null || true

    # 尝试备份Git配置
    cp "$PROJECT_DIR/.git/config" "$BACKUP_DIR/git-config" 2>/dev/null || true

    log "重要文件已备份到: $BACKUP_DIR"
else
    log "未发现Git仓库，跳过备份"
fi

echo ""
echo "[3/6] 检查Git仓库状态..."

cd "$PROJECT_DIR"

# 尝试诊断Git仓库状态
if [ -d ".git" ]; then
    log "诊断Git仓库完整性..."

    # 检查Git仓库完整性
    if git fsck --full 2>&1 | tee -a "$LOG_FILE" | grep -q "error\|fatal\|missing"; then
        log "检测到Git仓库损坏，需要重新克隆"
        REPO_CORRUPTED=true
    else
        log "Git仓库完整性检查通过"
        REPO_CORRUPTED=false
    fi

    # 尝试获取当前分支信息
    CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "未知")
    CURRENT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "未知")
    log "当前分支: $CURRENT_BRANCH"
    log "当前提交: $CURRENT_COMMIT"
else
    log "未发现Git仓库"
    REPO_CORRUPTED=true
fi

echo ""
echo "[4/6] 清理损坏的Git仓库..."

if [ "$REPO_CORRUPTED" = true ]; then
    log "删除损坏的Git仓库..."

    # 保留重要文件，删除Git相关文件
    find "$PROJECT_DIR" -name ".git*" -exec rm -rf {} + 2>/dev/null || true

    # 清理可能的损坏文件
    rm -rf "$PROJECT_DIR/.git" 2>/dev/null || true

    log "损坏的Git仓库已清理"
else
    log "尝试修复Git仓库..."

    # 尝试Git修复命令
    git gc --aggressive --prune=now 2>&1 | tee -a "$LOG_FILE" || true
    git remote prune origin 2>&1 | tee -a "$LOG_FILE" || true

    # 再次检查是否修复成功
    if git fsck --full 2>&1 | grep -q "error\|fatal"; then
        log "Git修复失败，将重新克隆"
        rm -rf "$PROJECT_DIR/.git"
        REPO_CORRUPTED=true
    else
        log "Git仓库修复成功"
    fi
fi

echo ""
echo "[5/6] 重新克隆仓库..."

if [ "$REPO_CORRUPTED" = true ]; then
    log "从GitHub重新克隆仓库..."

    # 进入项目目录
    cd "$PROJECT_DIR"

    # 初始化新的Git仓库
    git init

    # 添加远程仓库
    git remote add origin "$REPO_URL"

    # 尝试浅克隆以减少网络传输
    log "尝试浅克隆最新代码..."
    if git fetch --depth=1 origin main; then
        git checkout -b main origin/main
        log "浅克隆成功"
    else
        log "浅克隆失败，尝试完整克隆..."
        git fetch origin
        git checkout -b main origin/main
    fi

    # 尝试切换到目标版本
    if git tag -l | grep -q "$TARGET_VERSION"; then
        log "切换到版本: $TARGET_VERSION"
        git checkout "$TARGET_VERSION"
    else
        log "使用main分支最新代码"
    fi

    # 获取当前版本信息
    CURRENT_COMMIT=$(git rev-parse --short HEAD)
    CURRENT_MESSAGE=$(git log -1 --pretty=format:"%s")
    log "修复后版本: $CURRENT_COMMIT - $CURRENT_MESSAGE"
else
    log "Git仓库无需重新克隆"
fi

echo ""
echo "[6/6] 验证修复结果..."

# 验证Git仓库状态
if git status >/dev/null 2>&1; then
    log "✅ Git仓库修复成功"

    # 显示仓库信息
    BRANCH=$(git branch --show-current)
    COMMIT=$(git rev-parse --short HEAD)
    log "当前分支: $BRANCH"
    log "当前提交: $COMMIT"

    # 检查关键文件
    if [ -f "package.json" ]; then
        PROJECT_VERSION=$(grep '"version"' package.json | cut -d'"' -f4 2>/dev/null || echo "未知")
        log "项目版本: $PROJECT_VERSION"
    fi

    # 统计文件数量
    FILE_COUNT=$(find . -type f | wc -l)
    log "项目文件总数: $FILE_COUNT"

else
    log "❌ Git仓库修复失败"
    echo "请手动检查以下问题："
    echo "1. 网络连接是否正常"
    echo "2. 磁盘空间是否充足"
    echo "3. 权限设置是否正确"
    exit 1
fi

# 恢复文件权限
chown -R www:www "$PROJECT_DIR" 2>/dev/null || chown -R nginx:nginx "$PROJECT_DIR" 2>/dev/null || true

# 设置脚本执行权限
find "$PROJECT_DIR" -name "*.sh" -exec chmod +x {} \; 2>/dev/null || true

echo ""
echo "=========================================="
echo "🎉 Git仓库修复完成！"
echo "=========================================="
echo ""
echo "📊 修复结果:"
echo "   • 项目路径: $PROJECT_DIR"
echo "   • 当前版本: $(git rev-parse --short HEAD 2>/dev/null || echo '未知')"
echo "   • 备份路径: $BACKUP_DIR"
echo "   • 修复日志: $LOG_FILE"
echo ""
echo "🔧 下一步操作："
if [ -f "$PROJECT_DIR/baota-deploy.sh" ]; then
    echo "   1. 运行部署脚本:"
    echo "      cd $PROJECT_DIR"
    echo "      ./baota-deploy.sh"
else
    echo "   1. 手动部署应用:"
    echo "      cd $PROJECT_DIR"
    echo "      npm install"
    echo "      npm run build"
    echo "      pm2 restart stock-tracker-v42"
fi
echo ""
echo "   2. 检查应用状态:"
echo "      pm2 status"
echo "      curl https://bk.yushuo.click"
echo ""
echo "📋 修复日志已保存到: $LOG_FILE"
echo "=========================================="