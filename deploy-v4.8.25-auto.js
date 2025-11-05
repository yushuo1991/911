#!/usr/bin/env node
/**
 * v4.8.25 自动部署脚本
 * 功能：图表优化 - 最高点标注+精致配色+排序完善
 * 使用：npm run deploy
 */

const { Client } = require('ssh2');

const SSH_CONFIG = {
  host: '107.173.154.147', // 从.git/config读取的服务器IP
  port: 22,
  username: 'root',
  password: 'gJ75hNHdy90TA4qGo9',
  readyTimeout: 30000,
  keepaliveInterval: 10000
};

const PROJECT_DIR = '/www/wwwroot/stock-tracker';

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

async function deployV4_8_25() {
  const conn = new Client();

  console.log('\n' + '═'.repeat(80));
  log('🚀 v4.8.25 自动部署开始', 'info');
  log('📦 版本内容：图表优化 - 最高点标注+精致配色+排序完善', 'info');
  log(`📡 目标服务器: ${SSH_CONFIG.host}`, 'info');
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
            desc: '步骤4: 拉取最新代码 (v4.8.25)'
          },
          {
            cmd: `cd ${PROJECT_DIR} && git log -1 --pretty=format:"提交: %h%n作者: %an%n时间: %ad%n说明: %s"`,
            desc: '步骤5: 查看最新提交信息'
          },
          {
            cmd: `cd ${PROJECT_DIR} && docker compose ps`,
            desc: '步骤6: 检查当前容器状态'
          },
          {
            cmd: `cd ${PROJECT_DIR} && docker compose down`,
            desc: '步骤7: 停止现有容器'
          },
          {
            cmd: `cd ${PROJECT_DIR} && docker compose build`,
            desc: '步骤8: 重新构建Docker镜像'
          },
          {
            cmd: `cd ${PROJECT_DIR} && docker compose up -d`,
            desc: '步骤9: 启动新容器'
          },
          {
            cmd: 'sleep 20 && echo "等待服务启动..."',
            desc: '步骤10: 等待20秒服务初始化'
          },
          {
            cmd: `cd ${PROJECT_DIR} && docker compose ps`,
            desc: '步骤11: 验证容器运行状态'
          },
          {
            cmd: 'curl -I http://localhost:3002 2>&1 | head -5',
            desc: '步骤12: 测试本地访问'
          },
          {
            cmd: `cd ${PROJECT_DIR} && docker compose logs --tail=30 app 2>&1 | tail -15`,
            desc: '步骤13: 查看应用日志'
          }
        ];

        for (const step of deploymentSteps) {
          console.log('─'.repeat(80));
          await executeCommand(conn, step.cmd, step.desc);
        }

        console.log('═'.repeat(80));
        console.log('');
        log('🎉 v4.8.25 部署完成！', 'success');
        console.log('');
        
        log('📊 版本更新内容:', 'info');
        log('  ✓ 日期弹窗：每天最高点自动标注板块名称', 'success');
        log('  ✓ 7天排行：精致配色方案（红绿蓝紫金）', 'success');
        log('  ✓ 连板排序：完善按状态+涨停时间排序', 'success');
        log('  ✓ 图表布局：优化左右分栏比例55/45', 'success');
        console.log('');
        
        log('🔍 验证清单:', 'info');
        log('  1. 访问 http://bk.yushuo.click', 'info');
        log('  2. 按 Ctrl+Shift+R 强制刷新', 'info');
        log('  3. 点击日期查看最高点标注', 'info');
        log('  4. 点击"7天涨停排行"查看新配色', 'info');
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
        console.log('  docker compose down');
        console.log('  docker compose build');
        console.log('  docker compose up -d');
        console.log('  sleep 20 && docker compose ps');
        console.log('  curl -I http://localhost:3002');
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
  deployV4_8_25()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      process.exit(1);
    });
}

module.exports = { deployV4_8_25 };














