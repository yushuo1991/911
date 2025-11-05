// PM2 配置文件
// 用于生产环境部署

module.exports = {
  apps: [{
    name: 'stock-tracker',
    script: 'npm',
    args: 'start',
    cwd: './',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    // 优雅重启
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    // 错误重启设置
    min_uptime: '10s',
    max_restarts: 10,
    // 自动重启延迟
    restart_delay: 4000
  }]
}

