@echo off
chcp 65001 >nul
echo ========================================
echo   Git自动部署到服务器
echo ========================================
echo.

echo [1/3] 连接到服务器...
echo.

REM 使用plink（PuTTY）或ssh命令
where plink >nul 2>&1
if %errorlevel% equ 0 (
    echo 使用PuTTY plink连接...
    plink -pw gJ75hNHdy90TA4qGo9 root@yushuo.click -batch -m server-deploy-git.txt
) else (
    echo 使用OpenSSH连接...
    ssh root@yushuo.click < server-deploy-git.txt
)

echo.
echo ========================================
echo   部署完成！
echo ========================================
echo.
echo 访问地址: http://yushuo.click:3002
echo.
pause