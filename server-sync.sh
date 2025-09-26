#!/bin/bash

# 服务器代码同步脚本 - v4.3版本
# 创建时间: 2025-09-26
# 用途: 从GitHub同步最新代码到服务器

set -e

echo "=========================================="
echo "股票追踪系统 - 服务器代码同步脚本"
echo "=========================================="
echo ""

# 配置变量
PROJECT_DIR="/www/wwwroot/stock-tracker"
BACKUP_DIR="/www/backup/$(date +%Y%m%d_%H%M%S)_sync_backup"
LOG_FILE="/tmp/sync_$(date +%Y%m%d_%H%M%S).log"
REPO_URL="https://github.com/yushuo1991/911.git"
TARGET_VERSION="v4.3"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "开始代码同步，日志文件: $LOG_FILE"
echo ""

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    log "错误: 请使用root用户运行此脚本"
    echo "运行命令: sudo ./server-sync.sh"
    exit 1
fi

echo "[1/6] 环境检查..."

# 检查Git是否安装
if ! command -v git &> /dev/null; then
    log "安装Git..."
    if command -v yum &> /dev/null; then
        yum install -y git
    elif command -v apt &> /dev/null; then
        apt update && apt install -y git
    else
        log "错误: 无法安装Git，请手动安装"
        exit 1
    fi
fi

# 检查项目目录
if [ ! -d "$PROJECT_DIR" ]; then
    log "创建项目目录: $PROJECT_DIR"
    mkdir -p "$PROJECT_DIR"
fi

echo ""
echo "[2/6] 备份现有项目..."

# 备份现有项目（如果存在）
if [ -d "$PROJECT_DIR/.git" ]; then
    log "发现现有项目，创建备份..."
    mkdir -p "$BACKUP_DIR"
    cp -r "$PROJECT_DIR" "$BACKUP_DIR/"
    log "备份完成: $BACKUP_DIR"
else
    log "未发现现有项目，跳过备份"
fi

echo ""
echo "[3/6] 从GitHub同步代码..."

cd "$PROJECT_DIR"

if [ -d ".git" ]; then
    log "更新现有Git仓库..."

    # 检查Git仓库完整性
    if git fsck --quiet 2>/dev/null; then
        # 保存本地修改（如果有）
        git stash push -m "Auto stash before sync $(date)" 2>/dev/null || true

        # 获取最新代码
        if git fetch origin 2>/dev/null; then
            # 检查目标版本是否存在
            if git rev-parse "$TARGET_VERSION" >/dev/null 2>&1; then
                log "切换到版本: $TARGET_VERSION"
                git checkout "$TARGET_VERSION"
                git reset --hard "$TARGET_VERSION"
            else
                log "版本 $TARGET_VERSION 不存在，切换到main分支最新代码"
                git checkout main
                git reset --hard origin/main
            fi
        else
            log "Git fetch失败，仓库可能损坏，将重新克隆..."
            rm -rf .git
        fi
    else
        log "检测到Git仓库损坏，将重新克隆..."
        rm -rf .git
    fi
fi

if [ ! -d ".git" ]; then
    log "克隆新的Git仓库..."

    # 清空目录并重新初始化
    rm -rf ./*
    rm -rf .git* 2>/dev/null || true

    # 初始化Git仓库
    git init
    git remote add origin "$REPO_URL"

    # 尝试浅克隆减少网络传输
    if git fetch --depth=1 origin main 2>/dev/null; then
        log "浅克隆成功"
        git checkout -b main origin/main

        # 尝试获取目标版本
        if git fetch --depth=50 origin "+refs/tags/$TARGET_VERSION:refs/tags/$TARGET_VERSION" 2>/dev/null; then
            git checkout "$TARGET_VERSION"
            log "切换到版本: $TARGET_VERSION"
        else
            log "使用main分支最新代码"
        fi
    else
        log "浅克隆失败，尝试完整克隆..."
        git fetch origin
        git checkout -b main origin/main

        # 切换到目标版本
        if git rev-parse "$TARGET_VERSION" >/dev/null 2>&1; then
            log "切换到版本: $TARGET_VERSION"
            git checkout "$TARGET_VERSION"
        else
            log "使用main分支最新代码"
        fi
    fi
fi

# 获取当前版本信息
CURRENT_COMMIT=$(git rev-parse --short HEAD)
CURRENT_MESSAGE=$(git log -1 --pretty=format:"%s")
log "当前版本: $CURRENT_COMMIT - $CURRENT_MESSAGE"

echo ""
echo "[4/6] 检查项目文件..."

# 检查关键文件是否存在
CRITICAL_FILES=("package.json" "src/app/page.tsx" "src/components/StockTracker.tsx")
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        log "✓ 文件存在: $file"
    else
        log "✗ 文件缺失: $file"
    fi
done

# 检查部署脚本
if [ -f "baota-deploy.sh" ]; then
    log "✓ 部署脚本已同步: baota-deploy.sh"
    chmod +x baota-deploy.sh
else
    log "⚠ 部署脚本未找到，可能需要手动部署"
fi

if [ -f "server-env-check.sh" ]; then
    log "✓ 环境检测脚本已同步: server-env-check.sh"
    chmod +x server-env-check.sh
else
    log "⚠ 环境检测脚本未找到"
fi

echo ""
echo "[5/6] 更新文件权限..."

# 设置正确的文件权限
chown -R www:www "$PROJECT_DIR" 2>/dev/null || chown -R nginx:nginx "$PROJECT_DIR" 2>/dev/null || true

# 设置脚本执行权限
find "$PROJECT_DIR" -name "*.sh" -exec chmod +x {} \; 2>/dev/null || true

# 创建必要目录
mkdir -p "$PROJECT_DIR/data"
mkdir -p "$PROJECT_DIR/log"

log "文件权限更新完成"

echo ""
echo "[6/6] 同步验证..."

# 验证同步结果
if [ -f "package.json" ]; then
    PROJECT_VERSION=$(grep '"version"' package.json | cut -d'"' -f4)
    log "项目版本: $PROJECT_VERSION"
fi

# 检查目录大小
DIR_SIZE=$(du -sh "$PROJECT_DIR" | cut -f1)
log "项目目录大小: $DIR_SIZE"

# 统计文件数量
FILE_COUNT=$(find "$PROJECT_DIR" -type f | wc -l)
log "文件总数: $FILE_COUNT"

echo ""
echo "=========================================="
echo "🎉 代码同步完成！"
echo "=========================================="
echo ""
echo "📊 同步信息:"
echo "   • 项目路径: $PROJECT_DIR"
echo "   • 同步版本: $TARGET_VERSION ($CURRENT_COMMIT)"
echo "   • 备份路径: $BACKUP_DIR"
echo "   • 同步日志: $LOG_FILE"
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
echo "📋 同步日志已保存到: $LOG_FILE"
echo "=========================================="