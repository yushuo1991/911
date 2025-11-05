#!/usr/bin/env node
/**
 * PM2 部署脚本
 * 功能：连接服务器并通过 PM2 部署 Next.js 项目
 * 使用：node deploy-pm2.js
 */

const { Client } = require('ssh2');

const SSH_CONFIG = {
  host: '107.173.154.147',
  port: 22,
  username: 'root',
  password: 'gJ75hNHdy90TA4qGo9',
  readyTimeout: 30000,
  keepaliveInterval: 10000
};

const PROJECT_DIR = '/www/wwwroot/stock-tracker';
const APP_NAME = 'stock-tracker';

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const colors = {
    info: '\x1b[36m',    // 青色
    success: '\x1b[32m', // 绿色
    error: '\x1b[31m',   // 红色
    warning: '\x1b[33m', // 黄色
    step: '\x1b[35m'     // 紫色
  };
  const reset = '\x1b[0m';
  const prefix = {
    info: '📘',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    step: '▶'
  }[type] || 'ℹ️';
  
  console.log(`${colors[type]}[${timestamp}] ${prefix} ${message}${reset}`);
}

function executeCommand(conn, command, description) {
  return new Promise((resolve, reject) => {
    log(description, 'step');

    conn.exec(command, (err, stream) => {
      if (err) {
        log(`命令执行失败: ${err.message}`, 'error');
        return reject(err);
      }

      let stdout = '';
      let stderr = '';

      stream.on('close', (code) => {
        if (code === 0) {
          log(`${description} - 完成 ✓`, 'success');
        } else {
          log(`${description} - 退出码: ${code}`, 'warning');
        }
        console.log('');
        resolve({ stdout, stderr, code });
      });

      stream.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        process.stdout.write(output);
      });

      stream.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        process.stderr.write(output);
      });
    });
  });
}

async function deployWithPM2() {
  const conn = new Client();

  console.log('\n' + '═'.repeat(80));
  log('🚀 PM2 部署开始', 'info');
  log(`📡 目标服务器: ${SSH_CONFIG.host}`, 'info');
  log(`📦 项目路径: ${PROJECT_DIR}`, 'info');
  console.log('═'.repeat(80) + '\n');

  return new Promise((resolve, reject) => {
    conn.on('ready', async () => {
      log('SSH连接成功！', 'success');
      console.log('');

      try {
        const deploymentSteps = [
          {
            cmd: `cd ${PROJECT_DIR} && pwd`,
            desc: '步骤1: 确认项目目录'
          },
          {
            cmd: `cd ${PROJECT_DIR} && git status --short`,
            desc: '步骤2: 检查Git状态'
          },
          {
            cmd: `cd ${PROJECT_DIR} && git stash`,
            desc: '步骤3: 暂存本地修改'
          },
          {
            cmd: `cd ${PROJECT_DIR} && git pull origin main`,
            desc: '步骤4: 拉取最新代码'
          },
          {
            cmd: `cd ${PROJECT_DIR} && git log -1 --pretty=format:"提交: %h%n作者: %an%n时间: %ad%n说明: %s"`,
            desc: '步骤5: 查看最新提交信息'
          },
          {
            cmd: 'which pm2',
            desc: '步骤6: 检查PM2是否安装'
          },
          {
            cmd: `cd ${PROJECT_DIR} && npm install`,
            desc: '步骤7: 安装依赖'
          },
          {
            cmd: `cd ${PROJECT_DIR} && npm run build`,
            desc: '步骤8: 构建项目'
          },
          {
            cmd: `pm2 describe ${APP_NAME} > /dev/null 2>&1 && pm2 delete ${APP_NAME} || echo "应用未运行"`,
            desc: '步骤9: 停止旧的PM2进程'
          },
          {
            cmd: `cd ${PROJECT_DIR} && pm2 start npm --name "${APP_NAME}" -- start`,
            desc: '步骤10: 启动PM2应用'
          },
          {
            cmd: 'pm2 save',
            desc: '步骤11: 保存PM2配置'
          },
          {
            cmd: `pm2 list`,
            desc: '步骤12: 查看PM2应用列表'
          },
          {
            cmd: `pm2 logs ${APP_NAME} --lines 20 --nostream`,
            desc: '步骤13: 查看应用日志'
          },
          {
            cmd: 'sleep 5 && curl -I http://localhost:3000 2>&1 | head -5',
            desc: '步骤14: 测试本地访问'
          }
        ];

        for (const step of deploymentSteps) {
          console.log('─'.repeat(80));
          const result = await executeCommand(conn, step.cmd, step.desc);
          
          // 如果检查PM2失败，尝试安装
          if (step.cmd === 'which pm2' && result.code !== 0) {
            log('PM2未安装，正在安装...', 'warning');
            await executeCommand(conn, 'npm install -g pm2', '安装PM2');
          }
        }

        console.log('═'.repeat(80));
        console.log('');
        log('🎉 PM2 部署完成！', 'success');
        console.log('');
        
        log('🔍 验证清单:', 'info');
        log('  1. 访问 http://bk.yushuo.click', 'info');
        log('  2. 按 Ctrl+Shift+R 强制刷新', 'info');
        log('  3. 查看PM2进程状态：pm2 list', 'info');
        log('  4. 查看应用日志：pm2 logs stock-tracker', 'info');
        console.log('');
        
        log('📋 PM2 常用命令:', 'info');
        log('  • pm2 list           - 查看所有进程', 'info');
        log('  • pm2 logs           - 查看日志', 'info');
        log('  • pm2 restart stock-tracker - 重启应用', 'info');
        log('  • pm2 stop stock-tracker    - 停止应用', 'info');
        log('  • pm2 delete stock-tracker  - 删除应用', 'info');
        log('  • pm2 monit          - 实时监控', 'info');
        console.log('');
        
        log('🌐 访问地址: http://bk.yushuo.click', 'success');
        console.log('═'.repeat(80) + '\n');

        conn.end();
        resolve();
      } catch (error) {
        log(`部署过程出错: ${error.message}`, 'error');
        conn.end();
        reject(error);
      }
    });

    conn.on('error', (err) => {
      console.log('\n' + '═'.repeat(80));
      log('SSH连接失败', 'error');
      console.log('═'.repeat(80) + '\n');
      
      log(`错误信息: ${err.message}`, 'error');
      console.log('');
      
      if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
        log('请尝试以下方法:', 'warning');
        console.log('');
        console.log('方法1: 使用宝塔面板终端');
        console.log('  访问宝塔面板 → 终端 → 执行以下命令：');
        console.log('');
        console.log(`  cd ${PROJECT_DIR}`);
        console.log('  git stash && git pull origin main');
        console.log('  npm install');
        console.log('  npm run build');
        console.log(`  pm2 delete ${APP_NAME} || true`);
        console.log(`  pm2 start npm --name "${APP_NAME}" -- start`);
        console.log('  pm2 save');
        console.log('  pm2 list');
        console.log('');
        console.log('方法2: 使用SSH客户端手动连接');
        console.log(`  ssh root@${SSH_CONFIG.host}`);
        console.log(`  密码: ${SSH_CONFIG.password}`);
        console.log('');
      }
      
      console.log('═'.repeat(80) + '\n');
      reject(err);
    });

    log('正在建立SSH连接...', 'info');
    conn.connect(SSH_CONFIG);
  });
}

if (require.main === module) {
  deployWithPM2()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      process.exit(1);
    });
}

module.exports = { deployWithPM2 };

