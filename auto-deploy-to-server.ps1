# v4.8.25 自动部署脚本
# 功能：自动SSH连接服务器并部署最新代码

$server = "75.2.60.5"
$username = "root"
$password = "gJ75hNHdy90TA4qGo9"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "v4.8.25 自动部署到服务器" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 部署命令
$deployCmd = @"
cd /www/wwwroot/stock-tracker && \
echo '📥 拉取最新代码...' && \
git stash && \
git pull origin main && \
echo '✅ 代码更新完成' && \
echo '' && \
echo '🛑 停止旧容器...' && \
docker compose down && \
echo '' && \
echo '🔨 重新构建镜像...' && \
docker compose build && \
echo '' && \
echo '🚀 启动新容器...' && \
docker compose up -d && \
echo '' && \
echo '⏳ 等待20秒启动...' && \
sleep 20 && \
echo '' && \
echo '🔍 检查状态:' && \
docker ps | grep stock-tracker && \
curl -I http://localhost:3002 && \
echo '' && \
echo '✅ v4.8.25 部署完成！访问 http://bk.yushuo.click 验证'
"@

Write-Host "正在连接到服务器 $server..." -ForegroundColor Yellow
Write-Host ""

# 使用 plink (PuTTY Link) 如果可用
if (Get-Command plink -ErrorAction SilentlyContinue) {
    Write-Host "使用 plink 连接..." -ForegroundColor Green
    echo y | plink -ssh -l $username -pw $password $server $deployCmd
}
# 使用 ssh 命令 (需要手动输入密码)
elseif (Get-Command ssh -ErrorAction SilentlyContinue) {
    Write-Host "使用 ssh 连接 (需要手动输入密码: $password)..." -ForegroundColor Yellow
    Write-Host ""
    ssh $username@$server $deployCmd
}
else {
    Write-Host "错误: 未找到 SSH 客户端" -ForegroundColor Red
    Write-Host ""
    Write-Host "请选择以下方法之一:" -ForegroundColor Yellow
    Write-Host "1. 安装 OpenSSH: Settings → Apps → Optional Features → Add OpenSSH Client"
    Write-Host "2. 下载 PuTTY: https://www.putty.org/"
    Write-Host "3. 手动通过宝塔面板终端执行部署命令"
    Write-Host ""
    Write-Host "部署命令已保存到剪贴板，可直接粘贴到宝塔终端"
    $deployCmd | Set-Clipboard
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "手动部署方法" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "如果自动连接失败，请:" -ForegroundColor Yellow
Write-Host "1. 访问宝塔面板: http://75.2.60.5:8888" -ForegroundColor White
Write-Host "2. 打开终端" -ForegroundColor White
Write-Host "3. 粘贴并执行部署命令（已复制到剪贴板）" -ForegroundColor White
Write-Host ""
Write-Host "服务器信息:" -ForegroundColor Yellow
Write-Host "  IP: $server" -ForegroundColor Gray
Write-Host "  用户: $username" -ForegroundColor Gray
Write-Host "  密码: $password" -ForegroundColor Gray
Write-Host ""

Read-Host "按回车键退出"
