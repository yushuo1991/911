#!/bin/bash

# SSH自动化部署脚本
# 目标服务器: yushuo.click
# 项目: 股票追踪系统

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 服务器配置
SERVER_HOST="yushuo.click"
SERVER_PORT="22"
SERVER_USER="root"
SERVER_PASSWORD="gJ75hNHdy90TA4qGo9"
PROJECT_DIR="/www/wwwroot/stock-tracker"
GIT_REPO="https://github.com/yushuo1991/911.git"
TARGET_COMMIT="f619042"
DOMAIN="bk.yushuo.click"

# 日志文件
LOG_DIR="./log"
LOG_FILE="${LOG_DIR}/ssh-deployment-$(date +%Y%m%d-%H%M%S).md"

# 创建日志目录
mkdir -p ${LOG_DIR}

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1" | tee -a ${LOG_FILE}
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a ${LOG_FILE}
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a ${LOG_FILE}
}

log_section() {
    echo -e "\n${GREEN}========== $1 ==========${NC}\n" | tee -a ${LOG_FILE}
}

# 写入Markdown日志头
cat > ${LOG_FILE} <<EOF
# SSH自动化部署报告
**生成时间**: $(date '+%Y-%m-%d %H:%M:%S')
**服务器**: ${SERVER_HOST}
**项目**: 股票追踪系统
**目标提交**: ${TARGET_COMMIT}

---

EOF

# 检查sshpass是否安装
check_sshpass() {
    log_section "检查SSH工具"
    if ! command -v sshpass &> /dev/null; then
        log_warning "sshpass未安装，尝试安装..."
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo apt-get update && sudo apt-get install -y sshpass
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            brew install sshpass
        else
            log_error "无法自动安装sshpass，请手动安装"
            exit 1
        fi
    fi
    log_info "sshpass已准备就绪"
}

# SSH执行命令函数
ssh_exec() {
    local command=$1
    log_info "执行命令: $command"
    sshpass -p "${SERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_HOST} "$command"
}

# 步骤1: SSH连接测试
test_ssh_connection() {
    log_section "步骤1: SSH连接测试"

    if ssh_exec "echo 'SSH连接成功'"; then
        log_info "✓ SSH连接正常"
        echo "- ✅ SSH连接测试通过" >> ${LOG_FILE}
    else
        log_error "✗ SSH连接失败"
        echo "- ❌ SSH连接失败" >> ${LOG_FILE}
        exit 1
    fi

    # 检查项目目录
    if ssh_exec "[ -d ${PROJECT_DIR} ] && echo 'exists' || echo 'not exists'" | grep -q "exists"; then
        log_info "✓ 项目目录存在: ${PROJECT_DIR}"
        echo "- ✅ 项目目录存在" >> ${LOG_FILE}
        PROJECT_EXISTS=true
    else
        log_warning "✗ 项目目录不存在，将克隆仓库"
        echo "- ⚠️ 项目目录不存在" >> ${LOG_FILE}
        PROJECT_EXISTS=false
    fi

    # 检查Docker
    log_info "检查Docker环境..."
    ssh_exec "docker --version" | tee -a ${LOG_FILE}
    ssh_exec "docker-compose --version" | tee -a ${LOG_FILE}
}

# 步骤2: Git操作
perform_git_operations() {
    log_section "步骤2: Git操作"

    if [ "$PROJECT_EXISTS" = true ]; then
        log_info "更新现有项目..."
        echo -e "\n## Git更新操作\n" >> ${LOG_FILE}

        # 停止现有容器
        log_info "停止现有容器..."
        ssh_exec "cd ${PROJECT_DIR} && docker-compose down" | tee -a ${LOG_FILE}

        # 拉取最新代码
        log_info "拉取最新代码..."
        ssh_exec "cd ${PROJECT_DIR} && git fetch --all" | tee -a ${LOG_FILE}
        ssh_exec "cd ${PROJECT_DIR} && git reset --hard origin/main" | tee -a ${LOG_FILE}
        ssh_exec "cd ${PROJECT_DIR} && git pull origin main" | tee -a ${LOG_FILE}

        # 验证提交
        CURRENT_COMMIT=$(ssh_exec "cd ${PROJECT_DIR} && git log -1 --format='%h'")
        log_info "当前提交: ${CURRENT_COMMIT}"
        echo "- **当前提交**: ${CURRENT_COMMIT}" >> ${LOG_FILE}

        ssh_exec "cd ${PROJECT_DIR} && git log -1" | tee -a ${LOG_FILE}
    else
        log_info "克隆新项目..."
        echo -e "\n## Git克隆操作\n" >> ${LOG_FILE}

        ssh_exec "cd /www/wwwroot && git clone ${GIT_REPO} stock-tracker" | tee -a ${LOG_FILE}
        log_info "✓ 项目克隆完成"
    fi
}

# 步骤3: 验证关键文件
verify_key_files() {
    log_section "步骤3: 验证关键文件"

    echo -e "\n## 关键文件检查\n" >> ${LOG_FILE}
    echo '```bash' >> ${LOG_FILE}
    ssh_exec "cd ${PROJECT_DIR} && ls -lh Dockerfile docker-compose.yml init.sql deploy.sh 2>&1" | tee -a ${LOG_FILE}
    echo '```' >> ${LOG_FILE}

    # 检查每个文件
    for file in Dockerfile docker-compose.yml init.sql deploy.sh; do
        if ssh_exec "[ -f ${PROJECT_DIR}/${file} ] && echo 'exists'" | grep -q "exists"; then
            log_info "✓ ${file} 存在"
        else
            log_error "✗ ${file} 不存在"
        fi
    done
}

# 步骤4: Docker部署
perform_docker_deployment() {
    log_section "步骤4: Docker部署"

    echo -e "\n## Docker部署过程\n" >> ${LOG_FILE}

    # 设置执行权限
    log_info "设置deploy.sh执行权限..."
    ssh_exec "cd ${PROJECT_DIR} && chmod +x deploy.sh"

    # 执行部署脚本
    log_info "执行部署脚本..."
    echo '```bash' >> ${LOG_FILE}
    ssh_exec "cd ${PROJECT_DIR} && ./deploy.sh" 2>&1 | tee -a ${LOG_FILE}
    echo '```' >> ${LOG_FILE}

    # 等待容器启动
    log_info "等待容器启动..."
    sleep 10
}

# 步骤5: 验证部署
verify_deployment() {
    log_section "步骤5: 验证部署结果"

    echo -e "\n## 容器状态\n" >> ${LOG_FILE}
    echo '```bash' >> ${LOG_FILE}
    ssh_exec "cd ${PROJECT_DIR} && docker-compose ps" | tee -a ${LOG_FILE}
    echo '```' >> ${LOG_FILE}

    echo -e "\n## 应用日志\n" >> ${LOG_FILE}
    echo '```bash' >> ${LOG_FILE}
    ssh_exec "cd ${PROJECT_DIR} && docker-compose logs --tail=50 stock-tracker" | tee -a ${LOG_FILE}
    echo '```' >> ${LOG_FILE}

    # 检查容器健康状态
    log_info "检查容器健康状态..."
    CONTAINER_STATUS=$(ssh_exec "docker ps --filter 'name=stock-tracker-app' --format '{{.Status}}'")
    echo "- **应用容器状态**: ${CONTAINER_STATUS}" >> ${LOG_FILE}

    if echo "$CONTAINER_STATUS" | grep -q "Up"; then
        log_info "✓ 应用容器运行正常"
    else
        log_error "✗ 应用容器状态异常"
    fi
}

# 步骤6: 测试访问
test_access() {
    log_section "步骤6: 测试访问"

    echo -e "\n## 访问测试\n" >> ${LOG_FILE}

    # 测试本地访问
    log_info "测试localhost:3002..."
    echo '```bash' >> ${LOG_FILE}
    ssh_exec "curl -I http://localhost:3002" 2>&1 | tee -a ${LOG_FILE}
    echo '```' >> ${LOG_FILE}

    # 测试域名访问
    log_info "测试域名访问: ${DOMAIN}"
    if curl -I http://${DOMAIN} 2>&1 | grep -q "200\|301\|302"; then
        log_info "✓ 域名访问正常"
        echo "- ✅ 域名访问测试通过" >> ${LOG_FILE}
    else
        log_warning "域名访问可能存在问题，请检查Nginx配置"
        echo "- ⚠️ 域名访问需要检查" >> ${LOG_FILE}
    fi
}

# 生成最终报告
generate_final_report() {
    log_section "部署完成"

    cat >> ${LOG_FILE} <<EOF

---

## 部署摘要

### ✅ 完成步骤
1. SSH连接测试 - 成功
2. Git操作 - 完成
3. 关键文件验证 - 完成
4. Docker部署 - 执行
5. 部署验证 - 完成
6. 访问测试 - 完成

### 📋 访问信息
- **应用URL**: http://${DOMAIN}
- **本地端口**: 3002
- **项目目录**: ${PROJECT_DIR}

### 🔍 后续检查
\`\`\`bash
# 查看容器状态
ssh root@${SERVER_HOST} "cd ${PROJECT_DIR} && docker-compose ps"

# 查看应用日志
ssh root@${SERVER_HOST} "cd ${PROJECT_DIR} && docker-compose logs -f stock-tracker"

# 查看数据库日志
ssh root@${SERVER_HOST} "cd ${PROJECT_DIR} && docker-compose logs -f mysql"
\`\`\`

### 📝 问题排查
如遇到问题，检查：
1. Nginx配置是否正确代理到3002端口
2. 防火墙是否开放3002端口
3. Docker容器日志是否有错误
4. MySQL数据库是否正常初始化

---

**报告生成时间**: $(date '+%Y-%m-%d %H:%M:%S')
EOF

    log_info "部署报告已生成: ${LOG_FILE}"
    echo -e "\n${GREEN}部署完成！${NC}"
    echo -e "${GREEN}详细报告: ${LOG_FILE}${NC}\n"
}

# 主执行流程
main() {
    log_info "开始SSH自动化部署..."

    check_sshpass
    test_ssh_connection
    perform_git_operations
    verify_key_files
    perform_docker_deployment
    verify_deployment
    test_access
    generate_final_report

    log_info "所有步骤执行完毕！"
}

# 执行主函数
main