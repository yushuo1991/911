// 测试脚本：获取今天(10-14)的涨停数据
// 验证数据准确性和成交额

const getTodayLimitUpStocks = async () => {
  const today = '20251014'; // 2025-10-14

  console.log('===== 获取2025-10-14涨停数据 =====\n');

  const url = 'https://apphis.longhuvip.com/w1/api/index.php';
  const formData = new URLSearchParams({
    Date: today,
    Index: '0',
    PhoneOSNew: '2',
    VerSion: '5.21.0.1',
    a: 'GetPlateInfo_w38',
    apiv: 'w42',
    c: 'HisLimitResumption',
    st: '20'
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        'Accept': '*/*',
        'User-Agent': 'lhb/5.21.1 (com.kaipanla.www; build:1; iOS 18.6.2) Alamofire/4.9.1',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log('API响应状态:', response.status);
    console.log('总涨停数:', data.nums?.ZT || 0);
    console.log('涨幅超标率:', data.nums?.ZBL || 0);
    console.log('\n===== 按板块统计 =====\n');

    if (data.list && Array.isArray(data.list)) {
      const sectorStats = [];
      let totalStocks = 0;

      data.list.forEach(category => {
        const sectorName = category.ZSName || '未分类';
        const stockCount = category.StockList ? category.StockList.length : 0;
        totalStocks += stockCount;

        if (stockCount > 0) {
          // 计算板块成交额总和
          let sectorAmount = 0;
          const stocks = [];

          category.StockList.forEach(stockData => {
            const stockCode = stockData[0];
            const stockName = stockData[1];
            const tdType = stockData[9] || '首板';
            const amountInYuan = parseFloat(stockData[6]) || 0; // 成交额（元）
            const amountInYi = amountInYuan / 100000000; // 转换为亿元

            sectorAmount += amountInYi;
            stocks.push({
              code: stockCode,
              name: stockName,
              tdType: tdType,
              amount: amountInYi.toFixed(2) + '亿'
            });
          });

          sectorStats.push({
            sector: sectorName,
            count: stockCount,
            amount: sectorAmount.toFixed(2) + '亿',
            stocks: stocks.slice(0, 5) // 只显示前5只
          });
        }
      });

      // 按涨停数排序
      sectorStats.sort((a, b) => b.count - a.count);

      console.log(`总涨停个股: ${totalStocks}只\n`);

      // 显示前10个板块
      sectorStats.slice(0, 10).forEach((stat, index) => {
        console.log(`${index + 1}. ${stat.sector}`);
        console.log(`   涨停数: ${stat.count}只`);
        console.log(`   成交额: ${stat.amount}`);
        console.log(`   代表个股:`);
        stat.stocks.forEach(stock => {
          console.log(`     - ${stock.name}(${stock.code}) [${stock.tdType}] 成交额:${stock.amount}`);
        });
        console.log('');
      });

      console.log('\n===== 数据验证说明 =====');
      console.log('1. 请对比涨停数是否准确');
      console.log('2. 请检查成交额数据是否合理');
      console.log('3. 成交额单位：亿元');
      console.log('4. 数据来源：东方财富涨停数据API (stockData[6])');

    } else {
      console.log('没有获取到涨停数据');
    }

  } catch (error) {
    console.error('获取数据失败:', error);
  }
};

// 执行测试
getTodayLimitUpStocks().catch(console.error);
