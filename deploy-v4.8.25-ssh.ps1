# v4.8.25 SSH部署脚本
# 自动连接服务器并部署

$server = "107.173.154.147"  # 从.git/config读取的服务器IP
$username = "root"
$password = "gJ75hNHdy90TA4qGo9"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "v4.8.25 SSH自动部署" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "服务器: $server" -ForegroundColor Yellow
Write-Host "用户: $username" -ForegroundColor Yellow
Write-Host ""

# 测试连接
Write-Host "测试SSH连接..." -ForegroundColor Yellow
$tcpTest = Test-NetConnection -ComputerName $server -Port 22 -WarningAction SilentlyContinue

if ($tcpTest.TcpTestSucceeded) {
    Write-Host "✓ SSH端口可访问" -ForegroundColor Green
    Write-Host ""
    Write-Host "正在连接并部署..." -ForegroundColor Yellow
    Write-Host "密码: $password" -ForegroundColor Gray
    Write-Host ""
    
    # 部署命令
    $cmd = "cd /www/wwwroot/stock-tracker && git stash && git pull origin main && docker compose down && docker compose build && docker compose up -d && sleep 20 && docker ps | grep stock-tracker && curl -I http://localhost:3002"
    
    # 执行SSH命令
    ssh ${username}@${server} $cmd
    
} else {
    Write-Host "✗ SSH端口无法访问" -ForegroundColor Red
    Write-Host ""
    Write-Host "请使用以下替代方法:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "方法1: 宝塔面板终端" -ForegroundColor Cyan
    Write-Host "  1. 访问宝塔面板" -ForegroundColor White
    Write-Host "  2. 打开终端" -ForegroundColor White
    Write-Host "  3. 执行以下命令:" -ForegroundColor White
    Write-Host ""
    Write-Host "cd /www/wwwroot/stock-tracker && \\" -ForegroundColor Gray
    Write-Host "git stash && \\" -ForegroundColor Gray
    Write-Host "git pull origin main && \\" -ForegroundColor Gray
    Write-Host "docker compose down && \\" -ForegroundColor Gray
    Write-Host "docker compose build && \\" -ForegroundColor Gray
    Write-Host "docker compose up -d && \\" -ForegroundColor Gray
    Write-Host "sleep 20 && \\" -ForegroundColor Gray
    Write-Host "docker ps | grep stock-tracker && \\" -ForegroundColor Gray
    Write-Host "curl -I http://localhost:3002" -ForegroundColor Gray
    Write-Host ""
    
    # 复制到剪贴板
    "cd /www/wwwroot/stock-tracker && git stash && git pull origin main && docker compose down && docker compose build && docker compose up -d && sleep 20 && docker ps | grep stock-tracker && curl -I http://localhost:3002" | Set-Clipboard
    Write-Host "✓ 命令已复制到剪贴板，可直接粘贴" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "方法2: 使用MobaXterm/PuTTY" -ForegroundColor Cyan
    Write-Host "  服务器: $server" -ForegroundColor White
    Write-Host "  端口: 22" -ForegroundColor White
    Write-Host "  用户: $username" -ForegroundColor White
    Write-Host "  密码: $password" -ForegroundColor White
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Read-Host "按回车键退出"














