@echo off
REM Nginx 502 Fix - Windows SSH Client
REM This script helps you connect to the server and fix the issue

echo =======================================
echo Nginx 502 Bad Gateway Fix - Windows
echo =======================================
echo.

echo Server Details:
echo   Host: yushuo.click (75.2.60.5)
echo   User: root
echo   Port: 22
echo   Password: gJ75hNHdy90TA4qGo9
echo.

echo Method 1: Using Windows SSH Client
echo -----------------------------------
echo.

echo Connecting via SSH...
ssh root@yushuo.click

REM If the above doesn't work, try this:
REM ssh root@75.2.60.5

echo.
echo If SSH connection failed, try these alternatives:
echo.
echo Method 2: Use PuTTY
echo   - Download from: https://www.putty.org/
echo   - Host: yushuo.click
echo   - Port: 22
echo   - Username: root
echo   - Password: gJ75hNHdy90TA4qGo9
echo.
echo Method 3: Use VS Code Remote SSH
echo   - Install "Remote - SSH" extension
echo   - Press F1 and type "Remote-SSH: Connect to Host"
echo   - Enter: root@yushuo.click
echo.
echo Method 4: Use PowerShell SSH
echo   - Open PowerShell
echo   - Run: ssh root@yushuo.click
echo.
pause