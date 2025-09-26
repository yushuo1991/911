#!/bin/bash

# 服务器环境检测脚本 - 股票追踪系统v4.2
# 创建时间: 2025-09-26
# 用途: 部署前环境检测和问题诊断

set -e

echo "=========================================="
echo "股票追踪系统v4.2 - 服务器环境检测"
echo "=========================================="
echo ""

# 创建日志目录
LOG_DIR="/tmp/stock-tracker-env-check"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/env-check-$(date +%Y%m%d_%H%M%S).log"

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

log_info "开始环境检测，日志文件: $LOG_FILE"
echo ""

# ===============================================
# 1. 系统基础环境检查
# ===============================================
echo "🔍 [1/8] 系统基础环境检查..."

# 检查操作系统
if [ -f /etc/os-release ]; then
    OS_INFO=$(grep PRETTY_NAME /etc/os-release | cut -d'"' -f2)
    log_info "操作系统: $OS_INFO"

    # 检查是否为支持的系统
    if echo "$OS_INFO" | grep -qE "(CentOS|Ubuntu|Red Hat|Rocky|AlmaLinux)"; then
        check_result "PASS" "操作系统支持: $OS_INFO"
    else
        check_result "WARN" "未测试的操作系统: $OS_INFO"
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

    # 检查宝塔面板版本
    if [ -f "/www/server/panel/class/config.py" ]; then
        BT_VERSION=$(python3 -c "import sys; sys.path.append('/www/server/panel'); from class.config import config; print(config().get_version())" 2>/dev/null || echo "未知")
        log_info "宝塔面板版本: $BT_VERSION"
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
    check_result "WARN" "PM2未安装 (将在部署时自动安装)"
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
DOMAIN="yushuo.click"
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

# 检查firewalld
if systemctl is-active --quiet firewalld; then
    check_result "PASS" "Firewalld防火墙运行中"

    # 检查HTTP和HTTPS端口是否开放
    if firewall-cmd --query-service=http &>/dev/null; then
        check_result "PASS" "HTTP服务已在防火墙中开放"
    else
        check_result "WARN" "HTTP服务未在防火墙中开放"
    fi

    if firewall-cmd --query-service=https &>/dev/null; then
        check_result "PASS" "HTTPS服务已在防火墙中开放"
    else
        check_result "WARN" "HTTPS服务未在防火墙中开放"
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

# 检查SELinux
if command -v getenforce &> /dev/null; then
    SELINUX_STATUS=$(getenforce)
    if [ "$SELINUX_STATUS" = "Enforcing" ]; then
        check_result "WARN" "SELinux状态: $SELINUX_STATUS (可能需要配置策略)"
    else
        check_result "PASS" "SELinux状态: $SELINUX_STATUS"
    fi
fi

echo ""

# ===============================================
# 检查结果汇总
# ===============================================
echo "=========================================="
echo "📊 环境检查结果汇总"
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
echo "🔧 修复建议:"
if [ "$FAILED_CHECKS" -gt 0 ]; then
    echo ""
    echo "关键问题修复:"

    # 检查宝塔面板
    if [ ! -d "/www/server/panel" ]; then
        echo "  1. 安装宝塔面板："
        echo "     curl -sSO https://download.bt.cn/install/install_panel.sh && bash install_panel.sh"
    fi

    # 检查Node.js
    if ! command -v node &> /dev/null || [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
        echo "  2. 安装/升级Node.js 18:"
        echo "     curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -"
        echo "     yum install -y nodejs  # CentOS/RHEL"
        echo "     apt install -y nodejs  # Ubuntu/Debian"
    fi

    # 检查Nginx
    if ! command -v nginx &> /dev/null; then
        echo "  3. 通过宝塔面板软件管理安装Nginx"
    fi
fi

if [ "$WARNING_CHECKS" -gt 0 ]; then
    echo ""
    echo "建议优化:"
    echo "  • 配置域名SSL证书"
    echo "  • 开放防火墙HTTP/HTTPS端口"
    echo "  • 配置NPM国内镜像源加速依赖下载"
fi

echo ""
echo "📋 详细日志已保存到: $LOG_FILE"

# 如果环境就绪，提供部署命令
if [ "$DEPLOYMENT_READY" = true ]; then
    echo ""
    echo "🚀 下一步部署命令:"
    echo "   wget https://raw.githubusercontent.com/shishen168/stock-tracker/main/baota-deploy.sh"
    echo "   chmod +x baota-deploy.sh"
    echo "   sudo ./baota-deploy.sh"
fi

echo "=========================================="