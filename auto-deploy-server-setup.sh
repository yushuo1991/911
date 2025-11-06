#!/bin/bash
# 完全自动化部署 - 服务器端一键安装脚本
# 在服务器上运行一次，之后完全自动化

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║        完全自动化部署系统 - 一键安装                      ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# 配置变量
PROJECT_PATH="/www/wwwroot/stock-tracker"
REPO_URL="https://github.com/YOUR_USERNAME/stock-tracker.git"  # 替换为你的仓库地址
LOG_FILE="/var/log/stock-tracker-deploy.log"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}════ 步骤 1/5: 检查系统环境 ═══${NC}"
echo ""

# 检查必要工具
for cmd in git node npm pm2; do
    if command -v $cmd &> /dev/null; then
        echo -e "${GREEN}✓ $cmd 已安装${NC}"
    else
        echo -e "${RED}✗ $cmd 未安装${NC}"
        echo -e "${YELLOW}请先运行服务器初始化脚本: server-deploy-setup.sh${NC}"
        exit 1
    fi
done

echo ""
echo -e "${CYAN}════ 步骤 2/5: 克隆项目代码 ═══${NC}"
echo ""

if [ -d "$PROJECT_PATH" ]; then
    echo -e "${YELLOW}项目目录已存在${NC}"
else
    echo "创建项目目录: $PROJECT_PATH"
    mkdir -p $(dirname $PROJECT_PATH)
    
    echo "克隆代码仓库..."
    git clone $REPO_URL $PROJECT_PATH
    
    echo -e "${GREEN}✓ 代码克隆完成${NC}"
fi

cd $PROJECT_PATH

echo ""
echo -e "${CYAN}════ 步骤 3/5: 初始部署 ═══${NC}"
echo ""

echo "安装依赖..."
npm install

echo "构建项目..."
npm run build

echo "启动服务..."
pm2 delete stock-tracker 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root

echo -e "${GREEN}✓ 初始部署完成${NC}"

echo ""
echo -e "${CYAN}════ 步骤 4/5: 创建自动部署脚本 ═══${NC}"
echo ""

cat > /root/auto-deploy-stock-tracker.sh << 'DEPLOY_SCRIPT'
#!/bin/bash
# 自动部署脚本 - 由 cron 定时执行

set -e

PROJECT_PATH="/www/wwwroot/stock-tracker"
LOG_FILE="/var/log/stock-tracker-deploy.log"

# 确保日志目录存在
touch $LOG_FILE

echo "====================================" >> $LOG_FILE
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 检查更新..." >> $LOG_FILE

cd $PROJECT_PATH

# 检查是否有更新
git fetch origin main 2>&1 >> $LOG_FILE

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" != "$REMOTE" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 发现更新，开始部署..." >> $LOG_FILE
    
    # 备份当前版本
    timestamp=$(date +%Y%m%d_%H%M%S)
    mkdir -p backup
    if [ -d .next ]; then
        cp -r .next backup/.next_$timestamp 2>/dev/null || true
        echo "已备份到: backup/.next_$timestamp" >> $LOG_FILE
    fi
    
    # 拉取最新代码
    git pull origin main >> $LOG_FILE 2>&1
    
    # 安装依赖
    npm install --production >> $LOG_FILE 2>&1
    
    # 构建项目
    npm run build >> $LOG_FILE 2>&1
    
    # 重启服务
    pm2 restart stock-tracker >> $LOG_FILE 2>&1
    pm2 save >> $LOG_FILE 2>&1
    
    NEW_VERSION=$(git rev-parse --short HEAD)
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ 部署成功！新版本: $NEW_VERSION" >> $LOG_FILE
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 无更新，当前版本: $(git rev-parse --short HEAD)" >> $LOG_FILE
fi

echo "====================================" >> $LOG_FILE
DEPLOY_SCRIPT

chmod +x /root/auto-deploy-stock-tracker.sh

echo -e "${GREEN}✓ 自动部署脚本已创建: /root/auto-deploy-stock-tracker.sh${NC}"

echo ""
echo -e "${CYAN}════ 步骤 5/5: 设置定时任务 ═══${NC}"
echo ""

# 检查 crontab 是否已存在
if crontab -l 2>/dev/null | grep -q "auto-deploy-stock-tracker.sh"; then
    echo -e "${YELLOW}定时任务已存在${NC}"
else
    # 添加定时任务（每5分钟检查一次）
    (crontab -l 2>/dev/null; echo "*/5 * * * * /root/auto-deploy-stock-tracker.sh") | crontab -
    echo -e "${GREEN}✓ 定时任务已添加（每5分钟检查更新）${NC}"
fi

# 显示当前 crontab
echo ""
echo "当前定时任务："
crontab -l | grep auto-deploy-stock-tracker.sh || true

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}║              🎉 完全自动化部署配置完成！                  ║${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}现在的工作流程：${NC}"
echo ""
echo "1. 本地修改代码"
echo "2. git push"
echo "3. 等待 5 分钟内自动部署 ✅"
echo ""
echo -e "${YELLOW}完全自动化，无需任何手动操作！${NC}"
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}项目信息${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo "项目路径: $PROJECT_PATH"
echo "访问地址: http://$(hostname -I | awk '{print $1}'):3000"
echo "部署日志: $LOG_FILE"
echo ""
echo -e "${CYAN}常用命令：${NC}"
echo "查看服务状态:   pm2 status"
echo "查看应用日志:   pm2 logs stock-tracker"
echo "查看部署日志:   tail -f $LOG_FILE"
echo "手动触发部署:   /root/auto-deploy-stock-tracker.sh"
echo "查看定时任务:   crontab -l"
echo ""
echo -e "${GREEN}部署系统已启动并运行！${NC}"





