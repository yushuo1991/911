#!/bin/bash

# Ubuntu/Debian服务器环境检测脚本 - 股票追踪系统v4.3
# 创建时间: 2025-09-26
# 用途: 针对Ubuntu/Debian系统的环境检测和建议

set -e

echo "=========================================="
echo "股票追踪系统v4.3 - Ubuntu/Debian环境检测"
echo "=========================================="
echo ""

# 创建日志目录
LOG_DIR="/tmp/stock-tracker-env-check"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/ubuntu-env-check-$(date +%Y%m%d_%H%M%S).log"

# 日志函数
log_info() {
    echo "[INFO] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo "[ERROR] $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo "[SUCCESS] $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo "[WARNING] $1" | tee -a "$LOG_FILE"
}

# 检查结果统计
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

check_result() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    case $1 in
        "PASS")
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
            log_success "$2"
            ;;
        "FAIL")
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
            log_error "$2"
            ;;
        "WARN")
            WARNING_CHECKS=$((WARNING_CHECKS + 1))
            log_warning "$2"
            ;;
    esac
}

log_info "开始Ubuntu/Debian环境检测，日志文件: $LOG_FILE"
echo ""

# ===============================================
# 1. 系统基础环境检查
# ===============================================
echo "🔍 [1/8] 系统基础环境检查..."

# 检查操作系统
if [ -f /etc/os-release ]; then
    OS_INFO=$(grep PRETTY_NAME /etc/os-release | cut -d'"' -f2)
    log_info "操作系统: $OS_INFO"

    # 检查是否为Debian/Ubuntu系系统
    if echo "$OS_INFO" | grep -qE "(Ubuntu|Debian)"; then
        check_result "PASS" "操作系统支持: $OS_INFO"
    else
        check_result "WARN" "未完全测试的操作系统: $OS_INFO"
    fi
else
    check_result "FAIL" "无法检测操作系统信息"
fi

# 检查系统架构
ARCH=$(uname -m)
if [ "$ARCH" = "x86_64" ]; then
    check_result "PASS" "系统架构: $ARCH (支持)"
else
    check_result "WARN" "系统架构: $ARCH (可能不支持)"
fi

# 检查内存
MEMORY_GB=$(free -g | awk '/^Mem:/{print $2}')
MEMORY_AVAILABLE_GB=$(free -g | awk '/^Mem:/{print $7}')
log_info "总内存: ${MEMORY_GB}GB，可用内存: ${MEMORY_AVAILABLE_GB}GB"

if [ "$MEMORY_GB" -ge 1 ]; then
    check_result "PASS" "内存充足: ${MEMORY_GB}GB"
else
    check_result "FAIL" "内存不足: ${MEMORY_GB}GB (建议至少1GB)"
fi

# 检查磁盘空间
DISK_AVAILABLE=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
log_info "根分区可用空间: ${DISK_AVAILABLE}GB"

if [ "$DISK_AVAILABLE" -ge 10 ]; then
    check_result "PASS" "磁盘空间充足: ${DISK_AVAILABLE}GB"
else
    check_result "FAIL" "磁盘空间不足: ${DISK_AVAILABLE}GB (建议至少10GB)"
fi

echo ""

# ===============================================
# 2. 权限检查
# ===============================================
echo "🔐 [2/8] 用户权限检查..."

# 检查是否为root用户
if [ "$EUID" -eq 0 ]; then
    check_result "PASS" "当前用户: root (具有管理员权限)"
else
    # 检查sudo权限
    if sudo -n true 2>/dev/null; then
        check_result "PASS" "当前用户: $(whoami) (具有sudo权限)"
    else
        check_result "FAIL" "当前用户: $(whoami) (缺少sudo权限)"
    fi
fi

echo ""

# ===============================================
# 3. 宝塔面板检查
# ===============================================
echo "🎛️ [3/8] 宝塔面板检查..."

# 检查宝塔面板是否安装
if [ -d "/www/server/panel" ]; then
    check_result "PASS" "宝塔面板已安装"

    # 检查宝塔服务状态
    if systemctl is-active --quiet bt; then
        check_result "PASS" "宝塔面板服务运行正常"
    else
        check_result "WARN" "宝塔面板服务未运行"
    fi
else
    check_result "FAIL" "宝塔面板未安装，请先安装宝塔面板"
fi

# 检查www目录权限
if [ -d "/www" ]; then
    WWW_OWNER=$(stat -c "%U" /www)
    WWW_GROUP=$(stat -c "%G" /www)
    check_result "PASS" "www目录存在，所有者: $WWW_OWNER:$WWW_GROUP"
else
    check_result "FAIL" "www目录不存在"
fi

echo ""

# ===============================================
# 4. Node.js环境检查
# ===============================================
echo "🟢 [4/8] Node.js环境检查..."

# 检查Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    NODE_MAJOR_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    log_info "Node.js版本: $NODE_VERSION"

    if [ "$NODE_MAJOR_VERSION" -ge 18 ]; then
        check_result "PASS" "Node.js版本符合要求 (>= 18.x)"
    else
        check_result "FAIL" "Node.js版本过低: $NODE_VERSION (需要 >= 18.x)"
    fi
else
    check_result "FAIL" "Node.js未安装"
fi

# 检查NPM
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    check_result "PASS" "NPM版本: $NPM_VERSION"
else
    check_result "FAIL" "NPM未安装"
fi

# 检查PM2
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 --version)
    check_result "PASS" "PM2版本: $PM2_VERSION"

    # 检查PM2进程
    PM2_PROCESSES=$(pm2 list | grep -c "online\|stopped\|errored" || echo "0")
    log_info "PM2当前管理进程数: $PM2_PROCESSES"
else
    check_result "WARN" "PM2未安装 (可通过宝塔面板安装)"
fi

echo ""

# ===============================================
# 5. 网络连接检查
# ===============================================
echo "🌐 [5/8] 网络连接检查..."

# 检查GitHub连接
if curl -s --connect-timeout 10 https://github.com > /dev/null; then
    check_result "PASS" "GitHub连接正常"
else
    check_result "FAIL" "无法连接GitHub，可能影响代码下载"
fi

# 检查NPM源连接
if curl -s --connect-timeout 10 https://registry.npmjs.org > /dev/null; then
    check_result "PASS" "NPM源连接正常"
else
    check_result "WARN" "NPM源连接异常，建议配置国内镜像源"
fi

# 检查Tushare API连接
if curl -s --connect-timeout 10 https://api.tushare.pro > /dev/null; then
    check_result "PASS" "Tushare API连接正常"
else
    check_result "WARN" "Tushare API连接异常，可能影响数据获取"
fi

echo ""

# ===============================================
# 6. 端口检查
# ===============================================
echo "🔌 [6/8] 端口检查..."

# 检查目标端口3002
if netstat -tlnp 2>/dev/null | grep -q ":3002 "; then
    PROCESS_ON_3002=$(netstat -tlnp 2>/dev/null | grep ":3002 " | awk '{print $7}')
    check_result "WARN" "端口3002已被占用: $PROCESS_ON_3002"
else
    check_result "PASS" "端口3002可用"
fi

# 检查Nginx端口
if netstat -tlnp 2>/dev/null | grep -q ":80 "; then
    check_result "PASS" "端口80已被占用 (Nginx)"
else
    check_result "WARN" "端口80未被占用，Nginx可能未运行"
fi

if netstat -tlnp 2>/dev/null | grep -q ":443 "; then
    check_result "PASS" "端口443已被占用 (HTTPS)"
else
    check_result "WARN" "端口443未被占用，HTTPS未配置"
fi

echo ""

# ===============================================
# 7. Nginx检查
# ===============================================
echo "⚡ [7/8] Nginx检查..."

# 检查Nginx是否安装
if command -v nginx &> /dev/null; then
    NGINX_VERSION=$(nginx -v 2>&1 | cut -d' ' -f3)
    check_result "PASS" "Nginx已安装: $NGINX_VERSION"

    # 检查Nginx服务状态
    if systemctl is-active --quiet nginx; then
        check_result "PASS" "Nginx服务运行正常"
    else
        check_result "WARN" "Nginx服务未运行"
    fi

    # 检查Nginx配置语法
    if nginx -t &>/dev/null; then
        check_result "PASS" "Nginx配置语法正确"
    else
        check_result "WARN" "Nginx配置语法有误"
    fi
else
    check_result "FAIL" "Nginx未安装"
fi

# 检查目标域名配置
DOMAIN="bk.yushuo.click"
NGINX_CONF="/www/server/panel/vhost/nginx/${DOMAIN}.conf"
if [ -f "$NGINX_CONF" ]; then
    check_result "PASS" "域名 $DOMAIN 的Nginx配置文件存在"
else
    check_result "WARN" "域名 $DOMAIN 的Nginx配置文件不存在"
fi

echo ""

# ===============================================
# 8. 防火墙和安全检查
# ===============================================
echo "🔒 [8/8] 防火墙和安全检查..."

# 检查ufw (Ubuntu防火墙)
if command -v ufw &> /dev/null; then
    UFW_STATUS=$(ufw status | head -1)
    log_info "UFW状态: $UFW_STATUS"

    if echo "$UFW_STATUS" | grep -q "active"; then
        check_result "PASS" "UFW防火墙已启用"

        # 检查必要端口是否开放
        if ufw status | grep -q "80"; then
            check_result "PASS" "HTTP端口(80)已开放"
        else
            check_result "WARN" "HTTP端口(80)未开放"
        fi

        if ufw status | grep -q "443"; then
            check_result "PASS" "HTTPS端口(443)已开放"
        else
            check_result "WARN" "HTTPS端口(443)未开放"
        fi
    else
        check_result "WARN" "UFW防火墙未启用"
    fi
else
    # 检查iptables
    if command -v iptables &> /dev/null; then
        IPTABLES_RULES=$(iptables -L | wc -l)
        log_info "检测到iptables规则数: $IPTABLES_RULES"
        check_result "PASS" "使用iptables防火墙"
    else
        check_result "WARN" "未检测到活动的防火墙"
    fi
fi

echo ""

# ===============================================
# 检查结果汇总
# ===============================================
echo "=========================================="
echo "📊 Ubuntu/Debian环境检查结果汇总"
echo "=========================================="
echo ""
echo "总检查项: $TOTAL_CHECKS"
echo "✅ 通过: $PASSED_CHECKS"
echo "❌ 失败: $FAILED_CHECKS"
echo "⚠️  警告: $WARNING_CHECKS"
echo ""

# 计算通过率
if [ "$TOTAL_CHECKS" -gt 0 ]; then
    PASS_RATE=$(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))
    echo "通过率: $PASS_RATE%"
else
    PASS_RATE=0
fi

echo ""

# 给出部署建议
if [ "$FAILED_CHECKS" -eq 0 ] && [ "$WARNING_CHECKS" -le 3 ]; then
    echo "🎉 环境检查基本通过，建议继续部署！"
    DEPLOYMENT_READY=true
elif [ "$FAILED_CHECKS" -le 2 ]; then
    echo "⚠️  环境存在一些问题，建议修复后再部署"
    DEPLOYMENT_READY=false
else
    echo "❌ 环境存在严重问题，不建议直接部署"
    DEPLOYMENT_READY=false
fi

echo ""

# 生成修复建议
echo "🔧 Ubuntu/Debian系统修复建议:"
if [ "$FAILED_CHECKS" -gt 0 ]; then
    echo ""
    echo "关键问题修复:"

    # 检查宝塔面板
    if [ ! -d "/www/server/panel" ]; then
        echo "  1. 安装宝塔面板："
        echo "     wget -O install.sh http://download.bt.cn/install/install-ubuntu_6.0.sh && bash install.sh"
    fi

    # 检查Node.js
    if ! command -v node &> /dev/null || [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
        echo "  2. 安装/升级Node.js 18:"
        echo "     curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
        echo "     sudo apt-get install -y nodejs"
    fi

    # 检查Nginx
    if ! command -v nginx &> /dev/null; then
        echo "  3. 安装Nginx:"
        echo "     sudo apt update && sudo apt install -y nginx"
        echo "     或通过宝塔面板软件管理安装"
    fi
fi

if [ "$WARNING_CHECKS" -gt 0 ]; then
    echo ""
    echo "建议优化:"
    echo "  • 配置域名bk.yushuo.click的DNS解析"
    echo "  • 通过宝塔面板配置SSL证书"
    echo "  • 开放防火墙HTTP/HTTPS端口:"
    echo "    sudo ufw allow 80"
    echo "    sudo ufw allow 443"
    echo "  • 配置NPM国内镜像源:"
    echo "    npm config set registry https://registry.npm.taobao.org"
fi

echo ""
echo "📋 详细日志已保存到: $LOG_FILE"

# 如果环境就绪，提供部署命令
if [ "$DEPLOYMENT_READY" = true ]; then
    echo ""
    echo "🚀 下一步Ubuntu/Debian部署命令:"
    echo "   # 如果有baota-deploy.sh，请先编辑适配Ubuntu系统"
    echo "   # 或手动执行以下命令："
    echo "   cd /www/wwwroot/stock-tracker"
    echo "   npm install"
    echo "   npm run build"
    echo "   npm install -g pm2"
    echo "   pm2 start npm --name 'stock-tracker-v42' -- start"
fi

echo "=========================================="