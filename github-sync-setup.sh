#!/bin/bash

# =================================================================
# GitHub自动同步配置脚本
# 用于配置GitHub代码仓库与宝塔服务器的自动同步
# =================================================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# 配置变量
DOMAIN="yushuo.click"
PROJECT_PATH="/www/wwwroot/stock-tracker"
GITHUB_REPO="https://github.com/yushuo1991/911.git"
WEBHOOK_SECRET="stock_tracker_webhook_2024"
WEBHOOK_PORT="9999"

# 1. 配置SSH密钥（可选，用于私有仓库）
setup_ssh_keys() {
    log_info "配置SSH密钥..."

    if [ ! -f ~/.ssh/id_rsa ]; then
        log_info "生成SSH密钥对..."
        ssh-keygen -t rsa -b 4096 -C "stock-tracker@${DOMAIN}" -f ~/.ssh/id_rsa -N ""

        log_success "SSH密钥已生成"
        log_info "请将以下公钥添加到GitHub账户的SSH Keys中:"
        echo "========================================="
        cat ~/.ssh/id_rsa.pub
        echo "========================================="
        log_info "GitHub -> Settings -> SSH and GPG keys -> New SSH key"

        read -p "按Enter键继续..."
    else
        log_info "SSH密钥已存在"
    fi
}

# 2. 创建GitHub Webhook接收脚本
create_webhook_receiver() {
    log_info "创建GitHub Webhook接收器..."

    # 创建webhook目录
    mkdir -p /www/server/webhook

    # 创建Node.js webhook接收器
    cat > /www/server/webhook/github-webhook.js <<'EOF'
const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');
const fs = require('fs');

// 配置
const CONFIG = {
    port: process.env.WEBHOOK_PORT || 9999,
    secret: process.env.WEBHOOK_SECRET || 'stock_tracker_webhook_2024',
    projectPath: process.env.PROJECT_PATH || '/www/wwwroot/yushuo.click',
    logFile: '/www/server/webhook/webhook.log'
};

// 日志函数
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(logMessage.trim());
    fs.appendFileSync(CONFIG.logFile, logMessage);
}

// 验证签名
function verifySignature(body, signature, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(body);
    const calculatedSignature = 'sha256=' + hmac.digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(calculatedSignature));
}

// 执行部署命令
function deployProject() {
    return new Promise((resolve, reject) => {
        const deployScript = `
            cd /www/wwwroot/stock-tracker

            log_info() {
                echo "[INFO] $(date '+%Y-%m-%d %H:%M:%S') - $1"
            }

            log_error() {
                echo "[ERROR] $(date '+%Y-%m-%d %H:%M:%S') - $1"
            }

            log_info "开始自动部署..."

            # 备份当前状态
            if [ -n "$(git status --porcelain)" ]; then
                log_info "备份本地修改..."
                git stash push -m "auto-backup-$(date '+%Y%m%d_%H%M%S')"
            fi

            # 拉取最新代码
            log_info "拉取最新代码..."
            git fetch origin
            git reset --hard origin/main

            # 安装依赖
            log_info "安装依赖..."
            npm install --production

            # 构建项目
            log_info "构建项目..."
            npm run build

            if [ $? -eq 0 ]; then
                # 重启PM2服务
                log_info "重启服务..."
                pm2 restart stock-tracker
                log_info "部署完成!"
                echo "SUCCESS"
            else
                log_error "构建失败"
                echo "BUILD_FAILED"
                exit 1
            fi
        `;

        exec(deployScript, { shell: '/bin/bash' }, (error, stdout, stderr) => {
            if (error) {
                log(`部署失败: ${error.message}`);
                log(`stderr: ${stderr}`);
                reject(error);
            } else {
                log(`部署成功: ${stdout}`);
                resolve(stdout);
            }
        });
    });
}

// 创建HTTP服务器
const server = http.createServer(async (req, res) => {
    if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method Not Allowed');
        return;
    }

    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        try {
            // 验证GitHub签名
            const signature = req.headers['x-hub-signature-256'];
            if (!signature || !verifySignature(body, signature, CONFIG.secret)) {
                log('签名验证失败');
                res.writeHead(401, { 'Content-Type': 'text/plain' });
                res.end('Unauthorized');
                return;
            }

            // 解析payload
            const payload = JSON.parse(body);
            const event = req.headers['x-github-event'];

            log(`收到GitHub事件: ${event}`);

            // 只处理push事件到main分支
            if (event === 'push' && payload.ref === 'refs/heads/main') {
                log('检测到main分支push事件，开始自动部署...');

                try {
                    await deployProject();
                    log('自动部署成功完成');

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: true,
                        message: '部署成功',
                        timestamp: new Date().toISOString()
                    }));
                } catch (deployError) {
                    log(`自动部署失败: ${deployError.message}`);

                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        message: '部署失败',
                        error: deployError.message,
                        timestamp: new Date().toISOString()
                    }));
                }
            } else {
                log(`忽略事件: ${event} (分支: ${payload.ref || 'unknown'})`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: '事件已接收但未处理',
                    timestamp: new Date().toISOString()
                }));
            }

        } catch (error) {
            log(`处理webhook时出错: ${error.message}`);

            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                message: '请求处理失败',
                error: error.message,
                timestamp: new Date().toISOString()
            }));
        }
    });
});

// 启动服务器
server.listen(CONFIG.port, () => {
    log(`GitHub Webhook服务器启动成功，监听端口: ${CONFIG.port}`);
    log(`Webhook URL: http://your-server-ip:${CONFIG.port}/webhook`);
    log(`项目路径: ${CONFIG.projectPath}`);
});

// 错误处理
server.on('error', (error) => {
    log(`服务器错误: ${error.message}`);
});

process.on('uncaughtException', (error) => {
    log(`未捕获的异常: ${error.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
    log(`未处理的Promise拒绝: ${reason}`);
});
EOF

    log_success "Webhook接收器创建完成"
}

# 3. 创建PM2配置用于webhook服务
create_webhook_pm2_config() {
    log_info "创建Webhook PM2配置..."

    cat > /www/server/webhook/webhook-ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: 'github-webhook',
    script: '/www/server/webhook/github-webhook.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '100M',
    env: {
      NODE_ENV: 'production',
      WEBHOOK_PORT: '${WEBHOOK_PORT}',
      WEBHOOK_SECRET: '${WEBHOOK_SECRET}',
      PROJECT_PATH: '${PROJECT_PATH}'
    },
    error_file: '/www/server/webhook/logs/err.log',
    out_file: '/www/server/webhook/logs/out.log',
    log_file: '/www/server/webhook/logs/combined.log',
    time: true
  }]
};
EOF

    # 创建日志目录
    mkdir -p /www/server/webhook/logs

    log_success "Webhook PM2配置创建完成"
}

# 4. 配置防火墙开放webhook端口
configure_firewall() {
    log_info "配置防火墙开放Webhook端口..."

    # 开放webhook端口
    firewall-cmd --permanent --add-port=${WEBHOOK_PORT}/tcp 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true

    # 也通过iptables开放（兼容性）
    iptables -I INPUT -p tcp --dport ${WEBHOOK_PORT} -j ACCEPT 2>/dev/null || true

    log_success "防火墙配置完成"
}

# 5. 启动webhook服务
start_webhook_service() {
    log_info "启动GitHub Webhook服务..."

    cd /www/server/webhook

    # 停止现有服务
    pm2 stop github-webhook 2>/dev/null || true
    pm2 delete github-webhook 2>/dev/null || true

    # 启动新服务
    pm2 start webhook-ecosystem.config.js
    pm2 save

    log_success "GitHub Webhook服务已启动"
}

# 6. 创建手动同步脚本
create_manual_sync_script() {
    log_info "创建手动同步脚本..."

    cat > ${PROJECT_PATH}/manual-sync.sh <<'EOF'
#!/bin/bash

# 手动同步脚本
DOMAIN="yushuo.click"
PROJECT_PATH="/www/wwwroot/stock-tracker"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

cd /www/wwwroot/stock-tracker

log_info "开始手动同步GitHub代码..."

# 检查Git状态
if [ -n "$(git status --porcelain)" ]; then
    log_info "检测到本地修改，进行备份..."
    git stash push -m "manual-backup-$(date '+%Y%m%d_%H%M%S')"
fi

# 拉取最新代码
log_info "拉取GitHub最新代码..."
git fetch origin
git reset --hard origin/main

if [ $? -ne 0 ]; then
    log_error "代码拉取失败"
    exit 1
fi

# 安装/更新依赖
log_info "安装依赖..."
npm install --production

# 构建项目
log_info "构建项目..."
npm run build

if [ $? -eq 0 ]; then
    # 重启PM2服务
    log_info "重启服务..."
    pm2 restart stock-tracker

    log_success "手动同步完成!"
    log_info "应用已重启，请检查运行状态: pm2 status"
else
    log_error "构建失败，请检查代码问题"
    exit 1
fi
EOF

    chmod +x ${PROJECT_PATH}/manual-sync.sh

    log_success "手动同步脚本创建完成: ${PROJECT_PATH}/manual-sync.sh"
}

# 7. 创建GitHub webhook配置指南
create_github_guide() {
    log_info "生成GitHub Webhook配置指南..."

    cat > /www/server/webhook/github-webhook-guide.md <<EOF
# GitHub Webhook配置指南

## 1. 获取服务器信息

**Webhook URL**: \`http://107.173.154.147:${WEBHOOK_PORT}/webhook\`
**Secret**: \`${WEBHOOK_SECRET}\`

## 2. 在GitHub仓库中配置Webhook

1. 进入GitHub仓库: https://github.com/yushuo1991/911
2. 点击 **Settings** 选项卡
3. 在左侧菜单点击 **Webhooks**
4. 点击 **Add webhook** 按钮
5. 填写配置信息:
   - **Payload URL**: \`http://107.173.154.147:${WEBHOOK_PORT}/webhook\`
   - **Content type**: \`application/json\`
   - **Secret**: \`${WEBHOOK_SECRET}\`
   - **Which events**: 选择 \`Just the push event\`
   - **Active**: 勾选

## 3. 测试Webhook

配置完成后，在GitHub仓库进行一次push操作：

\`\`\`bash
# 在本地仓库中
echo "# 测试自动部署" >> README.md
git add README.md
git commit -m "测试自动部署功能"
git push origin main
\`\`\`

## 4. 检查部署状态

\`\`\`bash
# 查看Webhook日志
pm2 logs github-webhook

# 查看应用状态
pm2 status

# 查看Webhook服务日志
tail -f /www/server/webhook/webhook.log
\`\`\`

## 5. 故障排除

### Webhook服务未启动
\`\`\`bash
cd /www/server/webhook
pm2 start webhook-ecosystem.config.js
\`\`\`

### 端口被占用
\`\`\`bash
# 检查端口占用
netstat -tlnp | grep ${WEBHOOK_PORT}

# 修改端口号（编辑配置文件后重启）
pm2 restart github-webhook
\`\`\`

### 防火墙问题
\`\`\`bash
# 确保端口开放
firewall-cmd --list-ports
firewall-cmd --permanent --add-port=${WEBHOOK_PORT}/tcp
firewall-cmd --reload
\`\`\`

## 6. 手动同步方法

如果自动同步出现问题，可以使用手动同步：

\`\`\`bash
cd /www/wwwroot/stock-tracker
./manual-sync.sh
\`\`\`

## 7. 安全建议

1. **修改默认Secret**: 在生产环境中使用更复杂的密钥
2. **使用HTTPS**: 配置SSL证书后使用HTTPS URL
3. **IP白名单**: 在防火墙中限制GitHub的IP范围
4. **日志监控**: 定期检查webhook日志确保安全

## 8. GitHub IP范围（用于防火墙配置）

GitHub的Webhook IP范围可以通过API获取：
\`\`\`bash
curl -s https://api.github.com/meta | jq .hooks
\`\`\`

---
*配置完成时间: $(date '+%Y-%m-%d %H:%M:%S')*
EOF

    log_success "GitHub配置指南已生成: /www/server/webhook/github-webhook-guide.md"
}

# 8. 检查webhook服务状态
check_webhook_status() {
    log_info "检查Webhook服务状态..."

    # 检查PM2进程
    webhook_status=$(pm2 list | grep github-webhook | grep online || echo "")
    if [ -n "$webhook_status" ]; then
        log_success "Webhook PM2进程运行正常"
    else
        log_error "Webhook PM2进程未运行"
        return 1
    fi

    # 检查端口监听
    if netstat -tlnp | grep :${WEBHOOK_PORT} > /dev/null; then
        log_success "Webhook端口${WEBHOOK_PORT}监听正常"
    else
        log_error "Webhook端口${WEBHOOK_PORT}未监听"
        return 1
    fi

    # 测试HTTP响应
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:${WEBHOOK_PORT} | grep -q "405"; then
        log_success "Webhook HTTP服务响应正常"
    else
        log_warning "Webhook HTTP服务响应异常"
    fi

    return 0
}

# 主函数
main() {
    log_info "开始配置GitHub自动同步..."

    # 检查运行权限
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用root权限运行此脚本"
        exit 1
    fi

    # 检查项目目录
    if [ ! -d "$PROJECT_PATH" ]; then
        log_error "项目目录不存在: $PROJECT_PATH"
        log_info "请先运行主部署脚本"
        exit 1
    fi

    # 执行配置步骤
    setup_ssh_keys
    create_webhook_receiver
    create_webhook_pm2_config
    configure_firewall
    start_webhook_service
    create_manual_sync_script
    create_github_guide

    # 等待服务启动
    sleep 5
    check_webhook_status

    log_success "========================================="
    log_success "GitHub自动同步配置完成!"
    log_success "========================================="
    log_info "Webhook URL: http://107.173.154.147:${WEBHOOK_PORT}/webhook"
    log_info "Webhook Secret: ${WEBHOOK_SECRET}"
    log_info "配置指南: /www/server/webhook/github-webhook-guide.md"
    log_info "手动同步: ${PROJECT_PATH}/manual-sync.sh"
    log_info "查看日志: pm2 logs github-webhook"
    log_success "========================================="

    log_warning "重要: 请到GitHub仓库中配置Webhook!"
    log_info "1. 访问: https://github.com/yushuo1991/911/settings/hooks"
    log_info "2. 添加Webhook URL和Secret"
    log_info "3. 测试推送代码验证自动部署"
}

# 脚本入口
main "$@"