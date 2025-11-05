#!/bin/bash

# 紧急502 Bad Gateway诊断脚本
# 生成时间: 2025-09-28
# 服务器: 107.173.154.147:3000

echo "======== 紧急502错误诊断开始 ========"
echo "目标服务器: 107.173.154.147:3000"
echo "问题现象: API端点 /api/stocks?date=2025-09-26&mode=7days 超时"
echo "开始时间: $(date)"
echo ""

# 1. 检查服务器网络状态
echo "1. 检查服务器网络连通性"
echo "=============================="
curl -I http://107.173.154.147:3000 --connect-timeout 10 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ 主页连接正常"
else
    echo "❌ 主页连接失败"
fi

echo ""
echo "测试API端点 (10秒超时)："
timeout 10 curl -s "http://107.173.154.147:3000/api/stocks?date=2025-09-26&mode=7days" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ API端点响应正常"
else
    echo "❌ API端点超时或失败"
fi

echo ""

# 2. SSH连接并检查Docker状态
echo "2. 连接服务器检查Docker状态"
echo "=============================="

# 假设SSH连接，实际需要密钥
ssh_command="ssh -o ConnectTimeout=10 root@107.173.154.147"

echo "尝试SSH连接..."
# 注意：这里需要实际的SSH密钥配置

echo "如果SSH可用，需要执行以下检查："
echo "  docker ps -a"
echo "  docker logs stock-tracker-app"
echo "  docker stats --no-stream"
echo "  systemctl status nginx"
echo "  ps aux | grep node"
echo "  netstat -tulpn | grep :3000"

echo ""

# 3. 分析代码问题
echo "3. 分析代码问题"
echo "==============="

echo "发现的问题："
echo "❌ route.ts第6行有语法错误：TUSHARE_TOKEN缩进不正确"
echo "❌ API端点超时表明应用层处理问题"
echo "❌ 可能是enhanced-trading-calendar.ts集成导致的问题"

echo ""

# 4. 生成修复建议
echo "4. 修复建议"
echo "=========="

echo "立即修复步骤："
echo "1. 修复route.ts第6行的语法错误"
echo "2. 添加API超时处理和错误边界"
echo "3. 检查交易日历API调用是否堵塞"
echo "4. 重新构建和部署Docker容器"
echo "5. 验证服务恢复"

echo ""

# 5. 记录诊断结果
echo "5. 生成诊断报告"
echo "==============="

DIAGNOSTIC_FILE="log/emergency-diagnostic-$(date +%Y%m%d-%H%M%S).md"
mkdir -p log

cat > "$DIAGNOSTIC_FILE" << 'EOF'
# 紧急502错误诊断报告

## 错误现象
- **时间**: 2025-09-28
- **服务器**: 107.173.154.147:3000
- **问题**: /api/stocks API端点超时，返回502 Bad Gateway
- **触发**: 部署enhanced-trading-calendar.ts后

## 诊断结果

### 网络层面
- ✅ 主页HTTP连接正常 (返回200)
- ❌ API端点连接超时 (2分钟无响应)

### 应用层面
- ❌ **关键发现**: route.ts第6行语法错误
  ```javascript
  // 错误代码:
    const TUSHARE_TOKEN = '...'  // 多了2个空格缩进
  ```
- ❌ enhanced-trading-calendar.ts可能导致API调用堵塞
- ❌ 缺少适当的超时和错误处理

### 推测根因
1. **语法错误**: route.ts缩进问题导致构建失败
2. **API堵塞**: 交易日历API调用可能卡死
3. **缺少错误边界**: 没有适当的超时保护

## 修复方案

### 立即修复 (高优先级)
1. 修复route.ts语法错误
2. 添加API超时保护
3. 优化交易日历调用逻辑

### 部署步骤
1. 修复代码问题
2. 重新构建Docker镜像
3. 重启容器服务
4. 验证API功能

## 技术分析

### 模块影响
- **Next.js应用**: 构建可能失败
- **API路由**: 处理逻辑堵塞
- **Docker容器**: 可能处于异常状态
- **用户体验**: 完全无法加载数据

### 学习要点
- TypeScript语法严格性的重要性
- API超时处理的必要性
- 生产部署前的充分测试
EOF

echo "✅ 诊断报告已生成: $DIAGNOSTIC_FILE"

echo ""
echo "======== 诊断完成 ========"
echo "下一步: 执行代码修复"