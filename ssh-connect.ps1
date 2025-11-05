# PowerShell SSH Connection Script
# Server: bk.yushuo.click (107.173.154.147)

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "SSH Connection to bk.yushuo.click" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$server = "bk.yushuo.click"
$serverIP = "107.173.154.147"
$port = 22
$username = "root"
$password = "gJ75hNHdy90TA4qGo9"

Write-Host "Testing network connectivity..." -ForegroundColor Yellow

# Test if port 22 is accessible
$tcpTest = Test-NetConnection -ComputerName $serverIP -Port $port -WarningAction SilentlyContinue

if ($tcpTest.TcpTestSucceeded) {
    Write-Host "✓ Port $port is open on $serverIP" -ForegroundColor Green
    Write-Host ""
    Write-Host "Attempting SSH connection..." -ForegroundColor Yellow
    Write-Host "Password: $password" -ForegroundColor Gray
    Write-Host ""

    # Method 1: Direct SSH
    Write-Host "Method 1: Direct SSH connection" -ForegroundColor Cyan
    ssh $username@$server

} else {
    Write-Host "✗ Port $port is NOT accessible on $serverIP" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "  1. Firewall blocking the connection" -ForegroundColor White
    Write-Host "  2. SSH is running on a different port" -ForegroundColor White
    Write-Host "  3. Network restrictions" -ForegroundColor White
    Write-Host ""

    # Test common alternative ports
    Write-Host "Testing alternative SSH ports..." -ForegroundColor Yellow
    $altPorts = @(2222, 2200, 22000, 10022)

    foreach ($altPort in $altPorts) {
        Write-Host "Testing port $altPort... " -NoNewline
        $altTest = Test-NetConnection -ComputerName $serverIP -Port $altPort -WarningAction SilentlyContinue
        if ($altTest.TcpTestSucceeded) {
            Write-Host "OPEN" -ForegroundColor Green
            Write-Host ""
            Write-Host "Found open port: $altPort" -ForegroundColor Green
            Write-Host "Try: ssh -p $altPort $username@$server" -ForegroundColor Cyan

            $tryAlt = Read-Host "Try connecting to port ${altPort}? (y/n)"
            if ($tryAlt -eq "y") {
                ssh -p $altPort $username@$server
            }
            break
        } else {
            Write-Host "CLOSED" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Alternative Methods" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If SSH connection failed, try:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Use PuTTY:" -ForegroundColor White
Write-Host "   Download: https://www.putty.org/" -ForegroundColor Gray
Write-Host "   Host: $server (or $serverIP)" -ForegroundColor Gray
Write-Host "   Port: $port" -ForegroundColor Gray
Write-Host "   Username: $username" -ForegroundColor Gray
Write-Host "   Password: $password" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Use Baota Panel (宝塔面板):" -ForegroundColor White
Write-Host "   URL: http://${server}:8888" -ForegroundColor Gray
Write-Host "   Or check your Baota panel port" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Use VS Code Remote-SSH:" -ForegroundColor White
Write-Host "   Install 'Remote - SSH' extension" -ForegroundColor Gray
Write-Host "   F1 → Remote-SSH: Connect to Host" -ForegroundColor Gray
Write-Host "   Enter: $username@$server" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Use MobaXterm (Recommended for Windows):" -ForegroundColor White
Write-Host "   Download: https://mobaxterm.mobatek.net/" -ForegroundColor Gray
Write-Host "   Free version has SSH with password support" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to exit"