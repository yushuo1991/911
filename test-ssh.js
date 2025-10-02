const { Client } = require('ssh2');

const config = {
    host: 'yushuo.click',
    port: 22,
    username: 'root',
    password: 'gJ75hNHdy90TA4qGo9',
    readyTimeout: 30000,
    debug: console.log  // 启用调试输出
};

const conn = new Client();

conn.on('ready', () => {
    console.log('✅ SSH连接成功！');

    conn.exec('pwd && whoami && docker --version', (err, stream) => {
        if (err) {
            console.error('❌ 命令执行错误:', err);
            conn.end();
            return;
        }

        stream.on('close', (code, signal) => {
            console.log('\n命令执行完成，退出码:', code);
            conn.end();
        }).on('data', (data) => {
            console.log('输出:', data.toString());
        }).stderr.on('data', (data) => {
            console.error('错误:', data.toString());
        });
    });
}).on('error', (err) => {
    console.error('❌ SSH连接错误:', err.message);
    process.exit(1);
}).on('timeout', () => {
    console.error('❌ SSH连接超时');
    process.exit(1);
}).connect(config);