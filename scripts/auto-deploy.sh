#!/bin/bash

# 股票追踪系统自动部署脚本
# 用于服务器端接收GitHub更新并自动部署

PROJECT_DIR="/www/wwwroot/stock-tracker"
BACKUP_DIR="/www/backups/stock-tracker"
LOG_FILE="/www/wwwroot/stock-tracker/logs/deploy.log"
WEBHOOK_PORT=3001

echo "=========================================="
echo "股票追踪系统自动部署配置"
echo "服务器: 107.173.154.147"
echo "时间: $(date)"
echo "=========================================="

# 创建必要目录
echo "1. 创建必要目录..."
mkdir -p $BACKUP_DIR
mkdir -p $(dirname $LOG_FILE)
mkdir -p /www/wwwroot/stock-tracker/logs

# 创建部署脚本
echo "2. 创建部署脚本..."
cat > $PROJECT_DIR/scripts/deploy.sh << 'EOF'
#!/bin/bash

# 自动部署执行脚本
PROJECT_DIR="/www/wwwroot/stock-tracker"
BACKUP_DIR="/www/backups/stock-tracker"
LOG_FILE="/www/wwwroot/stock-tracker/logs/deploy.log"

echo "[$(date)] ========== 开始自动部署 ==========" >> $LOG_FILE

# 函数：记录日志
log() {
    echo "[$(date)] $1" >> $LOG_FILE
    echo "$1"
}

# 函数：错误处理
handle_error() {
    log "错误: $1"
    log "部署失败，请检查日志"
    exit 1
}

# 检查项目目录
if [ ! -d "$PROJECT_DIR" ]; then
    handle_error "项目目录不存在: $PROJECT_DIR"
fi

cd $PROJECT_DIR

# 创建备份
log "创建代码备份..."
BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
cp -r . "$BACKUP_DIR/$BACKUP_NAME" || handle_error "创建备份失败"

# 保留最近10个备份
ls -dt $BACKUP_DIR/backup-* 2>/dev/null | tail -n +11 | xargs rm -rf 2>/dev/null

# 检查Git状态
log "检查Git仓库状态..."
if [ ! -d ".git" ]; then
    handle_error "不是Git仓库"
fi

# 停止应用
log "停止应用..."
pm2 stop stock-tracker 2>/dev/null || log "PM2应用未运行"

# 拉取最新代码
log "拉取最新代码..."
git fetch origin main || handle_error "Git fetch失败"
git reset --hard origin/main || handle_error "Git reset失败"

# 检查package.json变化
if git diff HEAD~1 HEAD --name-only | grep -q "package.json"; then
    log "检测到package.json变化，重新安装依赖..."
    npm ci --production || handle_error "npm install失败"
else
    log "package.json无变化，跳过依赖安装"
fi

# 构建项目
log "构建项目..."
npm run build || handle_error "项目构建失败"

# 检查数据库连接
log "检查数据库连接..."
mysql -u stock_user -pStockPass123! stock_db -e "SELECT 1;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    log "警告: 数据库连接失败，但继续部署"
else
    log "数据库连接正常"
fi

# 启动应用
log "启动应用..."
pm2 start ecosystem.config.js || handle_error "应用启动失败"

# 等待应用启动
log "等待应用启动..."
sleep 15

# 健康检查
log "执行健康检查..."
HEALTH_CHECK_SUCCESS=false

for i in {1..10}; do
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log "健康检查通过"
        HEALTH_CHECK_SUCCESS=true
        break
    else
        log "健康检查失败，重试 $i/10"
        sleep 3
    fi
done

if [ "$HEALTH_CHECK_SUCCESS" = false ]; then
    log "健康检查最终失败，回滚到备份版本"
    pm2 stop stock-tracker
    rm -rf ./* ..*
    cp -r "$BACKUP_DIR/$BACKUP_NAME/"* .
    cp -r "$BACKUP_DIR/$BACKUP_NAME/".* . 2>/dev/null || true
    pm2 start ecosystem.config.js
    handle_error "部署失败，已回滚到备份版本"
fi

# 测试API
log "测试API响应..."
API_RESPONSE=$(curl -s "http://localhost:3000/api/stocks?date=$(date +%Y-%m-%d)")
if echo "$API_RESPONSE" | grep -q '"success":true'; then
    log "API测试通过"
else
    log "警告: API测试失败，但应用已启动"
fi

# 重启Nginx
log "重启Nginx..."
systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null || log "Nginx重启失败"

# 清理旧的构建缓存
log "清理缓存..."
npm run clean 2>/dev/null || true

log "========== 部署成功完成 =========="
log "应用地址: http://bk.yushuo.click"
log "API测试: http://bk.yushuo.click/api/stocks"
log "部署时间: $(date)"
EOF

# 创建Webhook接收器
echo "3. 创建Webhook接收器..."
cat > $PROJECT_DIR/scripts/webhook-server.js << 'EOF'
const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');
const fs = require('fs');

const PORT = 3001;
const SECRET = 'github-webhook-secret-2025'; // 与GitHub设置保持一致
const DEPLOY_SCRIPT = '/www/wwwroot/stock-tracker/scripts/deploy.sh';
const LOG_FILE = '/www/wwwroot/stock-tracker/logs/webhook.log';

// 日志函数
function log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    console.log(logEntry.trim());
    fs.appendFileSync(LOG_FILE, logEntry, { flag: 'a' });
}

// 验证GitHub签名
function verifySignature(body, signature) {
    const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', SECRET)
        .update(body)
        .digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

// 执行部署
function deploy() {
    log('开始执行部署脚本...');

    exec(`bash ${DEPLOY_SCRIPT}`, (error, stdout, stderr) => {
        if (error) {
            log(`部署失败: ${error.message}`);
            return;
        }

        if (stderr) {
            log(`部署警告: ${stderr}`);
        }

        log(`部署输出: ${stdout}`);
        log('部署脚本执行完成');
    });
}

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
    }

    if (req.url !== '/webhook') {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
        return;
    }

    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        try {
            const signature = req.headers['x-hub-signature-256'];

            if (!signature) {
                log('缺少GitHub签名');
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Missing signature' }));
                return;
            }

            if (!verifySignature(body, signature)) {
                log('GitHub签名验证失败');
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid signature' }));
                return;
            }

            const payload = JSON.parse(body);

            // 只处理push到main分支的事件
            if (payload.ref === 'refs/heads/main') {
                log(`收到GitHub push事件: ${payload.head_commit.message}`);
                log(`提交SHA: ${payload.head_commit.id}`);

                // 延迟5秒执行部署，避免GitHub还在处理
                setTimeout(() => {
                    deploy();
                }, 5000);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    message: 'Deployment triggered',
                    commit: payload.head_commit.id
                }));
            } else {
                log(`忽略非main分支的push: ${payload.ref}`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Ignored non-main branch' }));
            }

        } catch (error) {
            log(`处理webhook失败: ${error.message}`);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    log(`Webhook服务器启动在端口 ${PORT}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
    log('收到SIGTERM信号，关闭服务器...');
    server.close(() => {
        log('Webhook服务器已关闭');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    log('收到SIGINT信号，关闭服务器...');
    server.close(() => {
        log('Webhook服务器已关闭');
        process.exit(0);
    });
});
EOF

# 创建Webhook服务的PM2配置
echo "4. 创建Webhook服务配置..."
cat > $PROJECT_DIR/ecosystem-webhook.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'stock-tracker-webhook',
    script: '/www/wwwroot/stock-tracker/scripts/webhook-server.js',
    cwd: '/www/wwwroot/stock-tracker',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '200M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    out_file: '/www/wwwroot/stock-tracker/logs/webhook-out.log',
    error_file: '/www/wwwroot/stock-tracker/logs/webhook-error.log',
    log_file: '/www/wwwroot/stock-tracker/logs/webhook-combined.log',
    time: true
  }]
};
EOF

# 设置脚本权限
echo "5. 设置脚本权限..."
chmod +x $PROJECT_DIR/scripts/deploy.sh
chmod +x $PROJECT_DIR/scripts/webhook-server.js

# 创建防火墙规则（开放3001端口）
echo "6. 配置防火墙..."
if command -v ufw >/dev/null 2>&1; then
    ufw allow 3001/tcp
    echo "已开放3001端口（ufw）"
elif command -v firewall-cmd >/dev/null 2>&1; then
    firewall-cmd --permanent --add-port=3001/tcp
    firewall-cmd --reload
    echo "已开放3001端口（firewall-cmd）"
else
    echo "警告: 未找到防火墙管理工具，请手动开放3001端口"
fi

# 启动Webhook服务
echo "7. 启动Webhook服务..."
cd $PROJECT_DIR
pm2 start ecosystem-webhook.config.js

echo ""
echo "=========================================="
echo "GitHub自动部署配置完成！"
echo "=========================================="
echo ""
echo "📋 配置总结:"
echo "• Webhook服务: http://107.173.154.147:3001/webhook"
echo "• 部署日志: $LOG_FILE"
echo "• Webhook日志: /www/wwwroot/stock-tracker/logs/webhook.log"
echo "• 备份目录: $BACKUP_DIR"
echo ""
echo "🔧 下一步操作:"
echo "1. 在GitHub仓库设置中配置Webhook:"
echo "   - URL: http://107.173.154.147:3001/webhook"
echo "   - Secret: github-webhook-secret-2025"
echo "   - 事件: push"
echo ""
echo "2. 配置GitHub Actions Secrets:"
echo "   - SERVER_HOST: 107.173.154.147"
echo "   - SERVER_USER: root"
echo "   - SERVER_SSH_KEY: (SSH私钥)"
echo "   - SERVER_PORT: 22"
echo ""
echo "3. 测试自动部署:"
echo "   - 推送代码到main分支"
echo "   - 观察日志: tail -f $LOG_FILE"
echo ""
echo "🔍 状态检查命令:"
echo "• 查看Webhook服务: pm2 status"
echo "• 查看部署日志: tail -f $LOG_FILE"
echo "• 查看Webhook日志: tail -f /www/wwwroot/stock-tracker/logs/webhook.log"
echo "• 测试Webhook: curl http://localhost:3001/webhook"
echo ""
echo "=========================================="