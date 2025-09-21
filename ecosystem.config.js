// PM2 配置文件
module.exports = {
  apps: [{
    name: 'stock-tracker',
    script: 'npm',
    args: 'start',
    cwd: '/www/wwwroot/stock-tracker',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0'
    },
    error_file: '/www/wwwroot/stock-tracker/logs/err.log',
    out_file: '/www/wwwroot/stock-tracker/logs/out.log',
    log_file: '/www/wwwroot/stock-tracker/logs/combined.log',
    time: true
  }]
};
