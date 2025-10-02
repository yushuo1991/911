$ports = @(22, 2222, 2022, 8022, 10022, 8080, 80, 443, 3002)
$host_name = "yushuo.click"

Write-Host "Testing ports on $host_name..." -ForegroundColor Cyan
Write-Host ""

foreach ($port in $ports) {
    Write-Host "Testing port $port..." -NoNewline
    $result = Test-NetConnection -ComputerName $host_name -Port $port -WarningAction SilentlyContinue -InformationLevel Quiet
    if ($result) {
        Write-Host " OPEN" -ForegroundColor Green
    } else {
        Write-Host " CLOSED" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Port scan completed." -ForegroundColor Cyan