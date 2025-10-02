# SSH自动化部署脚本 (PowerShell版本)
# 目标服务器: yushuo.click
# 项目: 股票追踪系统

param(
    [string]$ServerHost = "yushuo.click",
    [int]$ServerPort = 22,
    [string]$ServerUser = "root",
    [string]$ServerPassword = "gJ75hNHdy90TA4qGo9",
    [string]$ProjectDir = "/www/wwwroot/stock-tracker",
    [string]$GitRepo = "https://github.com/yushuo1991/911.git",
    [string]$TargetCommit = "f619042",
    [string]$Domain = "bk.yushuo.click"
)

# 日志配置
$LogDir = ".\log"
$LogFile = "$LogDir\ssh-deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss').md"

# 确保日志目录存在
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir | Out-Null
}

# 日志函数
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "ERROR" { "Red" }
        "WARNING" { "Yellow" }
        "SUCCESS" { "Green" }
        default { "White" }
    }

    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
    Add-Content -Path $LogFile -Value "[$timestamp] [$Level] $Message"
}

function Write-Section {
    param([string]$Title)
    Write-Host "`n========== $Title ==========" -ForegroundColor Cyan
    Add-Content -Path $LogFile -Value "`n## $Title`n"
}

# SSH执行函数
function Invoke-SSHCommand {
    param(
        [string]$Command,
        [switch]$NoLog
    )

    if (-not $NoLog) {
        Write-Log "执行命令: $Command"
    }

    # 使用plink (PuTTY的命令行工具) 或 OpenSSH
    $sshCommand = "echo y | plink -ssh -P $ServerPort -pw `"$ServerPassword`" $ServerUser@$ServerHost `"$Command`""

    try {
        $result = Invoke-Expression $sshCommand 2>&1
        if (-not $NoLog) {
            $result | ForEach-Object { Add-Content -Path $LogFile -Value $_ }
        }
        return $result
    }
    catch {
        Write-Log "命令执行失败: $_" "ERROR"
        return $null
    }
}

# 初始化日志文件
@"
# SSH自动化部署报告
**生成时间**: $(Get-Date -Format 'yyyy-MM-dd HH:MM:ss')
**服务器**: $ServerHost
**项目**: 股票追踪系统
**目标提交**: $TargetCommit

---

"@ | Set-Content -Path $LogFile

Write-Log "开始SSH自动化部署..." "INFO"

# 步骤1: SSH连接测试
Write-Section "步骤1: SSH连接测试"

$testResult = Invoke-SSHCommand "echo 'SSH连接成功'"
if ($testResult -match "SSH连接成功") {
    Write-Log "✓ SSH连接正常" "SUCCESS"
    Add-Content -Path $LogFile -Value "- ✅ SSH连接测试通过"
} else {
    Write-Log "✗ SSH连接失败" "ERROR"
    Add-Content -Path $LogFile -Value "- ❌ SSH连接失败"
    exit 1
}

# 检查项目目录
$dirCheck = Invoke-SSHCommand "[ -d $ProjectDir ] && echo 'exists' || echo 'not exists'"
if ($dirCheck -match "exists") {
    Write-Log "✓ 项目目录存在: $ProjectDir" "SUCCESS"
    Add-Content -Path $LogFile -Value "- ✅ 项目目录存在"
    $projectExists = $true
} else {
    Write-Log "✗ 项目目录不存在，将克隆仓库" "WARNING"
    Add-Content -Path $LogFile -Value "- ⚠️ 项目目录不存在"
    $projectExists = $false
}

# 检查Docker
Write-Log "检查Docker环境..."
Invoke-SSHCommand "docker --version"
Invoke-SSHCommand "docker-compose --version"

# 步骤2: Git操作
Write-Section "步骤2: Git操作"

if ($projectExists) {
    Write-Log "更新现有项目..."

    # 停止现有容器
    Write-Log "停止现有容器..."
    Invoke-SSHCommand "cd $ProjectDir && docker-compose down"

    # 拉取最新代码
    Write-Log "拉取最新代码..."
    Invoke-SSHCommand "cd $ProjectDir && git fetch --all"
    Invoke-SSHCommand "cd $ProjectDir && git reset --hard origin/main"
    Invoke-SSHCommand "cd $ProjectDir && git pull origin main"

    # 验证提交
    $currentCommit = Invoke-SSHCommand "cd $ProjectDir && git log -1 --format='%h'" -NoLog
    Write-Log "当前提交: $currentCommit"
    Add-Content -Path $LogFile -Value "- **当前提交**: $currentCommit"

    Invoke-SSHCommand "cd $ProjectDir && git log -1"
} else {
    Write-Log "克隆新项目..."
    Invoke-SSHCommand "cd /www/wwwroot && git clone $GitRepo stock-tracker"
    Write-Log "✓ 项目克隆完成" "SUCCESS"
}

# 步骤3: 验证关键文件
Write-Section "步骤3: 验证关键文件"

Add-Content -Path $LogFile -Value "`n``````bash"
Invoke-SSHCommand "cd $ProjectDir && ls -lh Dockerfile docker-compose.yml init.sql deploy.sh 2>&1"
Add-Content -Path $LogFile -Value "``````"

$keyFiles = @("Dockerfile", "docker-compose.yml", "init.sql", "deploy.sh")
foreach ($file in $keyFiles) {
    $fileCheck = Invoke-SSHCommand "[ -f $ProjectDir/$file ] && echo 'exists'" -NoLog
    if ($fileCheck -match "exists") {
        Write-Log "✓ $file 存在" "SUCCESS"
    } else {
        Write-Log "✗ $file 不存在" "ERROR"
    }
}

# 步骤4: Docker部署
Write-Section "步骤4: Docker部署"

Write-Log "设置deploy.sh执行权限..."
Invoke-SSHCommand "cd $ProjectDir && chmod +x deploy.sh"

Write-Log "执行部署脚本..."
Add-Content -Path $LogFile -Value "`n``````bash"
Invoke-SSHCommand "cd $ProjectDir && ./deploy.sh"
Add-Content -Path $LogFile -Value "``````"

Write-Log "等待容器启动..."
Start-Sleep -Seconds 10

# 步骤5: 验证部署
Write-Section "步骤5: 验证部署结果"

Add-Content -Path $LogFile -Value "`n### 容器状态`n``````bash"
Invoke-SSHCommand "cd $ProjectDir && docker-compose ps"
Add-Content -Path $LogFile -Value "``````"

Add-Content -Path $LogFile -Value "`n### 应用日志`n``````bash"
Invoke-SSHCommand "cd $ProjectDir && docker-compose logs --tail=50 stock-tracker"
Add-Content -Path $LogFile -Value "``````"

# 检查容器健康状态
$containerStatus = Invoke-SSHCommand "docker ps --filter 'name=stock-tracker-app' --format '{{.Status}}'" -NoLog
Add-Content -Path $LogFile -Value "- **应用容器状态**: $containerStatus"

if ($containerStatus -match "Up") {
    Write-Log "✓ 应用容器运行正常" "SUCCESS"
} else {
    Write-Log "✗ 应用容器状态异常" "ERROR"
}

# 步骤6: 测试访问
Write-Section "步骤6: 测试访问"

Write-Log "测试localhost:3002..."
Add-Content -Path $LogFile -Value "`n### 访问测试`n``````bash"
Invoke-SSHCommand "curl -I http://localhost:3002"
Add-Content -Path $LogFile -Value "``````"

Write-Log "测试域名访问: $Domain"
try {
    $response = Invoke-WebRequest -Uri "http://$Domain" -Method Head -TimeoutSec 10 -ErrorAction SilentlyContinue
    if ($response.StatusCode -in @(200, 301, 302)) {
        Write-Log "✓ 域名访问正常" "SUCCESS"
        Add-Content -Path $LogFile -Value "- ✅ 域名访问测试通过"
    }
} catch {
    Write-Log "域名访问可能存在问题，请检查Nginx配置" "WARNING"
    Add-Content -Path $LogFile -Value "- ⚠️ 域名访问需要检查"
}

# 生成最终报告
Write-Section "部署完成"

@"

---

## 部署摘要

### ✅ 完成步骤
1. SSH连接测试 - 成功
2. Git操作 - 完成
3. 关键文件验证 - 完成
4. Docker部署 - 执行
5. 部署验证 - 完成
6. 访问测试 - 完成

### 📋 访问信息
- **应用URL**: http://$Domain
- **本地端口**: 3002
- **项目目录**: $ProjectDir

### 🔍 后续检查
``````bash
# 查看容器状态
ssh root@$ServerHost "cd $ProjectDir && docker-compose ps"

# 查看应用日志
ssh root@$ServerHost "cd $ProjectDir && docker-compose logs -f stock-tracker"

# 查看数据库日志
ssh root@$ServerHost "cd $ProjectDir && docker-compose logs -f mysql"
``````

### 📝 问题排查
如遇到问题，检查：
1. Nginx配置是否正确代理到3002端口
2. 防火墙是否开放3002端口
3. Docker容器日志是否有错误
4. MySQL数据库是否正常初始化

---

**报告生成时间**: $(Get-Date -Format 'yyyy-MM-dd HH:MM:ss')
"@ | Add-Content -Path $LogFile

Write-Log "部署报告已生成: $LogFile" "SUCCESS"
Write-Host "`n部署完成！" -ForegroundColor Green
Write-Host "详细报告: $LogFile`n" -ForegroundColor Green