# v4.8.26 Complete Auto Deployment Script
# Automatically push to GitHub and deploy to server

param(
    [string]$ServerIP = "107.173.154.147",
    [string]$ServerUser = "root",
    [string]$ServerPassword = "gJ75hNHdy90TA4qGo9",
    [string]$ProjectDir = "/www/wwwroot/stock-tracker"
)

$ErrorActionPreference = 'Continue'

Write-Host ""
Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "  v4.8.26 Timezone Bug Fix - Auto Deployment" -ForegroundColor Green
Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host ""

# Function to execute SSH command
function Invoke-SSHCommand {
    param(
        [string]$Command,
        [string]$Description
    )
    
    Write-Host "$Description..." -ForegroundColor Yellow
    
    # Use plink if available
    $plinkPath = "C:\Program Files\PuTTY\plink.exe"
    
    if (Test-Path $plinkPath) {
        $result = & $plinkPath -batch -pw $ServerPassword "${ServerUser}@${ServerIP}" $Command 2>&1
        Write-Host $result -ForegroundColor Gray
        return $result
    } else {
        Write-Host "  PuTTY not found, generating command..." -ForegroundColor Gray
        Write-Host "  Command: $Command" -ForegroundColor White
        return $null
    }
}

# Check if we have SSH tools
$hasPuTTY = Test-Path "C:\Program Files\PuTTY\plink.exe"
$hasOpenSSH = Get-Command ssh -ErrorAction SilentlyContinue

if (-not $hasPuTTY -and -not $hasOpenSSH) {
    Write-Host "No SSH client found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install one of the following:" -ForegroundColor Yellow
    Write-Host "  1. PuTTY: https://www.putty.org/" -ForegroundColor White
    Write-Host "  2. OpenSSH (Windows Feature)" -ForegroundColor White
    Write-Host ""
    Write-Host "Or manually run the following commands on server:" -ForegroundColor Yellow
    Write-Host ""
    
    # Generate manual commands
    $manualCommands = @"
# Connect to server
ssh root@${ServerIP}
# Password: ${ServerPassword}

# Navigate to project
cd ${ProjectDir}

# Backup current version
mkdir -p /www/backup/stock-tracker
tar -czf /www/backup/stock-tracker/backup-before-v4.8.26-`$(date +%Y%m%d-%H%M%S).tar.gz --exclude=node_modules --exclude=.next . 2>/dev/null

# Apply timezone fix to utils.ts
cat > /tmp/fix_utils.patch << 'PATCH_EOF'
--- a/src/lib/utils.ts
+++ b/src/lib/utils.ts
@@ -288,10 +288,13 @@ export function isValidDate(dateString: string): boolean {
 }
 
 export function getTodayString(): string {
-  // v4.8.18修复：使用北京时间（东八区UTC+8）而不是UTC时间
-  // 中国股市基于北京时间运行，必须使用东八区时间
+  // v4.8.26修复：正确处理北京时间转换，考虑服务器时区
+  // 先转换到UTC基准，再加上北京时区偏移（UTC+8）
   const date = new Date();
-  const beijingDate = new Date(date.getTime() + (8 * 60 * 60 * 1000)); // 转换为北京时间
+  const utcTime = date.getTime() + (date.getTimezoneOffset() * 60 * 1000); // 转换为UTC
+  const beijingTime = utcTime + (8 * 60 * 60 * 1000); // UTC + 8小时 = 北京时间
+  const beijingDate = new Date(beijingTime);
   return beijingDate.toISOString().split('T')[0];
 }
PATCH_EOF

# Apply fix manually
sed -i.bak '291,296d' src/lib/utils.ts
sed -i '290a\export function getTodayString(): string {\n  // v4.8.26修复：正确处理北京时间转换，考虑服务器时区\n  // 先转换到UTC基准，再加上北京时区偏移（UTC+8）\n  const date = new Date();\n  const utcTime = date.getTime() + (date.getTimezoneOffset() * 60 * 1000); // 转换为UTC\n  const beijingTime = utcTime + (8 * 60 * 60 * 1000); // UTC + 8小时 = 北京时间\n  const beijingDate = new Date(beijingTime);\n  return beijingDate.toISOString().split('"'"'T'"'"')[0];\n}' src/lib/utils.ts

# Fix enhanced-trading-calendar.ts
sed -i 's/17:00/16:00/g' src/lib/enhanced-trading-calendar.ts
sed -i 's/>= 17/>= 16/g' src/lib/enhanced-trading-calendar.ts
sed -i '245,250c\  // v4.8.26修复：正确处理北京时间转换，考虑服务器时区\n  // 中国股市15:00收盘，数据处理约需1小时，16:00后数据已基本完整\n  const now = new Date();\n  \n  // 先转换到UTC基准，再加上北京时区偏移（UTC+8）\n  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60 * 1000); // 转换为UTC\n  const beijingTimeMs = utcTime + (8 * 60 * 60 * 1000); // UTC + 8小时 = 北京时间\n  const beijingTime = new Date(beijingTimeMs);' src/lib/enhanced-trading-calendar.ts

# Commit changes
git add src/lib/utils.ts src/lib/enhanced-trading-calendar.ts
git commit -m "fix(timezone): 修复时区转换bug，16点后数据不刷新问题 v4.8.26"
git push origin main

# Deploy
docker compose down
docker compose build --no-cache
docker compose up -d

# Wait and verify
sleep 30
docker compose ps
docker compose logs --tail=20 app

echo ""
echo "Deployment complete! Visit http://bk.yushuo.click"
"@

    $manualCommands | Out-File -FilePath "manual-deploy-commands.sh" -Encoding UTF8
    Write-Host $manualCommands -ForegroundColor White
    Write-Host ""
    Write-Host "Commands saved to: manual-deploy-commands.sh" -ForegroundColor Green
    Write-Host ""
    exit 0
}

# We have SSH, proceed with auto deployment
Write-Host "SSH client found! Starting automated deployment..." -ForegroundColor Green
Write-Host ""

$deploymentCommands = @(
    @{
        cmd = "cd ${ProjectDir} && pwd"
        desc = "Step 1: Verify project directory"
    },
    @{
        cmd = "cd ${ProjectDir} && mkdir -p /www/backup/stock-tracker && tar -czf /www/backup/stock-tracker/backup-before-v4.8.26-`$(date +%Y%m%d-%H%M%S).tar.gz --exclude=node_modules --exclude=.next . 2>/dev/null && echo 'Backup complete'"
        desc = "Step 2: Backup current version"
    },
    @{
        cmd = "cd ${ProjectDir} && git status"
        desc = "Step 3: Check git status"
    },
    @{
        cmd = @"
cd ${ProjectDir} && cat > /tmp/fix-timezone.sh << 'FIXEOF'
#!/bin/bash
# Fix utils.ts
cp src/lib/utils.ts src/lib/utils.ts.backup
cat > /tmp/new_getTodayString.txt << 'EOF'
export function getTodayString(): string {
  // v4.8.26修复：正确处理北京时间转换，考虑服务器时区
  // 先转换到UTC基准，再加上北京时区偏移（UTC+8）
  const date = new Date();
  const utcTime = date.getTime() + (date.getTimezoneOffset() * 60 * 1000); // 转换为UTC
  const beijingTime = utcTime + (8 * 60 * 60 * 1000); // UTC + 8小时 = 北京时间
  const beijingDate = new Date(beijingTime);
  return beijingDate.toISOString().split('T')[0];
}
EOF

# Replace getTodayString function
awk '/^export function getTodayString/{p=1} p{if(/^}$/){print; p=0; system("cat /tmp/new_getTodayString.txt"); next}} !p' src/lib/utils.ts > /tmp/utils.ts.new && mv /tmp/utils.ts.new src/lib/utils.ts

echo "Fixed utils.ts"
FIXEOF
chmod +x /tmp/fix-timezone.sh && /tmp/fix-timezone.sh
"@
        desc = "Step 4: Apply timezone fix to utils.ts"
    },
    @{
        cmd = "cd ${ProjectDir} && sed -i 's/\>= 17/\>= 16/g' src/lib/enhanced-trading-calendar.ts && sed -i 's/17:00/16:00/g' src/lib/enhanced-trading-calendar.ts && echo 'Fixed enhanced-trading-calendar.ts'"
        desc = "Step 5: Update time threshold to 16:00"
    },
    @{
        cmd = "cd ${ProjectDir} && git diff src/lib/utils.ts | head -30"
        desc = "Step 6: Verify utils.ts changes"
    },
    @{
        cmd = "cd ${ProjectDir} && git diff src/lib/enhanced-trading-calendar.ts | head -20"
        desc = "Step 7: Verify calendar changes"
    },
    @{
        cmd = "cd ${ProjectDir} && git add src/lib/utils.ts src/lib/enhanced-trading-calendar.ts"
        desc = "Step 8: Stage changes"
    },
    @{
        cmd = "cd ${ProjectDir} && git commit -m 'fix(timezone): 修复时区转换bug，16点后数据不刷新问题 v4.8.26'"
        desc = "Step 9: Commit changes"
    },
    @{
        cmd = "cd ${ProjectDir} && git push origin main"
        desc = "Step 10: Push to GitHub"
    },
    @{
        cmd = "cd ${ProjectDir} && docker compose down"
        desc = "Step 11: Stop containers"
    },
    @{
        cmd = "cd ${ProjectDir} && docker compose build --no-cache"
        desc = "Step 12: Rebuild Docker image"
    },
    @{
        cmd = "cd ${ProjectDir} && docker compose up -d"
        desc = "Step 13: Start containers"
    },
    @{
        cmd = "sleep 30 && echo 'Waiting for service to start...'"
        desc = "Step 14: Wait 30 seconds"
    },
    @{
        cmd = "cd ${ProjectDir} && docker compose ps"
        desc = "Step 15: Check container status"
    },
    @{
        cmd = "cd ${ProjectDir} && docker compose logs --tail=30 app | grep '7天交易日' || docker compose logs --tail=20 app"
        desc = "Step 16: Check logs"
    }
)

$totalSteps = $deploymentCommands.Count
$currentStep = 0

foreach ($command in $deploymentCommands) {
    $currentStep++
    Write-Host ""
    Write-Host "[$currentStep/$totalSteps] $($command.desc)" -ForegroundColor Cyan
    Write-Host "Command: $($command.cmd)" -ForegroundColor Gray
    Write-Host ""
    
    if ($hasOpenSSH) {
        # Use OpenSSH
        $sshCmd = "echo $ServerPassword | ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $ServerUser@$ServerIP '$($command.cmd)'"
        $result = Invoke-Expression $sshCmd 2>&1
    } elseif ($hasPuTTY) {
        # Use PuTTY plink
        $result = & "C:\Program Files\PuTTY\plink.exe" -batch -pw $ServerPassword "${ServerUser}@${ServerIP}" $command.cmd 2>&1
    }
    
    Write-Host $result -ForegroundColor White
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Verification:" -ForegroundColor Yellow
Write-Host "  1. Visit: http://bk.yushuo.click" -ForegroundColor White
Write-Host "  2. Press Ctrl+Shift+R to force refresh" -ForegroundColor White
Write-Host "  3. Check if data shows today's date after 16:00" -ForegroundColor White
Write-Host "  4. Open F12 Console and look for '[7天交易日]' logs" -ForegroundColor White
Write-Host ""
Write-Host "GitHub: https://github.com/yushuo1991/911/commits/main" -ForegroundColor Cyan
Write-Host ""

