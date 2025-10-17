# 一键推送并部署脚本
# 使用方法: .\quick-push-deploy.ps1 "你的提交信息"

param(
    [string]$commitMessage = "更新代码"
)

Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🚀 一键推送并部署到服务器     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 步骤1: Git 提交
Write-Host "📝 步骤1/3: 提交代码..." -ForegroundColor Yellow
git add .
git status --short
git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  没有新的修改需要提交" -ForegroundColor Yellow
} else {
    Write-Host "✅ 代码已提交" -ForegroundColor Green
}

# 步骤2: 推送到 GitHub
Write-Host "`n📤 步骤2/3: 推送到 GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 推送失败，请检查网络或权限" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 推送成功" -ForegroundColor Green

# 步骤3: 部署到服务器
Write-Host "`n🚀 步骤3/3: 部署到服务器..." -ForegroundColor Yellow
npm run deploy

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 部署失败" -ForegroundColor Red
    Write-Host "💡 提示：可以使用宝塔面板手动部署" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║       ✅ 部署完成！              ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 访问地址: http://bk.yushuo.click" -ForegroundColor Cyan
Write-Host "💡 按 Ctrl+Shift+R 强制刷新浏览器" -ForegroundColor Yellow
Write-Host ""

