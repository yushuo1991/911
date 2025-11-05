#!/bin/bash
# 服务器端部署环境配置脚本
# 在服务器上运行此脚本来设置部署环境

set -e

echo "=== 服务器部署环境配置 ==="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}注意: 某些操作可能需要 sudo 权限${NC}"
    echo ""
fi

# 项目配置
echo -e "${CYAN}=== 项目配置 ===${NC}"
read -p "项目部署路径 [默认: /www/wwwroot/stock-tracker]: " PROJECT_PATH
PROJECT_PATH=${PROJECT_PATH:-/www/wwwroot/stock-tracker}

read -p "项目仓库地址 [例如: https://github.com/username/stock-tracker.git]: " REPO_URL
if [ -z "$REPO_URL" ]; then
    echo -e "${RED}✗ 仓库地址不能为空${NC}"
    exit 1
fi

read -p "部署分支 [默认: main]: " BRANCH
BRANCH=${BRANCH:-main}

echo ""
echo -e "${CYAN}=== 检查系统依赖 ===${NC}"

# 检查 Git
echo -e "${CYAN}检查 Git...${NC}"
if command -v git &> /dev/null; then
    echo -e "${GREEN}✓ Git 已安装: $(git --version)${NC}"
else
    echo -e "${YELLOW}正在安装 Git...${NC}"
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y git
    elif command -v yum &> /dev/null; then
        sudo yum install -y git
    else
        echo -e "${RED}✗ 无法自动安装 Git，请手动安装${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Git 安装完成${NC}"
fi

# 检查 Node.js
echo -e "${CYAN}检查 Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    echo -e "${GREEN}✓ Node.js 已安装: $(node --version)${NC}"
    
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo -e "${YELLOW}警告: Node.js 版本低于 18，建议升级${NC}"
    fi
else
    echo -e "${YELLOW}正在安装 Node.js 18...${NC}"
    
    # 使用 NodeSource 安装
    if command -v apt-get &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif command -v yum &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    else
        echo -e "${RED}✗ 无法自动安装 Node.js，请手动安装${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Node.js 安装完成${NC}"
fi

# 检查 npm
echo -e "${CYAN}检查 npm...${NC}"
if command -v npm &> /dev/null; then
    echo -e "${GREEN}✓ npm 已安装: $(npm --version)${NC}"
else
    echo -e "${RED}✗ npm 未安装${NC}"
    exit 1
fi

# 检查 PM2
echo -e "${CYAN}检查 PM2...${NC}"
if command -v pm2 &> /dev/null; then
    echo -e "${GREEN}✓ PM2 已安装: $(pm2 --version)${NC}"
else
    echo -e "${YELLOW}正在安装 PM2...${NC}"
    sudo npm install -g pm2
    echo -e "${GREEN}✓ PM2 安装完成${NC}"
fi

echo ""
echo -e "${CYAN}=== 克隆项目 ===${NC}"

# 创建项目目录
PROJECT_DIR=$(dirname "$PROJECT_PATH")
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}创建目录: $PROJECT_DIR${NC}"
    sudo mkdir -p "$PROJECT_DIR"
    sudo chown $USER:$USER "$PROJECT_DIR"
fi

# 克隆或更新项目
if [ -d "$PROJECT_PATH" ]; then
    echo -e "${YELLOW}项目目录已存在，跳过克隆${NC}"
    cd "$PROJECT_PATH"
else
    echo -e "${CYAN}克隆项目到: $PROJECT_PATH${NC}"
    git clone -b "$BRANCH" "$REPO_URL" "$PROJECT_PATH"
    cd "$PROJECT_PATH"
    echo -e "${GREEN}✓ 项目克隆完成${NC}"
fi

echo ""
echo -e "${CYAN}=== 安装依赖 ===${NC}"
npm install

echo ""
echo -e "${CYAN}=== 构建项目 ===${NC}"
npm run build

echo ""
echo -e "${CYAN}=== 配置 PM2 ===${NC}"

# 创建 PM2 配置文件
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'stock-tracker',
    script: 'npm',
    args: 'start',
    cwd: './',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
}
EOF

echo -e "${GREEN}✓ PM2 配置文件已创建${NC}"

# 创建日志目录
mkdir -p logs

# 启动应用
echo -e "${CYAN}启动应用...${NC}"
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo ""
echo -e "${CYAN}=== 配置 Git 自动拉取 ===${NC}"

# 配置 Git 用户（用于自动拉取）
git config user.email "github-actions@deploy"
git config user.name "GitHub Actions Deploy"

# 配置 Git 凭证存储（如果需要）
echo -e "${YELLOW}如果仓库是私有的，需要配置访问凭证${NC}"
echo -e "${YELLOW}建议使用 SSH 密钥或 Personal Access Token${NC}"

echo ""
echo -e "${CYAN}=== 防火墙配置 ===${NC}"
read -p "应用端口 [默认: 3000]: " APP_PORT
APP_PORT=${APP_PORT:-3000}

if command -v ufw &> /dev/null; then
    echo -e "${CYAN}配置 UFW 防火墙...${NC}"
    sudo ufw allow $APP_PORT/tcp
    echo -e "${GREEN}✓ 已开放端口 $APP_PORT${NC}"
elif command -v firewall-cmd &> /dev/null; then
    echo -e "${CYAN}配置 firewalld...${NC}"
    sudo firewall-cmd --permanent --add-port=$APP_PORT/tcp
    sudo firewall-cmd --reload
    echo -e "${GREEN}✓ 已开放端口 $APP_PORT${NC}"
else
    echo -e "${YELLOW}未检测到防火墙，请手动配置端口 $APP_PORT${NC}"
fi

echo ""
echo -e "${CYAN}=== 创建备份目录 ===${NC}"
mkdir -p "$PROJECT_PATH/backup"
echo -e "${GREEN}✓ 备份目录已创建: $PROJECT_PATH/backup${NC}"

echo ""
echo -e "${GREEN}=== 配置完成！ ===${NC}"
echo ""
echo -e "${CYAN}项目信息:${NC}"
echo -e "  路径: ${YELLOW}$PROJECT_PATH${NC}"
echo -e "  分支: ${YELLOW}$BRANCH${NC}"
echo -e "  端口: ${YELLOW}$APP_PORT${NC}"
echo ""
echo -e "${CYAN}常用命令:${NC}"
echo -e "  查看状态: ${YELLOW}pm2 status${NC}"
echo -e "  查看日志: ${YELLOW}pm2 logs stock-tracker${NC}"
echo -e "  重启应用: ${YELLOW}pm2 restart stock-tracker${NC}"
echo -e "  停止应用: ${YELLOW}pm2 stop stock-tracker${NC}"
echo ""
echo -e "${CYAN}测试访问:${NC}"
echo -e "  ${YELLOW}curl http://localhost:$APP_PORT${NC}"
echo ""
echo -e "${GREEN}现在可以从本地推送代码，GitHub Actions 会自动部署到此服务器！${NC}"

# 显示服务器公钥（用于配置 GitHub Secrets）
echo ""
echo -e "${CYAN}=== SSH 公钥 ===${NC}"
echo -e "${YELLOW}将以下公钥添加到 GitHub 部署密钥中：${NC}"
echo ""
if [ -f ~/.ssh/id_rsa.pub ]; then
    cat ~/.ssh/id_rsa.pub
elif [ -f ~/.ssh/id_ed25519.pub ]; then
    cat ~/.ssh/id_ed25519.pub
else
    echo -e "${YELLOW}未找到 SSH 公钥，生成新密钥：${NC}"
    ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/id_ed25519 -N ""
    echo ""
    cat ~/.ssh/id_ed25519.pub
fi

echo ""
echo -e "${YELLOW}将上面的公钥添加到用户的 ~/.ssh/authorized_keys 文件中${NC}"

