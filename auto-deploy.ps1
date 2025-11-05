# 自动部署脚本 - PowerShell版本
# 服务器: yushuo.click
# 目标目录: /www/wwwroot/stock-tracker

$SERVER = "yushuo.click"
$USERNAME = "root"
$PASSWORD = "gJ75hNHdy90TA4qGo9"
$REMOTE_DIR = "/www/wwwroot/stock-tracker"
$LOCAL_DIR = Get-Location

Write-Host "🚀 开始自动部署到服务器..." -ForegroundColor Green

# Step 1: 打包项目
Write-Host "`n📦 Step 1/4: 打包项目..." -ForegroundColor Cyan
$tarFile = "stock-tracker-deploy.tar.gz"
if (Test-Path $tarFile) {
    Remove-Item $tarFile -Force
}

# 使用tar打包（排除不必要的文件）
tar -czf $tarFile `
    --exclude=node_modules `
    --exclude=.next `
    --exclude=.git `
    --exclude=log `
    --exclude=data `
    --exclude=backup-*.tar.gz `
    .

if (Test-Path $tarFile) {
    $fileSize = (Get-Item $tarFile).Length / 1MB
    Write-Host "✅ 打包完成: $tarFile ($([math]::Round($fileSize, 2)) MB)" -ForegroundColor Green
} else {
    Write-Host "❌ 打包失败" -ForegroundColor Red
    exit 1
}

# Step 2: 使用WinSCP上传（如果安装）或提示手动操作
Write-Host "`n📤 Step 2/4: 上传到服务器..." -ForegroundColor Cyan
Write-Host "请手动执行以下命令上传文件:" -ForegroundColor Yellow
Write-Host "scp $tarFile ${USERNAME}@${SERVER}:/tmp/" -ForegroundColor White

# 或者使用plink（PuTTY）
$plinkPath = "C:\Program Files\PuTTY\plink.exe"
$pscpPath = "C:\Program Files\PuTTY\pscp.exe"

if (Test-Path $pscpPath) {
    Write-Host "检测到PSCP，使用PSCP上传..." -ForegroundColor Yellow
    & $pscpPath -pw $PASSWORD $tarFile "${USERNAME}@${SERVER}:/tmp/"
    Write-Host "✅ 上传完成" -ForegroundColor Green
} else {
    Write-Host "`n⚠️ 未检测到PSCP，请手动上传文件" -ForegroundColor Yellow
    Write-Host "方法1: 使用WinSCP或FileZilla上传 $tarFile 到服务器 /tmp/ 目录" -ForegroundColor White
    Write-Host "方法2: 安装PuTTY后重新运行此脚本" -ForegroundColor White
    Write-Host "`n按任意键继续生成部署脚本..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Step 3: 生成服务器端部署脚本
Write-Host "`n📝 Step 3/4: 生成服务器部署脚本..." -ForegroundColor Cyan
$deployScript = @"
#!/bin/bash
set -e

echo "=== 开始部署到 $REMOTE_DIR ==="

# 创建项目目录
mkdir -p $REMOTE_DIR
cd $REMOTE_DIR

# 备份旧版本
if [ -f "docker-compose.yml" ]; then
  echo "备份旧版本..."
  tar -czf backup-`$(date +%Y%m%d-%H%M%S).tar.gz --exclude=node_modules --exclude=.next . 2>/dev/null || true
fi

# 解压新版本
echo "解压项目文件..."
tar -xzf /tmp/stock-tracker-deploy.tar.gz

# 清理临时文件
rm /tmp/stock-tracker-deploy.tar.gz

# 赋予执行权限
chmod +x deploy.sh

# 检查Docker
echo ""
echo "=== 检查Docker环境 ==="
docker --version
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo "❌ Docker Compose未安装"
    exit 1
fi

echo ""
echo "=== 停止旧容器 ==="
`$DOCKER_COMPOSE down 2>/dev/null || true

echo ""
echo "=== 构建新镜像 ==="
`$DOCKER_COMPOSE build --no-cache

echo ""
echo "=== 启动服务 ==="
`$DOCKER_COMPOSE up -d

echo ""
echo "=== 等待服务启动（30秒）==="
sleep 30

echo ""
echo "=== 检查容器状态 ==="
`$DOCKER_COMPOSE ps

echo ""
echo "=== 查看应用日志（最近20行）==="
`$DOCKER_COMPOSE logs --tail=20 stock-tracker

echo ""
echo "✅ 部署完成！"
echo "🌐 访问地址: http://yushuo.click:3002"
"@

$deployScript | Out-File -FilePath "server-deploy.sh" -Encoding ASCII -NoNewline
Write-Host "✅ 已生成 server-deploy.sh" -ForegroundColor Green

# Step 4: 提供手动部署指令
Write-Host "`n🔧 Step 4/4: 服务器部署指令" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "`n请在服务器上执行以下命令完成部署:" -ForegroundColor Yellow
Write-Host ""
Write-Host "# 1. SSH登录服务器" -ForegroundColor White
Write-Host "ssh root@yushuo.click" -ForegroundColor Cyan
Write-Host ""
Write-Host "# 2. 创建并进入项目目录" -ForegroundColor White
Write-Host "mkdir -p $REMOTE_DIR && cd $REMOTE_DIR" -ForegroundColor Cyan
Write-Host ""
Write-Host "# 3. 解压项目文件" -ForegroundColor White
Write-Host "tar -xzf /tmp/stock-tracker-deploy.tar.gz" -ForegroundColor Cyan
Write-Host ""
Write-Host "# 4. 执行部署" -ForegroundColor White
Write-Host "chmod +x deploy.sh && ./deploy.sh" -ForegroundColor Cyan
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

# 或者使用plink执行
if (Test-Path $plinkPath) {
    Write-Host "`n是否使用PuTTY自动执行部署? (Y/N)" -ForegroundColor Yellow
    $confirm = Read-Host
    if ($confirm -eq "Y" -or $confirm -eq "y") {
        Write-Host "执行服务器部署..." -ForegroundColor Green
        & $plinkPath -pw $PASSWORD "${USERNAME}@${SERVER}" "bash -s" < server-deploy.sh
    }
}

Write-Host "`n✨ 部署脚本准备完成！" -ForegroundColor Green
Write-Host "📁 打包文件: $tarFile" -ForegroundColor White
Write-Host "📜 部署脚本: server-deploy.sh" -ForegroundColor White
Write-Host "🌐 访问地址: http://yushuo.click:3002" -ForegroundColor White