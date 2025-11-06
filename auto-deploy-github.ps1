# GitHub CLI Auto Deploy Script
# Complete automation for deployment setup

param(
    [string]$RepoName = "stock-tracker",
    [string]$ServerHost = "107.173.154.147",
    [string]$ServerUser = "root",
    [string]$ServerPort = "22"
)

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  GitHub CLI Auto Deploy - Complete Automation" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check GitHub CLI
Write-Host "Step 1/8: Checking GitHub CLI..." -ForegroundColor Cyan
try {
    $ghVersion = gh --version 2>&1 | Select-Object -First 1
    Write-Host "[OK] GitHub CLI installed: $ghVersion" -ForegroundColor Green
} catch {
    Write-Host "[!] GitHub CLI not installed" -ForegroundColor Red
    Write-Host "Installing GitHub CLI..." -ForegroundColor Yellow
    winget install --id GitHub.cli --silent
    Write-Host "[OK] GitHub CLI installed" -ForegroundColor Green
    Write-Host "Please reopen PowerShell and run this script again" -ForegroundColor Yellow
    exit 0
}

# Check login status
Write-Host ""
Write-Host "Checking GitHub login status..." -ForegroundColor Cyan
$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[!] Not logged in to GitHub" -ForegroundColor Red
    Write-Host "Starting login process..." -ForegroundColor Yellow
    gh auth login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[X] Login failed" -ForegroundColor Red
        exit 1
    }
}
Write-Host "[OK] Logged in to GitHub" -ForegroundColor Green
Write-Host ""

# Step 2: Initialize Git
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Step 2/8: Initializing Git repository..." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".git")) {
    git init
    Write-Host "[OK] Git initialized" -ForegroundColor Green
} else {
    Write-Host "[OK] Git already initialized" -ForegroundColor Green
}

git add .
git commit -m "Initial commit: Automated deployment setup" 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Files committed" -ForegroundColor Green
} else {
    Write-Host "[i] No changes to commit" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Create GitHub repo
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Step 3/8: Creating GitHub repository..." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$repoExists = gh repo view $RepoName 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[i] Repository already exists: $RepoName" -ForegroundColor Yellow
} else {
    Write-Host "Creating repository..." -ForegroundColor Yellow
    gh repo create $RepoName --private --source=. --remote=origin --push
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Repository created" -ForegroundColor Green
    } else {
        Write-Host "[X] Failed to create repository" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Step 4: Configure Secrets
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Step 4/8: Configuring GitHub Secrets..." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Setting SERVER_HOST..." -ForegroundColor Yellow
gh secret set SERVER_HOST --body $ServerHost
Write-Host "[OK] SERVER_HOST set" -ForegroundColor Green

Write-Host "Setting SERVER_USER..." -ForegroundColor Yellow
gh secret set SERVER_USER --body $ServerUser
Write-Host "[OK] SERVER_USER set" -ForegroundColor Green

Write-Host "Setting SERVER_PORT..." -ForegroundColor Yellow
gh secret set SERVER_PORT --body $ServerPort
Write-Host "[OK] SERVER_PORT set" -ForegroundColor Green

Write-Host ""
Write-Host "SSH Key Configuration:" -ForegroundColor Yellow
Write-Host "1. Use existing SSH key file" -ForegroundColor Gray
Write-Host "2. Skip (configure later)" -ForegroundColor Gray
Write-Host ""
$choice = Read-Host "Choose [1/2]"

if ($choice -eq "1") {
    $keyPath = Read-Host "Enter SSH private key file path"
    if (Test-Path $keyPath) {
        $keyContent = Get-Content $keyPath -Raw
        $keyContent | gh secret set SERVER_SSH_KEY
        Write-Host "[OK] SERVER_SSH_KEY set" -ForegroundColor Green
    } else {
        Write-Host "[X] File not found: $keyPath" -ForegroundColor Red
        Write-Host "Please configure SERVER_SSH_KEY manually later" -ForegroundColor Yellow
    }
} else {
    Write-Host "[i] Skipped SSH key configuration" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To configure SSH key later:" -ForegroundColor Cyan
    Write-Host "1. Generate key on server: ssh-keygen -t ed25519 -f ~/.ssh/github_deploy" -ForegroundColor Gray
    Write-Host "2. Add to authorized_keys: cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys" -ForegroundColor Gray
    Write-Host "3. Set secret: cat private_key | gh secret set SERVER_SSH_KEY" -ForegroundColor Gray
}
Write-Host ""

# Step 5: Initialize server
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Step 5/8: Initialize server environment" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$initServer = Read-Host "Initialize server now? (Y/n)"
if ($initServer -eq "Y" -or $initServer -eq "y" -or $initServer -eq "") {
    Write-Host "Uploading init script..." -ForegroundColor Yellow
    scp server-deploy-setup.sh "${ServerUser}@${ServerHost}:/root/"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Script uploaded" -ForegroundColor Green
        Write-Host "Running init script on server..." -ForegroundColor Yellow
        ssh "${ServerUser}@${ServerHost}" "chmod +x /root/server-deploy-setup.sh && /root/server-deploy-setup.sh"
        Write-Host "[OK] Server initialized" -ForegroundColor Green
    } else {
        Write-Host "[X] Upload failed" -ForegroundColor Red
    }
} else {
    Write-Host "[i] Skipped server initialization" -ForegroundColor Yellow
}
Write-Host ""

# Step 6: Push code
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Step 6/8: Pushing code to GitHub..." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$currentBranch = git branch --show-current
if ([string]::IsNullOrWhiteSpace($currentBranch)) {
    git branch -M main
    $currentBranch = "main"
}

Write-Host "Pushing branch: $currentBranch" -ForegroundColor Yellow
git push -u origin $currentBranch

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Code pushed" -ForegroundColor Green
} else {
    Write-Host "[X] Push failed" -ForegroundColor Red
}
Write-Host ""

# Step 7: Trigger workflow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Step 7/8: Triggering deployment..." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Waiting for GitHub Actions..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

gh workflow run deploy.yml 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Deployment triggered" -ForegroundColor Green
} else {
    Write-Host "[i] Workflow will trigger on next push" -ForegroundColor Yellow
}
Write-Host ""

# Step 8: Monitor
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Step 8/8: Deployment status" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

Start-Sleep -Seconds 3
$runs = gh run list --workflow=deploy.yml --limit=1 --json status,url 2>&1 | ConvertFrom-Json

if ($LASTEXITCODE -eq 0 -and $runs.Count -gt 0) {
    $run = $runs[0]
    Write-Host "Status: $($run.status)" -ForegroundColor Yellow
    Write-Host "URL: $($run.url)" -ForegroundColor Cyan
    Write-Host ""
    
    $watch = Read-Host "Monitor deployment? (Y/n)"
    if ($watch -eq "Y" -or $watch -eq "y" -or $watch -eq "") {
        Write-Host "Starting monitor (Ctrl+C to exit)..." -ForegroundColor Cyan
        gh run watch
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  Configuration Complete!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Workflow:" -ForegroundColor Yellow
Write-Host "  1. Edit code" -ForegroundColor Cyan
Write-Host "  2. git add . && git commit -m 'message' && git push" -ForegroundColor Cyan
Write-Host "  3. GitHub Actions auto-deploy" -ForegroundColor Cyan
Write-Host ""
Write-Host "URL: http://$ServerHost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Commands:" -ForegroundColor Yellow
Write-Host "  gh run list --workflow=deploy.yml" -ForegroundColor Gray
Write-Host "  gh run watch" -ForegroundColor Gray
Write-Host "  gh run view --log" -ForegroundColor Gray
Write-Host ""





