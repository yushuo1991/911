#!/bin/bash
# Docker容器诊断脚本 - 502错误排查
# 适用于宝塔面板Docker部署

echo "=== Stock Tracker Docker 诊断报告 ==="
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "服务器: 107.173.154.147"
echo "域名: bk.yushuo.click"
echo ""

# 1. 检查Docker服务状态
echo "1. 检查Docker服务状态"
echo "------------------------"
systemctl status docker --no-pager -l
echo ""

# 2. 检查容器状态
echo "2. 检查容器运行状态"
echo "------------------------"
docker ps -a --filter name=stock-tracker-app
echo ""

# 3. 检查容器详细信息
echo "3. 容器详细配置信息"
echo "------------------------"
docker inspect stock-tracker-app 2>/dev/null || echo "容器不存在或无法访问"
echo ""

# 4. 检查容器日志（最近100行）
echo "4. 容器启动日志（最近100行）"
echo "------------------------"
docker logs --tail=100 stock-tracker-app 2>/dev/null || echo "无法获取容器日志"
echo ""

# 5. 检查端口监听情况
echo "5. 检查端口3000监听状态"
echo "------------------------"
netstat -tlnp | grep :3000
ss -tlnp | grep :3000
echo ""

# 6. 检查防火墙状态
echo "6. 检查防火墙端口3000状态"
echo "------------------------"
ufw status | grep 3000 || echo "UFW可能未启用或无3000端口规则"
iptables -L | grep 3000 || echo "iptables无3000端口规则"
echo ""

# 7. 测试内部连接
echo "7. 测试内部服务连接"
echo "------------------------"
curl -I -m 5 http://127.0.0.1:3000 2>&1 || echo "内部连接失败"
curl -I -m 5 http://127.0.0.1:3000/api/health 2>&1 || echo "健康检查失败"
echo ""

# 8. 检查Nginx反向代理
echo "8. 检查Nginx反向代理配置"
echo "------------------------"
nginx -t 2>&1
nginx -s reload 2>&1
echo ""

# 9. 检查宝塔面板Docker镜像
echo "9. 检查Docker镜像状态"
echo "------------------------"
docker images | grep stock-tracker
echo ""

# 10. 系统资源使用情况
echo "10. 系统资源使用情况"
echo "------------------------"
echo "内存使用:"
free -h
echo ""
echo "磁盘使用:"
df -h
echo ""
echo "CPU负载:"
uptime
echo ""

# 11. Docker守护进程日志
echo "11. Docker守护进程日志（最近50行）"
echo "------------------------"
journalctl -u docker --no-pager -n 50
echo ""

# 12. 诊断建议
echo "12. 问题诊断建议"
echo "------------------------"
CONTAINER_STATUS=$(docker ps -q -f name=stock-tracker-app)
if [ -z "$CONTAINER_STATUS" ]; then
    echo "❌ 容器未运行 - 需要启动容器"
    echo "   解决方案: 在宝塔面板Docker管理中启动容器"
else
    echo "✅ 容器正在运行"

    # 检查端口监听
    if netstat -tlnp | grep -q :3000; then
        echo "✅ 端口3000正在监听"
    else
        echo "❌ 端口3000未监听 - 应用程序启动失败"
        echo "   解决方案: 查看容器日志排查应用启动问题"
    fi

    # 测试内部连接
    if curl -s -m 3 http://127.0.0.1:3000 >/dev/null 2>&1; then
        echo "✅ 内部连接正常"
        echo "❌ 可能是反向代理配置问题"
        echo "   解决方案: 检查宝塔面板网站反向代理设置"
    else
        echo "❌ 内部连接失败 - 应用程序响应异常"
        echo "   解决方案: 重新构建Docker镜像或检查应用配置"
    fi
fi

echo ""
echo "=== 诊断完成 ==="
echo "详细信息请查看上述各项检查结果"
echo "如需进一步协助，请提供容器日志信息"