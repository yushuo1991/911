# PowerShell Git Push Script
$ErrorActionPreference = "Stop"

# 获取脚本所在目录
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "当前目录: $(Get-Location)" -ForegroundColor Cyan
Write-Host "正在推送到 GitHub..." -ForegroundColor Yellow

try {
    git push origin main
    Write-Host "`n✓ 推送成功！" -ForegroundColor Green
} catch {
    Write-Host "`n✗ 推送失败: $_" -ForegroundColor Red
    exit 1
}



