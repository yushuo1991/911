@echo off
chcp 65001 >nul
echo ==========================================
echo 清理冗余文件脚本
echo ==========================================
echo.

echo [分析] 识别冗余的bat文件...
echo.

echo [冗余文件列表]:
echo 1. backup-v4.8.18.bat - 旧版本备份脚本（已有v4.8.24）
echo 2. backup-v4.8.19.bat - 旧版本备份脚本（已有v4.8.24）
echo 3. deploy-v4.3.1.bat - 旧版本部署脚本（已有v4.8.24）
echo 4. deploy-via-ssh.bat - 旧SSH部署脚本（功能已整合）
echo 5. execute-fix.bat - 旧修复脚本（已过时）
echo 6. execute-smart-fix.bat - 旧智能修复脚本（已过时）
echo 7. fix-nginx-502.bat - Nginx修复脚本（已过时）
echo 8. quick-diagnose.bat - 快速诊断脚本（已整合到server-fix-diagnostic.bat）
echo 9. run-remote-diagnose.bat - 远程诊断脚本（已过时）
echo 10. simple-ssh-deploy.bat - 简单SSH部署（功能已整合）
echo.

echo [保留文件]:
echo ✓ deploy-v4.8.24.bat - 最新版本部署脚本
echo ✓ server-fix-diagnostic.bat - 服务器诊断脚本
echo ✓ PUSH-WHEN-NETWORK-OK.bat - Git推送脚本
echo.

set /p confirm="确认删除以上冗余文件吗？(Y/N): "
if /i not "%confirm%"=="Y" (
    echo [取消] 操作已取消
    pause
    exit /b 0
)

echo.
echo [执行] 开始删除冗余文件...
echo.

del /f backup-v4.8.18.bat 2>nul && echo [✓] 已删除: backup-v4.8.18.bat || echo [×] 删除失败: backup-v4.8.18.bat
del /f backup-v4.8.19.bat 2>nul && echo [✓] 已删除: backup-v4.8.19.bat || echo [×] 删除失败: backup-v4.8.19.bat
del /f deploy-v4.3.1.bat 2>nul && echo [✓] 已删除: deploy-v4.3.1.bat || echo [×] 删除失败: deploy-v4.3.1.bat
del /f deploy-via-ssh.bat 2>nul && echo [✓] 已删除: deploy-via-ssh.bat || echo [×] 删除失败: deploy-via-ssh.bat
del /f execute-fix.bat 2>nul && echo [✓] 已删除: execute-fix.bat || echo [×] 删除失败: execute-fix.bat
del /f execute-smart-fix.bat 2>nul && echo [✓] 已删除: execute-smart-fix.bat || echo [×] 删除失败: execute-smart-fix.bat
del /f fix-nginx-502.bat 2>nul && echo [✓] 已删除: fix-nginx-502.bat || echo [×] 删除失败: fix-nginx-502.bat
del /f quick-diagnose.bat 2>nul && echo [✓] 已删除: quick-diagnose.bat || echo [×] 删除失败: quick-diagnose.bat
del /f run-remote-diagnose.bat 2>nul && echo [✓] 已删除: run-remote-diagnose.bat || echo [×] 删除失败: run-remote-diagnose.bat
del /f simple-ssh-deploy.bat 2>nul && echo [✓] 已删除: simple-ssh-deploy.bat || echo [×] 删除失败: simple-ssh-deploy.bat

echo.
echo [完成] 冗余文件清理完成！
echo.
echo [剩余bat文件]:
dir /b *.bat 2>nul
echo.

pause
