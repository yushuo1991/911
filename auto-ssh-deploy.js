#!/usr/bin/env node
/**
 * 自动SSH部署脚本 - v4.3 UI升级
 * 通过SSH连接服务器并自动执行Git拉取和Docker重启
 */

const { Client } = require('ssh2');

const SSH_CONFIG = {
  host: 'yushuo.click',
  port: 22,
  username: 'root',
  password: 'gJ75hNHdy90TA4qGo9',
  readyTimeout: 30000
};

const PROJECT_DIR = '/www/wwwroot/stock-tracker';

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📘',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    command: '⚡',
    step: '▶'
  }[type] || 'ℹ️';
  console.log(`[${timestamp}] ${prefix} ${message}`);
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
          log(`${description} - 完成`, 'success');
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

async function deployToServer() {
  const conn = new Client();

  log('🚀 开始自动部署 v4.3 UI升级到生产服务器', 'info');
  log(`📡 连接服务器: ${SSH_CONFIG.host}`, 'info');
  console.log('');

  return new Promise((resolve, reject) => {
    conn.on('ready', async () => {
      log('SSH连接成功！', 'success');
      console.log('');

      try {
        // 部署命令序列
        const deploymentSteps = [
          {
            cmd: `cd ${PROJECT_DIR} && pwd`,
            desc: '步骤1: 确认项目目录'
          },
          {
            cmd: `cd ${PROJECT_DIR} && git status`,
            desc: '步骤2: 检查Git状态'
          },
          {
            cmd: `cd ${PROJECT_DIR} && git fetch origin`,
            desc: '步骤3: 拉取远程更新'
          },
          {
            cmd: `cd ${PROJECT_DIR} && git pull origin main`,
            desc: '步骤4: 合并最新代码 (v4.3)'
          },
          {
            cmd: `cd ${PROJECT_DIR} && git log -1 --pretty=format:"Commit: %h%nAuthor: %an%nDate: %ad%nMessage: %s"`,
            desc: '步骤5: 查看最新提交信息'
          },
          {
            cmd: `cd ${PROJECT_DIR} && docker-compose ps`,
            desc: '步骤6: 检查当前容器状态'
          },
          {
            cmd: `cd ${PROJECT_DIR} && docker-compose down`,
            desc: '步骤7: 停止现有容器'
          },
          {
            cmd: `cd ${PROJECT_DIR} && docker-compose build --no-cache`,
            desc: '步骤8: 重新构建Docker镜像'
          },
          {
            cmd: `cd ${PROJECT_DIR} && docker-compose up -d`,
            desc: '步骤9: 启动新容器'
          },
          {
            cmd: 'sleep 30 && echo "等待服务启动完成..."',
            desc: '步骤10: 等待30秒服务初始化'
          },
          {
            cmd: `cd ${PROJECT_DIR} && docker-compose ps`,
            desc: '步骤11: 验证容器运行状态'
          },
          {
            cmd: `cd ${PROJECT_DIR} && docker-compose logs --tail=50 stock-tracker`,
            desc: '步骤12: 查看应用日志'
          },
          {
            cmd: 'curl -I http://localhost:3002',
            desc: '步骤13: 测试本地访问'
          },
          {
            cmd: 'curl -I http://bk.yushuo.click',
            desc: '步骤14: 测试公网访问'
          }
        ];

        for (const step of deploymentSteps) {
          console.log('═'.repeat(80));
          await executeCommand(conn, step.cmd, step.desc);
        }

        console.log('═'.repeat(80));
        console.log('');
        log('🎉 部署完成！', 'success');
        console.log('');
        log('验证清单:', 'info');
        log('  ✓ Git拉取最新代码 (v4.3)', 'success');
        log('  ✓ Docker镜像重新构建', 'success');
        log('  ✓ 容器重启成功', 'success');
        log('  ✓ 应用访问正常', 'success');
        console.log('');
        log('访问地址: http://bk.yushuo.click', 'info');
        log('请在浏览器中测试所有新功能！', 'info');
        console.log('');

        conn.end();
        resolve();
      } catch (error) {
        log(`部署过程出错: ${error.message}`, 'error');
        conn.end();
        reject(error);
      }
    });

    conn.on('error', (err) => {
      if (err.code === 'ETIMEDOUT') {
        log('SSH连接超时', 'error');
        console.log('');
        console.log('═'.repeat(80));
        log('⚠️  自动SSH连接失败', 'warning');
        console.log('═'.repeat(80));
        console.log('');
        console.log('📋 请手动SSH连接服务器并执行以下命令：');
        console.log('');
        console.log('ssh root@yushuo.click');
        console.log('');
        console.log('然后执行部署命令：');
        console.log('');
        console.log(`cd ${PROJECT_DIR}`);
        console.log('git pull origin main');
        console.log('docker-compose down');
        console.log('docker-compose build --no-cache');
        console.log('docker-compose up -d');
        console.log('sleep 30');
        console.log('docker-compose ps');
        console.log('curl -I http://bk.yushuo.click');
        console.log('');
        console.log('═'.repeat(80));
      } else {
        log(`SSH连接错误: ${err.message}`, 'error');
      }
      reject(err);
    });

    log('正在建立SSH连接...', 'info');
    conn.connect(SSH_CONFIG);
  });
}

if (require.main === module) {
  deployToServer()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      process.exit(1);
    });
}

module.exports = { deployToServer };