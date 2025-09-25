#!/bin/bash
# 服务器端GitHub同步脚本
# 需要在宝塔服务器上执行

echo "=== 服务器GitHub同步脚本 ==="
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "服务器: 107.173.154.147"

# 配置变量
REPO_URL="https://github.com/your-username/stock-tracker.git"  # 请替换为实际仓库地址
DEPLOY_PATH="/www/wwwroot/stock-tracker"
CONTAINER_NAME="stock-tracker-app"
IMAGE_NAME="stock-tracker:latest"

# 检查Git是否安装
if ! command -v git &> /dev/null; then
    echo "安装Git..."
    yum install -y git || apt-get update && apt-get install -y git
fi

# 初始化Git仓库（首次运行）
init_repo() {
    echo "初始化Git仓库..."
    cd /www/wwwroot/

    if [ -d "stock-tracker" ]; then
        echo "备份现有目录..."
        mv stock-tracker stock-tracker-backup-$(date +%Y%m%d_%H%M%S)
    fi

    git clone ${REPO_URL} stock-tracker
    cd stock-tracker
    echo "✅ Git仓库初始化完成"
}

# 同步最新代码
sync_code() {
    echo "同步最新代码..."
    cd ${DEPLOY_PATH}

    if [ ! -d ".git" ]; then
        echo "Git仓库不存在，重新初始化..."
        cd ..
        rm -rf stock-tracker
        git clone ${REPO_URL} stock-tracker
        cd stock-tracker
    else
        git fetch origin
        git reset --hard origin/main
        git pull origin main
    fi

    echo "当前版本: $(git log --oneline -1)"
    echo "✅ 代码同步完成"
}

# 部署应用
deploy_app() {
    echo "部署应用..."
    cd ${DEPLOY_PATH}

    # 停止旧容器
    docker stop ${CONTAINER_NAME} 2>/dev/null || true
    docker rm ${CONTAINER_NAME} 2>/dev/null || true

    # 构建镜像
    echo "构建Docker镜像..."
    docker build -t ${IMAGE_NAME} . 2>&1 | tee log/build-$(date +%Y%m%d_%H%M%S).log

    if [ $? -ne 0 ]; then
        echo "❌ 镜像构建失败"
        return 1
    fi

    # 设置数据目录
    mkdir -p data
    chmod 755 data
    chown -R 1001:1001 data

    # 启动容器
    docker run -d \
        --name ${CONTAINER_NAME} \
        --restart always \
        -p 3000:3000 \
        -v ${DEPLOY_PATH}/data:/app/data \
        -e NODE_ENV=production \
        -e PORT=3000 \
        -e HOSTNAME=0.0.0.0 \
        -e TUSHARE_TOKEN=2876ea85cb005fb5fa17c809a98174f2d5aae8b1f830110a5ead6211 \
        -e NEXT_PUBLIC_API_URL=http://bk.yushuo.click \
        -e NEXT_PUBLIC_API_BASE_URL=http://bk.yushuo.click/api \
        -e NEXTAUTH_SECRET=stock-tracker-secret-key-2024 \
        -e NEXTAUTH_URL=http://bk.yushuo.click \
        ${IMAGE_NAME}

    if [ $? -eq 0 ]; then
        echo "✅ 容器启动成功"

        # 等待服务启动
        echo "等待服务启动..."
        sleep 15

        # 测试连接
        for i in {1..10}; do
            if curl -s -f http://127.0.0.1:3000 >/dev/null 2>&1; then
                echo "✅ 服务运行正常"
                break
            fi
            echo "等待中... ($i/10)"
            sleep 3
        done

        # 重载Nginx
        nginx -t && nginx -s reload

        return 0
    else
        echo "❌ 容器启动失败"
        docker logs ${CONTAINER_NAME}
        return 1
    fi
}

# 主流程
main() {
    # 创建日志目录
    mkdir -p ${DEPLOY_PATH}/log

    # 记录开始时间
    echo "$(date) - 手动同步开始" >> ${DEPLOY_PATH}/log/sync.log

    # 检查是否首次运行
    if [ ! -d "${DEPLOY_PATH}" ]; then
        init_repo
    else
        sync_code
    fi

    # 部署应用
    if deploy_app; then
        echo "$(date) - 同步部署成功" >> ${DEPLOY_PATH}/log/sync.log
        echo ""
        echo "🎉 同步部署成功！"
        echo "🌍 访问地址: http://bk.yushuo.click"
        echo "🔗 API测试: http://bk.yushuo.click/api/stocks"
        echo ""
        echo "容器状态:"
        docker ps | grep ${CONTAINER_NAME}
    else
        echo "$(date) - 同步部署失败" >> ${DEPLOY_PATH}/log/sync.log
        echo "❌ 同步部署失败，请检查日志"
        exit 1
    fi
}

# 帮助信息
usage() {
    echo "用法: $0 [选项]"
    echo "选项:"
    echo "  init    - 初始化Git仓库"
    echo "  sync    - 同步代码"
    echo "  deploy  - 部署应用"
    echo "  status  - 查看状态"
    echo "  logs    - 查看日志"
    echo ""
    echo "示例:"
    echo "  $0          # 完整同步部署"
    echo "  $0 sync     # 仅同步代码"
    echo "  $0 status   # 查看容器状态"
}

# 处理命令行参数
case "${1:-}" in
    init)
        init_repo
        ;;
    sync)
        sync_code
        ;;
    deploy)
        deploy_app
        ;;
    status)
        echo "容器状态:"
        docker ps | grep ${CONTAINER_NAME}
        echo ""
        echo "服务测试:"
        curl -I http://127.0.0.1:3000 2>/dev/null || echo "服务无响应"
        ;;
    logs)
        echo "最近的同步日志:"
        tail -20 ${DEPLOY_PATH}/log/sync.log 2>/dev/null || echo "无日志文件"
        echo ""
        echo "容器日志:"
        docker logs --tail=20 ${CONTAINER_NAME} 2>/dev/null || echo "无容器日志"
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        main
        ;;
esac