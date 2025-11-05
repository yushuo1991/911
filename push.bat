@echo off
chcp 65001 >nul
cd /d "%~dp0"
git push origin main
pause



