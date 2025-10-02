#!/usr/bin/env node
/**
 * 直接SSH连接并自动部署脚本
 * 使用Node.js ssh2库实现跨平台SSH自动化
 */

const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

// SSH连接配置
const SSH_CONFIG = {
  host: 'yushuo.click',
  port: 22,
  username: 'root',
  password: 'gJ75hNHdy90TA4qGo9',
  readyTimeout: 30000,
  keepaliveInterval: 10000
};

// 项目配置
const PROJECT_DIR = '/www/wwwroot/stock-tracker';

// 部署命令序列
const DEPLOY_COMMANDS = [
  {
    cmd: `cd ${PROJECT_DIR}`,
    desc: '进入项目目录'
  },
  {
    cmd: 'echo "=== 📦 开始部署 股票追踪系统 v4.1-docker ==="',
    desc: '显示部署开始'
  },
  {
    cmd: 'echo ""',
    desc: '空行'
  },
  {
    cmd: 'echo "▶ 检查当前Git状态..."',
    desc: '提示Git状态检查'
  },
  {
    cmd: 'git status',
    desc: '查看Git状态'
  },
  {
    cmd: 'echo ""',
    desc: '空行'
  },
  {
    cmd: 'echo "▶ 拉取最新代码..."',
    desc: '提示拉取代码'
  },
  {
    cmd: 'git fetch --all',
    desc: '获取所有远程更新'
  },
  {
    cmd: 'git reset --hard origin/main',
    desc: '重置到远程main分支'
  },
  {
    cmd: 'git pull origin main',
    desc: '拉取最新代码'
  },
  {
    cmd: 'echo ""',
    desc: '空行'
  },
  {
    cmd: 'echo "▶ 验证关键文件..."',
    desc: '提示文件验证'
  },
  {
    cmd: 'ls -lh Dockerfile docker-compose.yml deploy.sh init.sql',
    desc: '列出关键文件'
  },
  {
    cmd: 'echo ""',
    desc: '空行'
  },
  {
    cmd: 'echo "▶ 停止旧容器（如果存在）..."',
    desc: '提示停止容器'
  },
  {
    cmd: 'docker-compose down 2>/dev/null || echo "没有运行中的容器"',
    desc: '停止现有容器'
  },
  {
    cmd: 'echo ""',
    desc: '空行'
  },
  {
    cmd: 'echo "▶ 执行Docker部署..."',
    desc: '提示开始部署'
  },
  {
    cmd: 'chmod +x deploy.sh',
    desc: '赋予部署脚本执行权限'
  },
  {
    cmd: './deploy.sh',
    desc: '执行部署脚本'
  },
  {
    cmd: 'echo ""',
    desc: '空行'
  },
  {
    cmd: 'echo "⏳ 等待服务启动（30秒）..."',
    desc: '提示等待'
  },
  {
    cmd: 'sleep 30',
    desc: '等待30秒'
  },
  {
    cmd: 'echo ""',
    desc: '空行'
  },
  {
    cmd: 'echo "▶ 检查容器状态..."',
    desc: '提示检查容器'
  },
  {
    cmd: 'docker-compose ps',
    desc: '查看容器状态'
  },
  {
    cmd: 'echo ""',
    desc: '空行'
  },
  {
    cmd: 'echo "▶ 查看应用日志（最近50行）..."',
    desc: '提示查看日志'
  },
  {
    cmd: 'docker-compose logs --tail=50 stock-tracker',
    desc: '查看应用日志'
  },
  {
    cmd: 'echo ""',
    desc: '空行'
  },
  {
    cmd: 'echo "▶ 测试本地访问..."',
    desc: '提示测试访问'
  },
  {
    cmd: 'curl -I http://localhost:3002',
    desc: '测试HTTP访问'
  },
  {
    cmd: 'echo ""',
    desc: '空行'
  },
  {
    cmd: 'echo "✅ 部署完成！"',
    desc: '显示完成'
  },
  {
    cmd: 'echo "🌐 访问地址: http://bk.yushuo.click"',
    desc: '显示访问地址'
  }
];

// 日志函数
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📘',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    command: '⚡'
  }[type] || 'ℹ️';

  console.log(`[${timestamp}] ${prefix} ${message}`);
}

// 执行SSH命令
function executeCommand(conn, command, description) {
  return new Promise((resolve, reject) => {
    log(`执行: ${description}`, 'command');

    conn.exec(command, (err, stream) => {
      if (err) {
        log(`命令执行失败: ${err.message}`, 'error');
        return reject(err);
      }

      let stdout = '';
      let stderr = '';

      stream.on('close', (code, signal) => {
        if (code === 0) {
          log(`✓ ${description} - 成功`, 'success');
          resolve({ stdout, stderr, code });
        } else {
          log(`✗ ${description} - 失败 (退出码: ${code})`, 'error');
          if (stderr) {
            console.error('错误输出:', stderr);
          }
          resolve({ stdout, stderr, code }); // 不reject，继续执行
        }
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

// 主部署流程
async function deployToServer() {
  const conn = new Client();

  log('🚀 开始SSH自动化部署流程', 'info');
  log(`📡 目标服务器: ${SSH_CONFIG.host}:${SSH_CONFIG.port}`, 'info');
  log(`👤 登录用户: ${SSH_CONFIG.username}`, 'info');
  log(`📁 项目目录: ${PROJECT_DIR}`, 'info');
  console.log('');

  return new Promise((resolve, reject) => {
    conn.on('ready', async () => {
      log('SSH连接成功！', 'success');
      console.log('');

      try {
        // 组合所有命令为一个复合命令以保持工作目录
        const fullCommand = DEPLOY_COMMANDS.map(c => c.cmd).join(' && ');

        log('开始执行部署命令序列...', 'info');
        console.log('');

        const result = await executeCommand(
          conn,
          fullCommand,
          '完整部署流程'
        );

        console.log('');
        log('🎉 部署流程执行完毕！', 'success');
        log('📊 检查上方输出确认部署状态', 'info');
        log('🌐 访问地址: http://bk.yushuo.click', 'info');

        conn.end();
        resolve(result);
      } catch (error) {
        log(`部署过程出错: ${error.message}`, 'error');
        conn.end();
        reject(error);
      }
    });

    conn.on('error', (err) => {
      if (err.code === 'ETIMEDOUT') {
        log('SSH连接超时 - 可能原因:', 'error');
        log('  1. 防火墙阻止了SSH端口22', 'warning');
        log('  2. 网络限制（GFW）', 'warning');
        log('  3. 服务器SSH服务未启动', 'warning');
        log('', 'info');
        log('💡 建议使用Web SSH方式部署（宝塔面板）', 'info');
      } else if (err.code === 'ECONNREFUSED') {
        log('SSH连接被拒绝 - 可能原因:', 'error');
        log('  1. SSH服务未运行', 'warning');
        log('  2. 端口配置错误', 'warning');
      } else if (err.level === 'client-authentication') {
        log('SSH认证失败 - 可能原因:', 'error');
        log('  1. 用户名或密码错误', 'warning');
        log('  2. 服务器密码已更改', 'warning');
      } else {
        log(`SSH连接错误: ${err.message}`, 'error');
      }
      reject(err);
    });

    conn.on('close', () => {
      log('SSH连接已关闭', 'info');
    });

    // 连接服务器
    log('正在连接SSH服务器...', 'info');
    conn.connect(SSH_CONFIG);
  });
}

// 执行部署
if (require.main === module) {
  deployToServer()
    .then(() => {
      log('', 'info');
      log('='.repeat(60), 'info');
      log('部署完成！请检查上方输出确认服务状态', 'success');
      log('='.repeat(60), 'info');
      process.exit(0);
    })
    .catch((err) => {
      log('', 'info');
      log('='.repeat(60), 'error');
      log('部署失败！请查看错误信息', 'error');
      log('='.repeat(60), 'error');
      process.exit(1);
    });
}

module.exports = { deployToServer };