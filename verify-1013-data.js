// 详细验证10-13数据准确性和成交额

const verifyTodayData = async () => {
  const date = '20251013';

  console.log('===== 2025-10-13 涨停数据详细报告 =====\n');

  const url = 'https://apphis.longhuvip.com/w1/api/index.php';
  const formData = new URLSearchParams({
    Date: date,
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
        'User-Agent': 'lhb/5.21.1 (com.kaipanla.www; build:1; iOS 18.6.2) Alamofire/4.9.1',
      },
      body: formData,
    });

    const data = await response.json();

    console.log('【整体统计】');
    console.log(`总涨停数: ${data.nums?.ZT || 0}只`);
    console.log(`涨停超标率: ${data.nums?.ZBL || 0}%`);
    console.log('');

    if (data.list && Array.isArray(data.list)) {
      // 收集所有板块数据
      const allSectors = [];
      let grandTotalAmount = 0;

      data.list.forEach(category => {
        const sectorName = category.ZSName || '未分类';
        const stockList = category.StockList || [];

        if (stockList.length > 0) {
          let sectorAmount = 0;
          const stocks = [];

          stockList.forEach(stockData => {
            const code = stockData[0];
            const name = stockData[1];
            const tdType = stockData[9] || '首板';
            const amountInYuan = parseFloat(stockData[6]) || 0;
            const amountInYi = amountInYuan / 100000000;

            sectorAmount += amountInYi;
            stocks.push({
              code,
              name,
              tdType,
              amount: amountInYi
            });
          });

          grandTotalAmount += sectorAmount;

          allSectors.push({
            sector: sectorName,
            count: stockList.length,
            amount: sectorAmount,
            stocks: stocks.sort((a, b) => b.amount - a.amount) // 按成交额排序
          });
        }
      });

      // 按涨停数排序
      allSectors.sort((a, b) => b.count - a.count);

      console.log('【前10大板块详情】\n');
      allSectors.slice(0, 10).forEach((sector, index) => {
        console.log(`${index + 1}. ${sector.sector}`);
        console.log(`   涨停数: ${sector.count}只`);
        console.log(`   板块成交额: ${sector.amount.toFixed(2)}亿元`);
        console.log(`   代表个股（按成交额排序）:`);

        sector.stocks.slice(0, 5).forEach((stock, i) => {
          console.log(`     ${i + 1}) ${stock.name}(${stock.code})`);
          console.log(`        板位: ${stock.tdType}`);
          console.log(`        成交额: ${stock.amount.toFixed(2)}亿元`);
        });
        console.log('');
      });

      console.log('【总计】');
      console.log(`所有板块成交额总和: ${grandTotalAmount.toFixed(2)}亿元`);
      console.log(`平均每只涨停股成交额: ${(grandTotalAmount / data.nums.ZT).toFixed(2)}亿元`);
      console.log('');

      console.log('【数据来源说明】');
      console.log('- 涨停数据: 东方财富API');
      console.log('- 成交额: stockData[6]字段（单位:元）');
      console.log('- 转换公式: 成交额(亿) = stockData[6] / 100000000');
      console.log('');

      console.log('【请验证】');
      console.log('1. 涨停数是否准确？');
      console.log('2. 成交额数据是否合理？(对比东方财富或同花顺)');
      console.log('3. 如果成交额偏差大，需改用Tushare API获取真实数据');
      console.log('');

      // 显示成交额最大的5只个股
      const allStocks = [];
      allSectors.forEach(sector => {
        sector.stocks.forEach(stock => {
          allStocks.push({ ...stock, sector: sector.sector });
        });
      });
      allStocks.sort((a, b) => b.amount - a.amount);

      console.log('【成交额最大的10只涨停股】');
      allStocks.slice(0, 10).forEach((stock, i) => {
        console.log(`${i + 1}. ${stock.name}(${stock.code}) [${stock.sector}]`);
        console.log(`   板位: ${stock.tdType}`);
        console.log(`   成交额: ${stock.amount.toFixed(2)}亿元`);
      });

    }

  } catch (error) {
    console.error('获取数据失败:', error);
  }
};

verifyTodayData().catch(console.error);
