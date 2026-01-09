$password = "gJ75hNHdy90TA4qGo9"
$username = "root"
$server = "107.173.154.147"

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "服务器磁盘清理脚本" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# 创建SSH命令函数
function Invoke-SSHCommand {
    param([string]$Command)

    $processInfo = New-Object System.Diagnostics.ProcessStartInfo
    $processInfo.FileName = "ssh"
    $processInfo.Arguments = "-o StrictHostKeyChecking=no $username@$server `"$Command`""
    $processInfo.UseShellExecute = $false
    $processInfo.RedirectStandardOutput = $true
    $processInfo.RedirectStandardError = $true
    $processInfo.RedirectStandardInput = $true

    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $processInfo
    $process.Start() | Out-Null

    # 发送密码
    $process.StandardInput.WriteLine($password)
    $process.StandardInput.Close()

    $output = $process.StandardOutput.ReadToEnd()
    $error = $process.StandardError.ReadToEnd()
    $process.WaitForExit()

    return $output
}

Write-Host "[步骤1/5] 检查磁盘使用情况..." -ForegroundColor Yellow
Invoke-SSHCommand "df -h | head -10"
Write-Host ""

Write-Host "[步骤2/5] 清理旧的构建文件..." -ForegroundColor Yellow
Invoke-SSHCommand "cd /www/wwwroot/stock-tracker && rm -rf .next node_modules backup log && echo '清理完成：.next, node_modules, backup, log'"
Write-Host ""

Write-Host "[步骤3/5] 清理npm缓存..." -ForegroundColor Yellow
Invoke-SSHCommand "npm cache clean --force && echo 'npm缓存已清理'"
Write-Host ""

Write-Host "[步骤4/5] 清理PM2日志..." -ForegroundColor Yellow
Invoke-SSHCommand "pm2 flush && echo 'PM2日志已清理'"
Write-Host ""

Write-Host "[步骤5/5] Git垃圾回收..." -ForegroundColor Yellow
Invoke-SSHCommand "cd /www/wwwroot/stock-tracker && git gc --aggressive --prune=now && echo 'Git垃圾回收完成'"
Write-Host ""

Write-Host "[完成] 检查清理后磁盘使用情况..." -ForegroundColor Green
Invoke-SSHCommand "df -h | head -10"
Write-Host ""

Write-Host "====================================" -ForegroundColor Green
Write-Host "清理完成！" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
