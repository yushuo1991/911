# 上传修复脚本并执行
# 用途：解决 Docker 构建卡住的问题

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  上传修复脚本到服务器" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$serverIP = "107.173.154.147"
$serverUser = "root"
$targetPath = "/www/wwwroot/stock-tracker/"

# 1. 上传脚本
Write-Host "[1/2] 上传 fix-docker-build-stuck.sh..." -ForegroundColor Yellow
scp ".\fix-docker-build-stuck.sh" "${serverUser}@${serverIP}:${targetPath}"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ 脚本上传成功" -ForegroundColor Green
} else {
    Write-Host "✗ 脚本上传失败" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. 显示执行指令
Write-Host "[2/2] 请在服务器上执行以下命令：" -ForegroundColor Yellow
Write-Host ""
Write-Host "# 停止当前构建（如果还在运行，按 Ctrl+C）" -ForegroundColor Cyan
Write-Host "cd /www/wwwroot/stock-tracker" -ForegroundColor White
Write-Host "chmod +x fix-docker-build-stuck.sh" -ForegroundColor White
Write-Host "./fix-docker-build-stuck.sh" -ForegroundColor White
Write-Host ""
Write-Host "# 或者直接使用 PM2 部署（推荐，最快）：" -ForegroundColor Cyan
Write-Host "bash fix-docker-build-stuck.sh" -ForegroundColor White
Write-Host "# 然后选择选项 3 (使用 PM2 直接运行)" -ForegroundColor Gray
Write-Host ""

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  上传完成！" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
