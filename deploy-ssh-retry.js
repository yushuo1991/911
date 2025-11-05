const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const net = require('net');

// Log file path
const logFile = path.join(__dirname, 'log', `deployment-retry-${new Date().toISOString().split('T')[0]}.log`);

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

// First, test basic network connectivity
function testConnection(host, port) {
    return new Promise((resolve, reject) => {
        log(`Testing network connectivity to ${host}:${port}...`);
        const socket = net.createConnection({ host, port, timeout: 10000 });

        socket.on('connect', () => {
            log('✅ Network connection successful!');
            socket.destroy();
            resolve(true);
        });

        socket.on('timeout', () => {
            log('❌ Connection timeout');
            socket.destroy();
            reject(new Error('Connection timeout'));
        });

        socket.on('error', (err) => {
            log(`❌ Network error: ${err.message}`);
            reject(err);
        });
    });
}

async function attemptSSHConnection(attempt = 1, maxAttempts = 3) {
    log(`\n=== Attempt ${attempt}/${maxAttempts} ===`);

    return new Promise((resolve, reject) => {
        const conn = new Client();

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

        conn.on('ready', () => {
            log('✅ SSH Connection established successfully!');

            conn.exec(deploymentCommands, (err, stream) => {
                if (err) {
                    log(`❌ Error executing commands: ${err.message}`);
                    conn.end();
                    reject(err);
                    return;
                }

                stream.on('close', (code, signal) => {
                    log(`\n=== Command execution finished ===`);
                    log(`Exit code: ${code}`);

                    if (code === 0) {
                        log('\n✅ Deployment completed successfully!');
                        resolve(true);
                    } else {
                        log('\n⚠️ Deployment completed with warnings or errors.');
                        resolve(false);
                    }

                    conn.end();
                }).on('data', (data) => {
                    const output = data.toString();
                    process.stdout.write(output);
                    fs.appendFileSync(logFile, output);
                }).stderr.on('data', (data) => {
                    const output = data.toString();
                    process.stderr.write(output);
                    fs.appendFileSync(logFile, `[STDERR] ${output}`);
                });
            });
        }).on('error', (err) => {
            log(`❌ SSH Error: ${err.message}`);
            conn.end();
            reject(err);
        });

        // Try connecting with hostname first, then IP
        const config = {
            host: attempt % 2 === 1 ? 'yushuo.click' : '75.2.60.5',
            port: 22,
            username: 'root',
            password: 'gJ75hNHdy90TA4qGo9',
            readyTimeout: 20000,
            keepaliveInterval: 5000,
            keepaliveCountMax: 3,
            algorithms: {
                kex: [
                    'diffie-hellman-group1-sha1',
                    'ecdh-sha2-nistp256',
                    'ecdh-sha2-nistp384',
                    'ecdh-sha2-nistp521',
                    'diffie-hellman-group-exchange-sha256',
                    'diffie-hellman-group14-sha1'
                ],
                cipher: [
                    'aes128-ctr',
                    'aes192-ctr',
                    'aes256-ctr',
                    'aes128-gcm',
                    'aes128-gcm@openssh.com',
                    'aes256-gcm',
                    'aes256-gcm@openssh.com',
                    'aes256-cbc'
                ]
            }
        };

        log(`Connecting to ${config.host}:${config.port} as ${config.username}...`);
        conn.connect(config);
    });
}

async function main() {
    log('=== SSH Deployment Script with Retry Started ===');

    // Test basic connectivity first
    try {
        await testConnection('75.2.60.5', 22);
    } catch (err) {
        log('\n⚠️ Direct network connectivity test failed.');
        log('This could be due to:');
        log('1. Firewall blocking outbound SSH connections');
        log('2. VPN or proxy requirements');
        log('3. ISP blocking SSH port 22');
        log('4. Server firewall not allowing connections from your IP');
        log('\n📋 Recommended actions:');
        log('1. Check if you can SSH from command line: ssh root@yushuo.click');
        log('2. Use the server control panel Web SSH interface');
        log('3. Check if VPN is required for your network');
    }

    // Try SSH connection with retries
    for (let i = 1; i <= 3; i++) {
        try {
            const result = await attemptSSHConnection(i, 3);
            if (result) {
                log('\n🎉 Deployment successful!');
                process.exit(0);
            } else {
                log('\n⚠️ Deployment had issues, check logs above');
                process.exit(1);
            }
        } catch (err) {
            log(`Attempt ${i} failed: ${err.message}`);
            if (i < 3) {
                log(`Waiting 5 seconds before retry...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    log('\n❌ All connection attempts failed.');
    log('\n📋 Alternative deployment methods:');
    log('1. Use server control panel Web SSH (Recommended):');
    log('   - Login to your hosting control panel');
    log('   - Open Web SSH terminal');
    log('   - Run the deployment commands manually');
    log('\n2. Check network connectivity:');
    log('   - Verify you can access the server from your network');
    log('   - Check if firewall is blocking SSH connections');
    log('   - Try connecting from a different network');
    log('\n3. Use alternative SSH client:');
    log('   - Try PuTTY or WSL ssh command');
    log('   - Test: ssh root@yushuo.click');

    process.exit(1);
}

main().catch(err => {
    log(`Fatal error: ${err.message}`);
    process.exit(1);
});