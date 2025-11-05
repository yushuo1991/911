// 查询特定板块的成交额详情
const https = require('https');

const targetDate = '2025-10-13';
const targetSector = '面板概念';

console.log(`\n🔍 查询 ${targetDate} 的 "${targetSector}" 板块成交额详情\n`);
console.log('='.repeat(80));

// 请求线上API
const options = {
  hostname: 'bk.yushuo.click',
  port: 443,
  path: `/api/stocks?date=${targetDate}&mode=7days`,
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);

      if (!result.success) {
        console.error('❌ API返回失败:', result.error);
        return;
      }

      const dayData = result.data[targetDate];

      if (!dayData) {
        console.error(`❌ 未找到 ${targetDate} 的数据`);
        return;
      }

      // 查找面板概念板块
      const sectorStocks = dayData.categories[targetSector];
      const sectorAmount = dayData.sectorAmounts?.[targetSector];

      if (!sectorStocks) {
        console.error(`❌ 未找到 "${targetSector}" 板块`);
        console.log('\n可用的板块列表:');
        Object.keys(dayData.categories).forEach((sector, index) => {
          const count = dayData.categories[sector].length;
          const amount = dayData.sectorAmounts?.[sector] || 0;
          console.log(`  ${index + 1}. ${sector} (${count}只, 💰${amount}亿)`);
        });
        return;
      }

      // 显示板块汇总
      console.log(`\n📊 板块: ${targetSector}`);
      console.log(`   涨停个股数: ${sectorStocks.length}只`);
      console.log(`   板块成交额合计: 💰${sectorAmount || 0}亿元`);
      console.log('\n' + '-'.repeat(80));

      // 显示每只个股的详细信息
      console.log('\n个股成交额明细:\n');

      let totalCalculated = 0;
      sectorStocks.forEach((stock, index) => {
        // 注意：从API返回的数据中，个股的Amount信息可能在原始数据中
        // 但在categories中可能没有直接包含
        console.log(`${index + 1}. ${stock.name} (${stock.code})`);
        console.log(`   板位: ${stock.td_type}`);
        console.log(`   后5日累计收益: ${stock.total_return}%`);

        // 尝试从followUpData中获取更多信息
        const followUp = dayData.followUpData[targetSector]?.[stock.code];
        if (followUp) {
          const dates = Object.keys(followUp).sort();
          console.log(`   后续表现:`, dates.map(d => `${d.slice(5)}: ${followUp[d]}%`).join(', '));
        }
        console.log('');
      });

      console.log('='.repeat(80));
      console.log(`\n💡 说明:`);
      console.log(`   - 板块成交额 = 该板块所有涨停个股的成交额之和`);
      console.log(`   - 成交额单位: 亿元`);
      console.log(`   - 数据来源: 东方财富涨停板API`);
      console.log(`\n⚠️  注意:`);
      console.log(`   - API返回的categories数据结构中不直接包含单个股票的成交额`);
      console.log(`   - 单个股票成交额在原始API数据中（stockData[6]），但在处理后被汇总到板块级别`);
      console.log(`   - 如需查看单个股票成交额，需要查看原始API响应或服务器日志\n`);

    } catch (error) {
      console.error('❌ 解析数据失败:', error.message);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ 请求失败:', error.message);
});

req.end();
