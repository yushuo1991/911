#!/bin/bash
# 一键执行脚本 - 服务器端所有配置
# 在服务器 /www/wwwroot/stock-tracker/ 目录下执行

set -e  # 遇到错误立即停止

echo "========================================"
echo "🚀 Stock Tracker 一键配置脚本"
echo "========================================"
echo "服务器: 107.173.154.147"
echo "域名: bk.yushuo.click"
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否在正确目录
check_directory() {
    log_info "检查当前目录..."
    if [[ ! "$(pwd)" == "/www/wwwroot/stock-tracker" ]]; then
        log_error "请在 /www/wwwroot/stock-tracker 目录下执行此脚本"
        log_info "执行命令: cd /www/wwwroot/stock-tracker && ./一键执行.sh"
        exit 1
    fi
    log_success "目录检查通过"
}

# 检查必要命令
check_requirements() {
    log_info "检查系统依赖..."

    # 检查Git
    if ! command -v git &> /dev/null; then
        log_warning "Git未安装，正在安装..."
        yum install -y git || apt-get update && apt-get install -y git
    fi
    log_success "Git 已安装"

    # 检查Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    log_success "Docker 已安装"

    # 检查curl
    if ! command -v curl &> /dev/null; then
        log_warning "curl未安装，正在安装..."
        yum install -y curl || apt-get install -y curl
    fi
    log_success "curl 已安装"
}

# 设置文件权限
set_permissions() {
    log_info "设置文件权限..."
    chmod +x *.sh 2>/dev/null || true
    mkdir -p log
    chmod 755 log
    log_success "权限设置完成"
}

# 配置SSH密钥
configure_ssh() {
    log_info "配置SSH密钥..."

    # 确保.ssh目录存在
    mkdir -p ~/.ssh
    chmod 700 ~/.ssh

    # 生成SSH密钥
    if [[ ! -f ~/.ssh/id_rsa ]]; then
        log_info "生成新的SSH密钥..."
        ssh-keygen -t rsa -b 4096 -C "github-actions@stock-tracker" -f ~/.ssh/id_rsa -N ""
    fi

    # 添加到authorized_keys
    if [[ -f ~/.ssh/id_rsa.pub ]]; then
        cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys 2>/dev/null || true
        chmod 600 ~/.ssh/authorized_keys
    fi

    log_success "SSH密钥配置完成"
}

# 显示SSH私钥
display_ssh_key() {
    log_info "SSH私钥内容（复制到GitHub Secrets）:"
    echo "========================================"
    echo "Secrets名称: SERVER_SSH_KEY"
    echo "Secrets内容:"
    echo "========================================"
    cat ~/.ssh/id_rsa
    echo "========================================"
    echo ""
}

# 初始化Git仓库
init_git() {
    log_info "初始化Git仓库..."

    if [[ ! -d ".git" ]]; then
        git init
        log_success "Git仓库初始化完成"
    else
        log_success "Git仓库已存在"
    fi

    # 设置Git配置
    git config --local user.email "admin@stock-tracker.com" || true
    git config --local user.name "Stock Tracker Admin" || true
}

# 清理旧容器
cleanup_containers() {
    log_info "清理旧容器..."
    docker stop stock-tracker-app 2>/dev/null || true
    docker rm stock-tracker-app 2>/dev/null || true
    log_success "旧容器清理完成"
}

# 构建Docker镜像
build_image() {
    log_info "构建Docker镜像..."
    docker build -t stock-tracker:latest . 2>&1 | tee log/build-$(date +%Y%m%d_%H%M%S).log

    if [[ $? -eq 0 ]]; then
        log_success "Docker镜像构建成功"
    else
        log_error "Docker镜像构建失败，请检查日志"
        return 1
    fi
}

# 启动容器
start_container() {
    log_info "启动Docker容器..."

    # 确保数据目录存在
    mkdir -p data
    chmod 755 data
    chown -R 1001:1001 data 2>/dev/null || true

    # 启动容器
    docker run -d \
        --name stock-tracker-app \
        --restart always \
        -p 3000:3000 \
        -v $(pwd)/data:/app/data \
        -e NODE_ENV=production \
        -e PORT=3000 \
        -e HOSTNAME=0.0.0.0 \
        -e TUSHARE_TOKEN=2876ea85cb005fb5fa17c809a98174f2d5aae8b1f830110a5ead6211 \
        -e NEXT_PUBLIC_API_URL=http://bk.yushuo.click \
        -e NEXT_PUBLIC_API_BASE_URL=http://bk.yushuo.click/api \
        -e NEXTAUTH_SECRET=stock-tracker-secret-key-2024 \
        -e NEXTAUTH_URL=http://bk.yushuo.click \
        stock-tracker:latest

    if [[ $? -eq 0 ]]; then
        log_success "容器启动成功"
    else
        log_error "容器启动失败"
        return 1
    fi
}

# 健康检查
health_check() {
    log_info "执行健康检查..."

    # 等待服务启动
    sleep 15

    # 检查容器状态
    if docker ps | grep -q stock-tracker-app; then
        log_success "容器运行正常"
    else
        log_error "容器未运行"
        docker logs stock-tracker-app
        return 1
    fi

    # 检查服务响应
    for i in {1..10}; do
        if curl -s -f http://127.0.0.1:3000 >/dev/null 2>&1; then
            log_success "应用服务响应正常"
            break
        fi
        log_info "等待服务启动... ($i/10)"
        sleep 3
    done

    # 测试API
    log_info "测试API接口..."
    curl -I http://127.0.0.1:3000/api/stocks 2>/dev/null | head -1 || log_warning "API测试失败"
}

# 配置Nginx
configure_nginx() {
    log_info "重载Nginx配置..."
    nginx -t && nginx -s reload 2>/dev/null || log_warning "Nginx重载失败，请手动检查"
}

# 显示配置信息
display_config() {
    echo ""
    echo "========================================"
    log_success "🎉 一键配置完成！"
    echo "========================================"
    echo ""
    log_info "📋 GitHub Secrets 配置信息:"
    echo "   SERVER_HOST: 107.173.154.147"
    echo "   SERVER_USER: root"
    echo "   SERVER_SSH_KEY: (上面显示的私钥内容)"
    echo ""
    log_info "🌍 访问地址:"
    echo "   网站地址: http://bk.yushuo.click"
    echo "   API接口: http://bk.yushuo.click/api/stocks"
    echo ""
    log_info "📊 容器状态:"
    docker ps | grep stock-tracker-app || log_warning "容器未找到"
    echo ""
    log_info "📝 下一步操作:"
    echo "   1. 复制上面的SSH私钥到GitHub Secrets"
    echo "   2. 推送代码到GitHub测试自动部署"
    echo "   3. 查看GitHub Actions执行结果"
    echo ""
    echo "========================================"

    # 记录到日志
    echo "$(date) - 一键配置完成" >> log/setup.log
}

# 错误处理
error_handler() {
    log_error "脚本执行失败！"
    log_info "请查看上面的错误信息，或运行诊断脚本:"
    echo "   ./docker-debug.sh"
    exit 1
}

# 设置错误处理
trap error_handler ERR

# 主执行流程
main() {
    check_directory
    check_requirements
    set_permissions
    configure_ssh
    display_ssh_key
    init_git
    cleanup_containers
    build_image
    start_container
    health_check
    configure_nginx
    display_config
}

# 执行主流程
main

log_success "✨ 所有配置已完成，请按照提示配置GitHub Secrets！"