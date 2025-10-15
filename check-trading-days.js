// 检查最近的交易日和涨停数据

const checkRecentTradingDays = async () => {
  console.log('===== 检查最近交易日 =====\n');

  // 检查最近5天
  const dates = [];
  const today = new Date();

  for (let i = 0; i < 5; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    dates.push({
      formatted: date.toISOString().split('T')[0],
      api: dateStr,
      weekday: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()]
    });
  }

  console.log('检查最近5天:', dates.map(d => `${d.formatted}(周${d.weekday})`).join(', '));
  console.log('');

  // 逐个检查哪天有涨停数据
  for (const date of dates) {
    const url = 'https://apphis.longhuvip.com/w1/api/index.php';
    const formData = new URLSearchParams({
      Date: date.api,
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

      if (response.ok) {
        const data = await response.json();
        const limitUpCount = data.nums?.ZT || 0;

        if (limitUpCount > 0) {
          console.log(`✓ ${date.formatted} (周${date.weekday}): ${limitUpCount}只涨停 [有数据]`);

          // 显示详细数据
          if (data.list && Array.isArray(data.list)) {
            const top5Sectors = data.list
              .map(cat => ({
                name: cat.ZSName,
                count: cat.StockList ? cat.StockList.length : 0
              }))
              .filter(s => s.count > 0)
              .sort((a, b) => b.count - a.count)
              .slice(0, 5);

            console.log('  前5板块:', top5Sectors.map(s => `${s.name}(${s.count})`).join(', '));
          }
        } else {
          console.log(`✗ ${date.formatted} (周${date.weekday}): 无涨停数据`);
        }
      }
    } catch (error) {
      console.log(`✗ ${date.formatted} (周${date.weekday}): 请求失败 - ${error.message}`);
    }

    // 短暂延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\n===== 结论 =====');
  console.log('数据刷新问题分析:');
  console.log('1. 如果10-14(周一)无数据，可能是节假日或API未更新');
  console.log('2. 如果最新数据是10-11(周五)，说明周末无数据正常');
  console.log('3. 需要调整17:00刷新逻辑为15:00收盘后立即刷新');
};

checkRecentTradingDays().catch(console.error);
