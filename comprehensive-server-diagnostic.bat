@echo off
chcp 65001 >nul
echo ==========================================
echo 服务器502错误全面诊断报告
echo 服务器IP: 107.173.154.147
echo 时间: %date% %time%
echo ==========================================

echo.
echo 🔍 1. 基础连通性测试
echo ==========================================
echo 测试服务器基本连通性:
ping -n 3 107.173.154.147 >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 服务器网络不通 - 基础连接失败
    echo 🔧 解决方案: 检查服务器网络状态
) else (
    echo ✅ 服务器网络连通正常
)

echo.
echo 🔍 2. HTTP服务响应测试
echo ==========================================
echo 测试80端口HTTP服务:
curl -s -o NUL -w "HTTP状态码: %%{http_code}, 响应时间: %%{time_total}s" http://107.173.154.147 --connect-timeout 10
echo.

echo 测试直接3000端口:
curl -s -o NUL -w "3000端口状态码: %%{http_code}" http://107.173.154.147:3000 --connect-timeout 10
echo.

echo.
echo 🔍 3. 宝塔面板连通性测试
echo ==========================================
echo 测试宝塔面板8888端口:
curl -s -o NUL -w "宝塔面板状态码: %%{http_code}" http://107.173.154.147:8888 --connect-timeout 10
echo.

echo.
echo 🔍 4. 详细错误信息获取
echo ==========================================
echo 获取详细502错误信息:
curl -v http://107.173.154.147 2>&1 | findstr /i "server\|error\|gateway\|nginx"

echo.
echo 🔍 5. 可能的问题模块分析
echo ==========================================
echo.
echo 📊 Nginx代理模块状态:
echo    502 Bad Gateway 通常表示Nginx无法连接到后端应用
echo    ❓ 检查要点: 后端应用是否在3000端口运行
echo.
echo 📊 Node.js应用模块状态:
echo    ❓ 检查要点: 应用是否在服务器上启动
echo    ❓ 检查要点: 应用是否监听0.0.0.0:3000而非localhost:3000
echo.
echo 📊 防火墙模块状态:
echo    ❓ 检查要点: 3000端口是否被防火墙阻止
echo    ❓ 检查要点: 安全组规则是否允许3000端口
echo.
echo 📊 进程管理模块状态:
echo    ❓ 检查要点: PM2或其他进程管理器状态
echo    ❓ 检查要点: 应用进程是否异常退出

echo.
echo 🔧 6. 问题诊断和解决步骤
echo ==========================================

echo.
echo 步骤1: 检查服务器上的应用状态
echo ----------------------------------------
echo 请登录服务器执行以下命令:
echo.
echo ssh root@107.173.154.147
echo.
echo # 检查应用进程
echo ps aux ^| grep node
echo.
echo # 检查3000端口监听
echo netstat -tulpn ^| grep :3000
echo.
echo # 检查宝塔面板Node.js管理
echo 访问: http://107.173.154.147:8888
echo 路径: 软件商店 -^> Node.js版本管理 -^> Node.js项目管理

echo.
echo 步骤2: 检查Nginx配置
echo ----------------------------------------
echo # 检查Nginx状态
echo systemctl status nginx
echo.
echo # 检查Nginx配置文件
echo nginx -t
echo.
echo # 查看Nginx错误日志
echo tail -f /var/log/nginx/error.log

echo.
echo 步骤3: 重启相关服务
echo ----------------------------------------
echo # 重启Nginx
echo systemctl restart nginx
echo.
echo # 重启Node.js应用 (通过宝塔面板或PM2)
echo pm2 restart stock-tracker
echo # 或在宝塔面板中重启Node.js项目

echo.
echo 🚨 7. 常见502错误原因排查
echo ==========================================

echo.
echo ❌ 原因1: 后端应用未运行
echo    影响模块: Node.js应用模块
echo    表现: Nginx能启动但无法连接到3000端口
echo    解决: 启动Node.js应用
echo.
echo ❌ 原因2: 监听地址错误
echo    影响模块: 网络监听模块
echo    表现: 应用只监听localhost:3000，外部无法访问
echo    解决: 修改为监听0.0.0.0:3000
echo.
echo ❌ 原因3: 端口被占用或冲突
echo    影响模块: 端口管理模块
echo    表现: 应用无法绑定到3000端口
echo    解决: 检查端口占用，杀死冲突进程
echo.
echo ❌ 原因4: 防火墙阻止
echo    影响模块: 防火墙安全模块
echo    表现: 外部无法访问3000端口
echo    解决: 开放3000端口或配置安全组
echo.
echo ❌ 原因5: Nginx配置错误
echo    影响模块: Nginx代理模块
echo    表现: 代理配置指向错误的后端地址
echo    解决: 检查和修正Nginx虚拟主机配置
echo.
echo ❌ 原因6: 应用启动失败
echo    影响模块: 应用启动模块
echo    表现: 应用因环境问题无法正常启动
echo    解决: 检查环境变量、依赖、权限等

echo.
echo 📋 8. 立即执行的检查命令
echo ==========================================
echo.
echo 请在服务器上执行以下诊断命令:
echo.
echo # 1. 检查应用是否运行
echo ps aux ^| grep -E "node^|pm2"
echo.
echo # 2. 检查端口监听
echo ss -tlnp ^| grep :3000
echo.
echo # 3. 测试本地访问
echo curl -I http://localhost:3000
echo.
echo # 4. 查看Nginx错误日志
echo tail -20 /var/log/nginx/error.log
echo.
echo # 5. 检查系统资源
echo top -bn1 ^| head -20
echo.
echo # 6. 检查磁盘空间
echo df -h

echo.
echo ==========================================
echo 🎯 下一步行动建议:
echo ==========================================
echo 1. 登录服务器执行上述诊断命令
echo 2. 检查宝塔面板中Node.js项目状态
echo 3. 查看应用和Nginx错误日志
echo 4. 根据具体错误信息进行targeted修复
echo ==========================================

pause