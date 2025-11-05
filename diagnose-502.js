#!/usr/bin/env node
/**
 * SSH诊断502错误脚本
 */

const { Client } = require('ssh2');

const SSH_CONFIG = {
  host: 'yushuo.click',
  port: 22,
  username: 'root',
  password: 'gJ75hNHdy90TA4qGo9',
  readyTimeout: 30000
};

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

      stream.on('close', (code) => {
        console.log(''); // 空行分隔
        if (code === 0) {
          log(`✓ ${description} - 完成`, 'success');
        } else {
          log(`✗ ${description} - 退出码: ${code}`, 'warning');
        }
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

async function diagnose502() {
  const conn = new Client();

  log('🔍 开始诊断502 Bad Gateway问题', 'info');
  log(`📡 连接服务器: ${SSH_CONFIG.host}`, 'info');
  console.log('');

  return new Promise((resolve, reject) => {
    conn.on('ready', async () => {
      log('SSH连接成功！', 'success');
      console.log('');

      try {
        // 诊断命令序列
        const diagnostics = [
          {
            cmd: 'cd /www/wwwroot/stock-tracker && docker compose ps',
            desc: '1. 检查容器运行状态'
          },
          {
            cmd: 'cd /www/wwwroot/stock-tracker && docker compose logs --tail=50 stock-tracker',
            desc: '2. 查看应用日志（最近50行）'
          },
          {
            cmd: 'curl -I http://localhost:3002',
            desc: '3. 测试本地3002端口访问'
          },
          {
            cmd: 'netstat -tlnp | grep 3002',
            desc: '4. 检查3002端口监听状态'
          },
          {
            cmd: 'docker inspect stock-tracker-app | grep -A 5 IPAddress',
            desc: '5. 查看容器IP地址'
          },
          {
            cmd: 'ls -lh /www/server/panel/vhost/nginx/*.conf | grep -i yushuo',
            desc: '6. 查找Nginx配置文件'
          },
          {
            cmd: 'find /www/server/panel/vhost/nginx/ -name "*yushuo*" -o -name "*bk.yushuo*" 2>/dev/null',
            desc: '7. 搜索相关Nginx配置'
          },
          {
            cmd: 'nginx -t',
            desc: '8. 测试Nginx配置语法'
          },
          {
            cmd: 'systemctl status nginx | head -20',
            desc: '9. 检查Nginx服务状态'
          },
          {
            cmd: 'cat /www/server/panel/vhost/nginx/bk.yushuo.click.conf 2>/dev/null || echo "配置文件不存在"',
            desc: '10. 读取bk.yushuo.click Nginx配置'
          }
        ];

        for (const diag of diagnostics) {
          await executeCommand(conn, diag.cmd, diag.desc);
          console.log('─'.repeat(80));
        }

        console.log('');
        log('🎯 诊断完成！分析结果：', 'info');
        console.log('');
        log('可能的问题：', 'warning');
        log('  1. Nginx配置未指向端口3002', 'info');
        log('  2. Nginx代理配置错误', 'info');
        log('  3. 容器启动后崩溃', 'info');
        log('  4. 应用内部错误', 'info');
        console.log('');
        log('💡 建议操作：', 'success');
        log('  如果容器正常运行，需要配置Nginx反向代理', 'info');
        log('  代理目标: http://localhost:3002 或 http://容器IP:3000', 'info');
        console.log('');

        conn.end();
        resolve();
      } catch (error) {
        log(`诊断过程出错: ${error.message}`, 'error');
        conn.end();
        reject(error);
      }
    });

    conn.on('error', (err) => {
      if (err.code === 'ETIMEDOUT') {
        log('SSH连接超时', 'error');
        log('💡 建议: 请手动SSH连接服务器执行诊断命令', 'warning');
      } else {
        log(`SSH连接错误: ${err.message}`, 'error');
      }
      reject(err);
    });

    log('正在连接SSH服务器...', 'info');
    conn.connect(SSH_CONFIG);
  });
}

if (require.main === module) {
  diagnose502()
    .then(() => {
      log('', 'info');
      log('='.repeat(60), 'success');
      log('诊断完成！请根据上方输出分析问题', 'success');
      log('='.repeat(60), 'success');
      process.exit(0);
    })
    .catch((err) => {
      if (err.code === 'ETIMEDOUT') {
        console.log('');
        console.log('═'.repeat(60));
        console.log('⚠️  SSH自动连接失败，请手动执行以下命令：');
        console.log('═'.repeat(60));
        console.log('');
        console.log('ssh root@yushuo.click');
        console.log('');
        console.log('然后依次执行诊断命令：');
        console.log('');
        console.log('cd /www/wwwroot/stock-tracker');
        console.log('docker compose ps');
        console.log('docker compose logs --tail=50 stock-tracker');
        console.log('curl -I http://localhost:3002');
        console.log('netstat -tlnp | grep 3002');
        console.log('nginx -t');
        console.log('cat /www/server/panel/vhost/nginx/bk.yushuo.click.conf');
        console.log('');
        console.log('═'.repeat(60));
      }
      process.exit(1);
    });
}

module.exports = { diagnose502 };