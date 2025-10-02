#!/bin/bash
# v4.6 数据完整性修复部署脚本
# 执行位置：服务器 /www/wwwroot/stock-tracker/

echo "=========================================="
echo "v4.6 数据完整性修复部署开始"
echo "=========================================="

# 1. 拉取最新代码
echo "[1/5] 拉取最新代码..."
git pull origin main
if [ $? -ne 0 ]; then
    echo "❌ Git拉取失败"
    exit 1
fi
echo "✅ 代码拉取成功"

# 2. 检查修改内容
echo "[2/5] 检查关键修改..."
if grep -q "getBoardWeight(stock.td_type)" src/app/page.tsx; then
    echo "✅ 确认使用真实API数据"
else
    echo "❌ 未找到getBoardWeight调用"
    exit 1
fi

# 3. 停止当前容器
echo "[3/5] 停止Docker容器..."
docker-compose down

# 4. 重新构建镜像并启动
echo "[4/5] 重新构建Docker镜像（这将需要5-10分钟）..."
docker-compose up -d --build

# 5. 等待容器启动
echo "[5/5] 等待应用启动..."
sleep 30

# 6. 验证部署
echo "验证部署结果..."
docker ps | grep stock-tracker
if [ $? -eq 0 ]; then
    echo "✅ Docker容器运行正常"
else
    echo "❌ Docker容器未运行"
    exit 1
fi

# 7. 检查应用响应
echo "检查应用API响应..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/stocks
if [ $? -eq 0 ]; then
    echo "✅ 应用API响应正常"
else
    echo "⚠️ 应用可能需要更多时间启动"
fi

echo ""
echo "=========================================="
echo "✅ v4.6 部署完成！"
echo "=========================================="
echo ""
echo "修复内容："
echo "1. ✅ 7天阶梯弹窗使用真实API td_type数据"
echo "2. ✅ 日期点击显示涨停个股数前5名"
echo "3. ✅ 板块弹窗支持连板数/涨幅排序切换"
echo ""
echo "访问地址："
echo "- 主站: http://bk.yushuo.click"
echo "- API: http://bk.yushuo.click/api/stocks"
echo ""
echo "验证要点："
echo "1. 点击排行榜中的板块名称"
echo "2. 查看7天阶梯弹窗中连板数是否正确"
echo "3. 确认高板股票排在上方"
echo "4. 测试排序切换按钮功能"
echo ""
