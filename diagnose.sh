#!/bin/bash
# 股票追踪系统诊断脚本
# 用途: 快速诊断系统状态，生成详细报告
# 使用: ./diagnose.sh

LOG_DIR="log"
REPORT_FILE="$LOG_DIR/diagnostic-report-$(date +%Y%m%d-%H%M%S).txt"

# 创建日志目录
mkdir -p "$LOG_DIR"

# 开始诊断
{
    echo "=================================================================="
    echo "          股票追踪系统诊断报告"
    echo "=================================================================="
    echo "生成时间: $(date)"
    echo "报告文件: $REPORT_FILE"
    echo ""

    echo "1. 基础系统信息"
    echo "----------------------------------------"
    echo "   当前版本: $(cat VERSION 2>/dev/null || echo '❌ 未找到版本文件')"
    echo "   系统时间: $(date)"
    echo "   服务器IP: $(curl -s --connect-timeout 5 ifconfig.me 2>/dev/null || echo '❌ 无法获取外网IP')"
    echo "   主机名称: $(hostname)"
    echo "   系统类型: $(uname -s)"
    echo "   内核版本: $(uname -r)"
    echo ""

    echo "2. Docker服务状态"
    echo "----------------------------------------"
    if command -v docker &> /dev/null; then
        if systemctl is-active --quiet docker; then
            echo "   ✅ Docker服务运行正常"
            echo "   Docker版本: $(docker --version)"
            echo ""
            echo "   容器状态:"
            docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}" 2>/dev/null || echo "   ❌ 无法获取容器信息"
        else
            echo "   ❌ Docker服务未运行"
        fi
    else
        echo "   ❌ Docker未安装"
    fi
    echo ""

    echo "3. 网络服务检查"
    echo "----------------------------------------"
    # 本地服务检查
    LOCAL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 http://127.0.0.1:3000 2>/dev/null)
    if [ "$LOCAL_STATUS" = "200" ]; then
        echo "   ✅ 本地服务 (3000端口): HTTP $LOCAL_STATUS - 正常"
    else
        echo "   ❌ 本地服务 (3000端口): HTTP $LOCAL_STATUS - 异常"
    fi

    # 外网访问检查
    EXTERNAL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 15 https://bk.yushuo.click 2>/dev/null)
    if [ "$EXTERNAL_STATUS" = "200" ]; then
        echo "   ✅ 外网访问 (bk.yushuo.click): HTTP $EXTERNAL_STATUS - 正常"
    else
        echo "   ❌ 外网访问 (bk.yushuo.click): HTTP $EXTERNAL_STATUS - 异常"
    fi

    # 端口监听检查
    echo "   监听端口:"
    netstat -tlnp 2>/dev/null | grep -E ":3000|:80|:443|:8888" || echo "   未发现相关端口监听"
    echo ""

    echo "4. 系统资源使用"
    echo "----------------------------------------"
    echo "   磁盘空间使用:"
    df -h | grep -E "(/$|/www|/var)" | awk '{printf "   %-20s %s/%s (%s)\n", $6, $3, $2, $5}'
    echo ""

    echo "   内存使用情况:"
    free -h | awk 'NR==2{printf "   内存: %s/%s (%.2f%% 已使用)\n", $3,$2,$3/$2*100}'
    echo ""

    echo "   CPU负载:"
    uptime | awk -F'load average:' '{print "   " $2}'
    echo ""

    echo "5. 备份系统状态"
    echo "----------------------------------------"
    if [ -d "backups" ]; then
        BACKUP_COUNT=$(ls -1 backups/ 2>/dev/null | grep "^v" | wc -l)
        echo "   ✅ 备份目录存在"
        echo "   本地备份数量: $BACKUP_COUNT 个"
        echo "   最新备份:"
        ls -t backups/ 2>/dev/null | grep "^v" | head -3 | awk '{print "     " $1}'
        echo ""
        echo "   备份占用空间:"
        du -sh backups/ 2>/dev/null | awk '{print "     " $1}' || echo "     无法计算"
    else
        echo "   ❌ 备份目录不存在"
    fi
    echo ""

    echo "6. Docker镜像状态"
    echo "----------------------------------------"
    if command -v docker &> /dev/null; then
        DOCKER_IMAGES=$(docker images stock-tracker --format 'table {{.Tag}}\t{{.Size}}' 2>/dev/null)
        if [ -n "$DOCKER_IMAGES" ]; then
            echo "   Stock-tracker镜像:"
            echo "$DOCKER_IMAGES" | sed 's/^/     /'
        else
            echo "   ❌ 未找到stock-tracker镜像"
        fi
        echo ""
        echo "   Docker总体空间使用:"
        docker system df 2>/dev/null | sed 's/^/     /' || echo "     无法获取Docker空间信息"
    fi
    echo ""

    echo "7. 应用日志分析 (最近20行)"
    echo "----------------------------------------"
    if docker ps | grep -q stock-tracker-app; then
        echo "   最近日志:"
        docker logs stock-tracker-app --tail 20 2>/dev/null | sed 's/^/     /' || echo "     无法获取日志"
        echo ""
        echo "   错误日志统计:"
        ERROR_COUNT=$(docker logs stock-tracker-app 2>&1 | grep -i error | wc -l)
        WARNING_COUNT=$(docker logs stock-tracker-app 2>&1 | grep -i warning | wc -l)
        echo "     错误信息: $ERROR_COUNT 条"
        echo "     警告信息: $WARNING_COUNT 条"
    else
        echo "   ❌ stock-tracker-app 容器未运行"
    fi
    echo ""

    echo "8. 网络连通性测试"
    echo "----------------------------------------"
    echo "   DNS解析测试:"
    if nslookup bk.yushuo.click >/dev/null 2>&1; then
        echo "     ✅ bk.yushuo.click DNS解析正常"
    else
        echo "     ❌ bk.yushuo.click DNS解析失败"
    fi

    echo "   外网连接测试:"
    if ping -c 1 8.8.8.8 >/dev/null 2>&1; then
        echo "     ✅ 外网连接正常"
    else
        echo "     ❌ 外网连接异常"
    fi
    echo ""

    echo "9. 安全检查"
    echo "----------------------------------------"
    echo "   关键文件权限:"
    ls -la VERSION deploy.sh version-manager.sh 2>/dev/null | awk '{printf "     %s %s %s\n", $1, $3, $9}' || echo "     无法检查文件权限"
    echo ""

    echo "   进程检查:"
    ps aux | grep -E "(docker|node|nginx)" | grep -v grep | head -5 | awk '{printf "     %s %s %s\n", $1, $2, $11}' || echo "     无关键进程运行"
    echo ""

    echo "=================================================================="
    echo "诊断完成时间: $(date)"

    # 生成建议
    echo ""
    echo "🔧 系统建议:"
    if [ "$LOCAL_STATUS" != "200" ]; then
        echo "   - 本地服务异常，建议执行: docker restart stock-tracker-app"
    fi
    if [ "$EXTERNAL_STATUS" != "200" ]; then
        echo "   - 外网访问异常，检查反向代理配置或防火墙设置"
    fi
    if [ ! -d "backups" ] || [ "$BACKUP_COUNT" -lt 1 ]; then
        echo "   - 建议创建备份: ./version-manager.sh backup patch '系统诊断后备份'"
    fi
    echo "=================================================================="

} | tee "$REPORT_FILE"

echo ""
echo "📊 诊断报告已保存到: $REPORT_FILE"
echo "💡 查看报告: cat $REPORT_FILE"
echo "🔄 如需重新诊断: ./diagnose.sh"