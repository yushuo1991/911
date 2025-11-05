# v4.8.26 Push to GitHub Script
# Auto-retry on network failure

$ErrorActionPreference = 'Continue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "v4.8.26 Push to GitHub" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Download latest repo
Write-Host "Step 1: Downloading latest repository..." -ForegroundColor Yellow
$maxRetries = 5
$success = $false

for ($i = 1; $i -le $maxRetries; $i++) {
    Write-Host "  Attempt $i/$maxRetries..." -ForegroundColor Gray
    
    try {
        $zipUrl = "https://github.com/yushuo1991/911/archive/refs/heads/main.zip"
        Invoke-WebRequest -Uri $zipUrl -OutFile "911-main.zip" -UseBasicParsing -TimeoutSec 30
        
        if (Test-Path "911-main.zip") {
            $fileSize = (Get-Item "911-main.zip").Length / 1MB
            Write-Host "  Download successful! Size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Green
            $success = $true
            break
        }
    } catch {
        Write-Host "  Attempt $i failed: $($_.Exception.Message)" -ForegroundColor Red
        Start-Sleep -Seconds 3
    }
}

if (-not $success) {
    Write-Host "Failed to download after $maxRetries attempts" -ForegroundColor Red
    Write-Host "Please check your network connection" -ForegroundColor Yellow
    exit 1
}

# Step 2: Extract
Write-Host ""
Write-Host "Step 2: Extracting repository..." -ForegroundColor Yellow

if (Test-Path "911-main") {
    Remove-Item -Recurse -Force "911-main"
}

Expand-Archive -Path "911-main.zip" -DestinationPath "." -Force
Write-Host "  Extraction complete!" -ForegroundColor Green

# Step 3: Copy modified files
Write-Host ""
Write-Host "Step 3: Copying modified files..." -ForegroundColor Yellow

$sourceDir = "911-86887ec382a82d9038e8df20f97a4d0e5ef02a56"
$targetDir = "911-main"

$filesToCopy = @(
    "src\lib\utils.ts",
    "src\lib\enhanced-trading-calendar.ts",
    "TIMEZONE-BUG-FIX-REPORT.md",
    "ULTRA-FIX-SUMMARY.md",
    "README-v4.8.26-DEPLOY.md",
    "DEPLOY-v4.8.26-COMMANDS.txt",
    "deploy-v4.8.26-timezone-fix.js",
    "diagnose-timezone-issue.js",
    "push-to-github.ps1"
)

foreach ($file in $filesToCopy) {
    $src = Join-Path $sourceDir $file
    $dst = Join-Path $targetDir $file
    
    if (Test-Path $src) {
        $dstDir = Split-Path $dst -Parent
        if (-not (Test-Path $dstDir)) {
            New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
        }
        Copy-Item $src $dst -Force
        Write-Host "  Copied: $file" -ForegroundColor Gray
    }
}

Write-Host "  All files copied!" -ForegroundColor Green

# Step 4: Create commit script for GitHub web interface
Write-Host ""
Write-Host "Step 4: Creating commit information..." -ForegroundColor Yellow

$commitMessage = @"
fix(timezone): 修复时区转换bug，16点后数据不刷新问题 v4.8.26

修复内容：
- 修复时区转换逻辑，正确处理服务器时区偏移
- 时间阈值从17:00调整为16:00
- 修复16点后数据不刷新的问题

修改文件：
- src/lib/utils.ts (getTodayString函数)
- src/lib/enhanced-trading-calendar.ts (get7TradingDaysFromCalendar函数)

影响：
- 16:00后用户可以看到当天最新数据
- 解决双重加时区导致的时间判断错误
- 确保在任何服务器时区都能正确运行
"@

$commitMessage | Out-File -FilePath "COMMIT_MESSAGE.txt" -Encoding UTF8
Write-Host "  Commit message saved to COMMIT_MESSAGE.txt" -ForegroundColor Green

# Step 5: Display next steps
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Files prepared for GitHub!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Modified files are in: .\911-main\" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: Upload via GitHub Web (Recommended)" -ForegroundColor Cyan
Write-Host "  1. Visit: https://github.com/yushuo1991/911" -ForegroundColor White
Write-Host "  2. Click 'Upload files'" -ForegroundColor White
Write-Host "  3. Drag files from .\911-main\ to the upload area" -ForegroundColor White
Write-Host "  4. Use commit message from COMMIT_MESSAGE.txt" -ForegroundColor White
Write-Host ""
Write-Host "Option 2: Use GitHub Desktop" -ForegroundColor Cyan
Write-Host "  1. Open GitHub Desktop" -ForegroundColor White
Write-Host "  2. Clone yushuo1991/911" -ForegroundColor White
Write-Host "  3. Copy files from .\911-main\" -ForegroundColor White
Write-Host "  4. Commit and push" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to start server deployment..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

