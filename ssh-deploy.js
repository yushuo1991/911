#!/usr/bin/env node

/**
 * SSH自动化部署脚本
 * 使用Node.js的ssh2库进行远程部署
 */

const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

// 配置
const config = {
    host: 'yushuo.click',
    port: 22,
    username: 'root',
    password: 'gJ75hNHdy90TA4qGo9',
    readyTimeout: 60000,
    keepaliveInterval: 10000,
    keepaliveCountMax: 3,
    algorithms: {
        serverHostKey: ['ssh-rsa', 'ssh-dss', 'ecdsa-sha2-nistp256', 'ecdsa-sha2-nistp384', 'ecdsa-sha2-nistp521'],
    }
};

const PROJECT_DIR = '/www/wwwroot/stock-tracker';
const DOMAIN = 'bk.yushuo.click';
const LOG_DIR = path.join(__dirname, 'log');
const LOG_FILE = path.join(LOG_DIR, `ssh-deployment-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}.md`);

// 确保日志目录存在
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// 日志流
let logStream;

// 颜色代码
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

// 日志函数
function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const color = level === 'ERROR' ? colors.red :
                  level === 'SUCCESS' ? colors.green :
                  level === 'WARNING' ? colors.yellow : colors.reset;

    const logLine = `[${timestamp}] [${level}] ${message}`;
    console.log(`${color}${logLine}${colors.reset}`);

    if (logStream) {
        logStream.write(logLine + '\n');
    }
}

function logSection(title) {
    const line = '\n' + '='.repeat(50);
    console.log(`${colors.cyan}${line}\n${title}${line}${colors.reset}`);

    if (logStream) {
        logStream.write(`\n## ${title}\n\n`);
    }
}

// SSH命令执行
function execCommand(conn, command) {
    return new Promise((resolve, reject) => {
        log(`执行命令: ${command}`);

        conn.exec(command, (err, stream) => {
            if (err) {
                reject(err);
                return;
            }

            let stdout = '';
            let stderr = '';

            stream.on('close', (code, signal) => {
                if (code !== 0 && code !== null) {
                    log(`命令退出码: ${code}`, 'WARNING');
                }
                resolve({ stdout, stderr, code });
            }).on('data', (data) => {
                const output = data.toString();
                stdout += output;
                console.log(output.trim());
                if (logStream) {
                    logStream.write(output);
                }
            }).stderr.on('data', (data) => {
                const output = data.toString();
                stderr += output;
                console.error(output.trim());
                if (logStream) {
                    logStream.write(output);
                }
            });
        });
    });
}

// 主部署流程
async function deploy() {
    // 创建日志文件
    logStream = fs.createWriteStream(LOG_FILE);

    // 写入日志头
    logStream.write(`# SSH自动化部署报告\n`);
    logStream.write(`**生成时间**: ${new Date().toLocaleString('zh-CN')}\n`);
    logStream.write(`**服务器**: ${config.host}\n`);
    logStream.write(`**项目**: 股票追踪系统\n\n`);
    logStream.write(`---\n\n`);

    const conn = new Client();

    return new Promise((resolve, reject) => {
        conn.on('ready', async () => {
            log('SSH连接成功', 'SUCCESS');

            try {
                // 步骤1: 验证环境
                logSection('步骤1: 验证环境');

                await execCommand(conn, `cd ${PROJECT_DIR} && pwd`);
                await execCommand(conn, 'docker --version');
                await execCommand(conn, 'docker-compose --version');

                // 步骤2: Git操作
                logSection('步骤2: Git操作');

                log('停止现有容器...');
                await execCommand(conn, `cd ${PROJECT_DIR} && docker-compose down`);

                log('拉取最新代码...');
                await execCommand(conn, `cd ${PROJECT_DIR} && git fetch --all`);
                await execCommand(conn, `cd ${PROJECT_DIR} && git reset --hard origin/main`);
                await execCommand(conn, `cd ${PROJECT_DIR} && git pull origin main`);

                log('验证最新提交...');
                await execCommand(conn, `cd ${PROJECT_DIR} && git log -1`);

                // 步骤3: 验证关键文件
                logSection('步骤3: 验证关键文件');

                const files = await execCommand(conn,
                    `cd ${PROJECT_DIR} && ls -lh Dockerfile docker-compose.yml init.sql deploy.sh`
                );

                // 步骤4: Docker部署
                logSection('步骤4: Docker部署');

                log('设置执行权限...');
                await execCommand(conn, `cd ${PROJECT_DIR} && chmod +x deploy.sh`);

                log('执行部署脚本...');
                logStream.write('\n```bash\n');
                await execCommand(conn, `cd ${PROJECT_DIR} && ./deploy.sh`);
                logStream.write('```\n\n');

                log('等待容器启动...');
                await new Promise(resolve => setTimeout(resolve, 15000));

                // 步骤5: 验证部署
                logSection('步骤5: 验证部署结果');

                logStream.write('### 容器状态\n```bash\n');
                await execCommand(conn, `cd ${PROJECT_DIR} && docker-compose ps`);
                logStream.write('```\n\n');

                logStream.write('### 应用日志\n```bash\n');
                await execCommand(conn, `cd ${PROJECT_DIR} && docker-compose logs --tail=50 stock-tracker`);
                logStream.write('```\n\n');

                log('检查容器健康状态...');
                const status = await execCommand(conn,
                    `docker ps --filter 'name=stock-tracker-app' --format '{{.Status}}'`
                );

                if (status.stdout.includes('Up')) {
                    log('✓ 应用容器运行正常', 'SUCCESS');
                    logStream.write('- ✅ 应用容器运行正常\n');
                } else {
                    log('✗ 应用容器状态异常', 'ERROR');
                    logStream.write('- ❌ 应用容器状态异常\n');
                }

                // 步骤6: 测试访问
                logSection('步骤6: 测试访问');

                log('测试localhost:3002...');
                logStream.write('\n```bash\n');
                await execCommand(conn, 'curl -I http://localhost:3002');
                logStream.write('```\n\n');

                // 生成最终报告
                logSection('部署完成');

                logStream.write(`\n---\n\n`);
                logStream.write(`## 部署摘要\n\n`);
                logStream.write(`### ✅ 完成步骤\n`);
                logStream.write(`1. 验证环境 - 完成\n`);
                logStream.write(`2. Git操作 - 完成\n`);
                logStream.write(`3. 关键文件验证 - 完成\n`);
                logStream.write(`4. Docker部署 - 完成\n`);
                logStream.write(`5. 部署验证 - 完成\n`);
                logStream.write(`6. 访问测试 - 完成\n\n`);
                logStream.write(`### 📋 访问信息\n`);
                logStream.write(`- **应用URL**: http://${DOMAIN}\n`);
                logStream.write(`- **本地端口**: 3002\n`);
                logStream.write(`- **项目目录**: ${PROJECT_DIR}\n\n`);
                logStream.write(`---\n\n`);
                logStream.write(`**报告生成时间**: ${new Date().toLocaleString('zh-CN')}\n`);

                log(`部署报告已生成: ${LOG_FILE}`, 'SUCCESS');
                log('所有步骤执行完毕！', 'SUCCESS');

                conn.end();
                resolve();

            } catch (error) {
                log(`部署过程出错: ${error.message}`, 'ERROR');
                conn.end();
                reject(error);
            }
        }).on('error', (err) => {
            log(`SSH连接错误: ${err.message}`, 'ERROR');
            reject(err);
        }).connect(config);
    });
}

// 运行部署
deploy()
    .then(() => {
        if (logStream) {
            logStream.end();
        }
        process.exit(0);
    })
    .catch((error) => {
        log(`部署失败: ${error.message}`, 'ERROR');
        if (logStream) {
            logStream.write(`\n## 部署失败\n\n错误: ${error.message}\n`);
            logStream.end();
        }
        process.exit(1);
    });