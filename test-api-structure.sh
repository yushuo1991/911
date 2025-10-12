#!/bin/bash
# 测试API数据结构脚本

echo "正在请求API数据..."

curl -s 'https://apphis.longhuvip.com/w1/api/index.php' \
  -X POST \
  -H 'Content-Type: application/x-www-form-urlencoded; charset=utf-8' \
  -H 'Accept: */*' \
  -H 'User-Agent: lhb/5.21.1 (com.kaipanla.www; build:1; iOS 18.6.2) Alamofire/4.9.1' \
  --data-urlencode 'Date=20251009' \
  --data-urlencode 'Index=0' \
  --data-urlencode 'PhoneOSNew=2' \
  --data-urlencode 'VerSion=5.21.0.1' \
  --data-urlencode 'a=GetPlateInfo_w38' \
  --data-urlencode 'apiv=w42' \
  --data-urlencode 'c=HisLimitResumption' \
  --data-urlencode 'st=20' > /tmp/api_response.json

echo ""
echo "=== 检查API响应 ==="
cat /tmp/api_response.json | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'list' in data and len(data['list']) > 0:
        category = data['list'][0]
        print(f'板块名称: {category.get(\"ZSName\", \"未知\")}')
        print(f'包含股票数: {len(category.get(\"StockList\", []))}')

        if 'StockList' in category and len(category['StockList']) > 0:
            stock = category['StockList'][0]
            print(f'\n第一只股票的数据结构:')
            print(f'数组长度: {len(stock)}')
            print(f'数组内容:')
            for i, val in enumerate(stock[:15]):
                print(f'  [{i}]: {val}')
        else:
            print('没有找到StockList数据')
    else:
        print('API响应格式异常')
        print(data)
except Exception as e:
    print(f'解析错误: {e}')
    print(sys.stdin.read()[:500])
"

echo ""
echo "=== 完整第一只股票数据 ==="
cat /tmp/api_response.json | python3 -m json.tool 2>/dev/null | head -100
