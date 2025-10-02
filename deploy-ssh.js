const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();

// Log file path
const logFile = path.join(__dirname, 'log', `deployment-${new Date().toISOString().split('T')[0]}.log`);

// Ensure log directory exists
if (!fs.existsSync(path.join(__dirname, 'log'))) {
    fs.mkdirSync(path.join(__dirname, 'log'));
}

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(message);
    fs.appendFileSync(logFile, logMessage);
}

const deploymentCommands = `
cd /www/wwwroot/stock-tracker
echo "=== 📦 开始部署 股票追踪系统 v4.1-docker ==="
echo ""
echo "▶ 检查当前Git状态..."
git status
echo ""
echo "▶ 拉取最新代码..."
git fetch --all
git reset --hard origin/main
git pull origin main
echo ""
echo "▶ 验证关键文件..."
ls -lh Dockerfile docker-compose.yml deploy.sh init.sql
echo ""
echo "▶ 停止旧容器（如果存在）..."
docker-compose down 2>/dev/null || echo "没有运行中的容器"
echo ""
echo "▶ 执行Docker部署..."
chmod +x deploy.sh
./deploy.sh
echo ""
echo "⏳ 等待服务启动（30秒）..."
sleep 30
echo ""
echo "▶ 检查容器状态..."
docker-compose ps
echo ""
echo "▶ 查看应用日志（最近50行）..."
docker-compose logs --tail=50 stock-tracker
echo ""
echo "▶ 测试本地访问..."
curl -I http://localhost:3002
echo ""
echo "✅ 部署完成！"
echo "🌐 访问地址: http://bk.yushuo.click"
`;

log('=== SSH Deployment Script Started ===');
log(`Connecting to yushuo.click (75.2.60.5:22) as root...`);

conn.on('ready', () => {
    log('✅ SSH Connection established successfully!');

    conn.exec(deploymentCommands, (err, stream) => {
        if (err) {
            log(`❌ Error executing commands: ${err.message}`);
            conn.end();
            process.exit(1);
        }

        let stdout = '';
        let stderr = '';

        stream.on('close', (code, signal) => {
            log(`\n=== Command execution finished ===`);
            log(`Exit code: ${code}`);
            if (signal) log(`Signal: ${signal}`);

            if (code === 0) {
                log('\n✅ Deployment completed successfully!');
            } else {
                log('\n⚠️ Deployment completed with warnings or errors.');
            }

            conn.end();
        }).on('data', (data) => {
            const output = data.toString();
            stdout += output;
            process.stdout.write(output);
            fs.appendFileSync(logFile, output);
        }).stderr.on('data', (data) => {
            const output = data.toString();
            stderr += output;
            process.stderr.write(output);
            fs.appendFileSync(logFile, `[STDERR] ${output}`);
        });
    });
}).on('error', (err) => {
    log(`❌ SSH Connection Error: ${err.message}`);
    if (err.level === 'client-timeout') {
        log('Connection timeout - possible network issues or firewall blocking');
    } else if (err.level === 'client-authentication') {
        log('Authentication failed - check credentials');
    } else if (err.code === 'ECONNREFUSED') {
        log('Connection refused - check if SSH service is running');
    } else if (err.code === 'ETIMEDOUT') {
        log('Connection timeout - check network connectivity and firewall');
    }
    process.exit(1);
});

// Connect with timeout
conn.connect({
    host: '75.2.60.5',
    port: 22,
    username: 'root',
    password: 'gJ75hNHdy90TA4qGo9',
    readyTimeout: 30000, // 30 seconds
    keepaliveInterval: 10000,
    keepaliveCountMax: 3
});

// Overall timeout
setTimeout(() => {
    log('❌ Overall operation timeout (5 minutes)');
    conn.end();
    process.exit(1);
}, 300000); // 5 minutes