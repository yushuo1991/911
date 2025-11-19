@echo off
chcp 65001 >nul
echo ========================================
echo   清理项目冗余文件
echo ========================================
echo.

set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

echo 准备删除以下冗余文件和文件夹：
echo.
echo [1] 冗余的TXT文档（10个）
echo [2] 冗余的MD文档（约8个）
echo [3] 冗余的BAT脚本（2个）
echo [4] backup文件夹（约100MB）
echo [5] log文件夹（诊断日志）
echo [6] nul文件
echo.

set /p confirm="确认删除？(Y/N): "
if /i not "%confirm%"=="Y" (
    echo 取消清理操作
    pause
    exit /b
)

echo.
echo 开始清理...
echo.

REM 删除冗余的TXT文件
echo [1/6] 删除冗余TXT文件...
del /q "README-开始这里.txt" 2>nul
del /q "【最终方案】完整执行指南.txt" 2>nul
del /q "从这里开始.txt" 2>nul
del /q "完全自动化-最终方案.txt" 2>nul
del /q "当前状态汇总.txt" 2>nul
del /q "方案1-执行指南.txt" 2>nul
del /q "清理总结.txt" 2>nul
del /q "立即执行这个.txt" 2>nul
del /q "验证命令.txt" 2>nul
del /q "验证结果指南.txt" 2>nul
echo    ✓ TXT文件已清理

REM 删除冗余的MD文件
echo [2/6] 删除冗余MD文件...
del /q "DATA-STATUS-CHECK.md" 2>nul
del /q "WEB-UPLOAD-STEPS.md" 2>nul
del /q "UPLOAD-CHECKLIST.md" 2>nul
del /q "GitHub-CLI完全自动化指南.md" 2>nul
del /q "PROJECT-REORGANIZATION.md" 2>nul
del /q "STOCK-CODE-FIX.md" 2>nul
del /q "紧急修复-磁盘空间不足.md" 2>nul
del /q "问题排查报告-海峡创新数据错误.md" 2>nul
del /q "TIMEZONE-FIX-REPORT.md" 2>nul
del /q "MANUAL-UPLOAD-GUIDE.md" 2>nul
echo    ✓ MD文件已清理

REM 删除冗余的BAT文件
echo [3/6] 删除冗余BAT文件...
del /q "一键清理并部署.bat" 2>nul
del /q "验证服务器状态.bat" 2>nul
echo    ✓ BAT文件已清理

REM 删除backup文件夹
echo [4/6] 删除backup文件夹...
if exist "backup" (
    rmdir /s /q "backup"
    echo    ✓ backup文件夹已删除
) else (
    echo    - backup文件夹不存在
)

REM 删除log文件夹
echo [5/6] 删除log文件夹...
if exist "log" (
    rmdir /s /q "log"
    echo    ✓ log文件夹已删除
) else (
    echo    - log文件夹不存在
)

REM 删除nul文件
echo [6/6] 删除nul文件...
del /q "nul" 2>nul
echo    ✓ nul文件已删除

echo.
echo ========================================
echo   清理完成！
echo ========================================
echo.
echo 已删除的文件类型：
echo   - TXT文档: 10个
echo   - MD文档: 10个
echo   - BAT脚本: 2个
echo   - backup文件夹: 1个
echo   - log文件夹: 1个
echo   - nul文件: 1个
echo.
echo 保留的重要文件：
echo   ✓ README.md
echo   ✓ CLAUDE.md
echo   ✓ SECURITY-CONFIG.md
echo   ✓ GitHub-CLI自动化.bat
echo   ✓ git-push.bat
echo.

pause
