#!/bin/bash
# SSH密钥配置脚本 - 用于服务器端设置

echo "=== SSH密钥配置脚本 ==="
echo "服务器: 107.173.154.147"

# 生成SSH密钥对
generate_ssh_key() {
    echo "生成SSH密钥对..."

    # 检查是否已存在密钥
    if [ -f ~/.ssh/id_rsa ]; then
        echo "SSH密钥已存在，备份旧密钥..."
        cp ~/.ssh/id_rsa ~/.ssh/id_rsa.backup.$(date +%Y%m%d_%H%M%S)
        cp ~/.ssh/id_rsa.pub ~/.ssh/id_rsa.pub.backup.$(date +%Y%m%d_%H%M%S)
    fi

    # 生成新密钥
    ssh-keygen -t rsa -b 4096 -C "github-actions@stock-tracker" -f ~/.ssh/id_rsa -N ""

    echo "✅ SSH密钥生成完成"
    echo "公钥内容:"
    cat ~/.ssh/id_rsa.pub
    echo ""
    echo "私钥内容（用于GitHub Secrets）:"
    cat ~/.ssh/id_rsa
}

# 配置authorized_keys
setup_authorized_keys() {
    echo "配置authorized_keys..."

    # 确保.ssh目录存在且权限正确
    mkdir -p ~/.ssh
    chmod 700 ~/.ssh

    # 添加公钥到authorized_keys
    if [ -f ~/.ssh/id_rsa.pub ]; then
        cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
        chmod 600 ~/.ssh/authorized_keys
        echo "✅ authorized_keys配置完成"
    else
        echo "❌ 公钥文件不存在"
        return 1
    fi
}

# 创建部署用户（如果需要）
create_deploy_user() {
    local username=${1:-deploy}
    echo "创建部署用户: $username"

    # 检查用户是否存在
    if id "$username" >/dev/null 2>&1; then
        echo "用户 $username 已存在"
    else
        # 创建用户
        useradd -m -s /bin/bash $username
        echo "✅ 用户 $username 创建完成"
    fi

    # 添加sudo权限
    echo "$username ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/$username

    # 为用户设置SSH密钥
    sudo -u $username mkdir -p /home/$username/.ssh
    sudo -u $username ssh-keygen -t rsa -b 4096 -C "deploy@stock-tracker" -f /home/$username/.ssh/id_rsa -N ""
    sudo -u $username cp /home/$username/.ssh/id_rsa.pub /home/$username/.ssh/authorized_keys
    sudo -u $username chmod 600 /home/$username/.ssh/authorized_keys
    sudo -u $username chmod 700 /home/$username/.ssh

    echo "部署用户密钥:"
    echo "公钥:"
    cat /home/$username/.ssh/id_rsa.pub
    echo ""
    echo "私钥（用于GitHub Secrets）:"
    cat /home/$username/.ssh/id_rsa
}

# 测试SSH连接
test_ssh_connection() {
    local host=${1:-107.173.154.147}
    local user=${2:-root}

    echo "测试SSH连接..."
    ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $user@$host "echo 'SSH连接测试成功'"

    if [ $? -eq 0 ]; then
        echo "✅ SSH连接正常"
    else
        echo "❌ SSH连接失败"
    fi
}

# 显示GitHub Secrets配置信息
show_github_secrets() {
    echo ""
    echo "=== GitHub Secrets 配置信息 ==="
    echo ""
    echo "请在GitHub仓库设置中添加以下Secrets："
    echo ""
    echo "1. SERVER_HOST"
    echo "   值: 107.173.154.147"
    echo ""
    echo "2. SERVER_USER"
    echo "   值: root  (或部署用户名)"
    echo ""
    echo "3. SERVER_SSH_KEY"
    echo "   值: 私钥内容 (复制下面的内容)"
    echo "---BEGIN SSH PRIVATE KEY---"

    if [ -f ~/.ssh/id_rsa ]; then
        cat ~/.ssh/id_rsa
    else
        echo "❌ 私钥文件不存在，请先生成SSH密钥"
    fi

    echo "---END SSH PRIVATE KEY---"
    echo ""
    echo "配置路径: GitHub仓库 → Settings → Secrets and variables → Actions → New repository secret"
}

# 主菜单
main_menu() {
    echo ""
    echo "=== SSH配置选项 ==="
    echo "1. 生成SSH密钥对"
    echo "2. 配置authorized_keys"
    echo "3. 创建部署用户"
    echo "4. 测试SSH连接"
    echo "5. 显示GitHub Secrets配置"
    echo "6. 一键完成所有配置"
    echo "0. 退出"
    echo ""
    read -p "请选择操作 [1-6]: " choice

    case $choice in
        1) generate_ssh_key ;;
        2) setup_authorized_keys ;;
        3)
            read -p "输入部署用户名 (默认: deploy): " username
            create_deploy_user ${username:-deploy}
            ;;
        4)
            read -p "输入服务器IP (默认: 107.173.154.147): " host
            read -p "输入用户名 (默认: root): " user
            test_ssh_connection ${host:-107.173.154.147} ${user:-root}
            ;;
        5) show_github_secrets ;;
        6)
            echo "执行一键配置..."
            generate_ssh_key
            setup_authorized_keys
            show_github_secrets
            echo "✅ 一键配置完成"
            ;;
        0) exit 0 ;;
        *) echo "无效选择" ;;
    esac
}

# 处理命令行参数
case "${1:-}" in
    generate)
        generate_ssh_key
        ;;
    setup)
        setup_authorized_keys
        ;;
    user)
        create_deploy_user ${2:-deploy}
        ;;
    test)
        test_ssh_connection ${2:-107.173.154.147} ${3:-root}
        ;;
    secrets)
        show_github_secrets
        ;;
    auto)
        generate_ssh_key
        setup_authorized_keys
        show_github_secrets
        ;;
    *)
        main_menu
        ;;
esac