// 诊断日期处理问题 - 为什么10-13数据不显示

const diagnoseDateIssue = async () => {
  console.log('===== 日期处理诊断报告 =====\n');

  // 1. 检查当前系统时间
  const now = new Date();
  console.log('【系统时间】');
  console.log(`当前时间: ${now.toISOString()}`);
  console.log(`北京时间: ${now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
  console.log(`当前小时: ${now.getHours()}`);
  console.log(`今天日期: ${now.toISOString().split('T')[0]}`);
  console.log('');

  // 2. 模拟 getTodayString() 函数
  const getTodayString = () => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  };

  const todayString = getTodayString();
  console.log('【getTodayString() 返回值】');
  console.log(`返回日期: ${todayString}`);
  console.log('');

  // 3. 模拟 get7TradingDaysFromCalendar 的逻辑
  console.log('【get7TradingDaysFromCalendar 逻辑分析】');
  const endDate = todayString; // 这是传入的日期
  console.log(`endDate参数: ${endDate}`);

  const endDateObj = new Date(endDate);
  const currentHour = now.getHours();

  // 检查endDate是否是今天
  const isToday = now.toISOString().split('T')[0] === endDate;
  console.log(`endDate是否是今天: ${isToday}`);
  console.log(`当前时间: ${currentHour}点`);

  // v4.8.18修改：如果是今天且时间>=15:00（收盘时间），则包含当天
  const shouldIncludeToday = isToday && currentHour >= 15;
  console.log(`是否包含当天: ${shouldIncludeToday} (需要>=15:00)`);

  if (!shouldIncludeToday) {
    console.log('⚠️  由于时间<15:00或非今天，会从前一天开始查找7个交易日');
    const prevDate = new Date(endDate);
    prevDate.setDate(prevDate.getDate() - 1);
    console.log(`实际查询的结束日期: ${prevDate.toISOString().split('T')[0]}`);
  } else {
    console.log('✓ 包含当天，从当天开始查找7个交易日');
  }
  console.log('');

  // 4. 检查最近几天的涨停数据
  console.log('【验证最近交易日数据】');
  const testDates = ['2025-10-14', '2025-10-13', '2025-10-11'];

  for (const testDate of testDates) {
    const url = 'https://apphis.longhuvip.com/w1/api/index.php';
    const formData = new URLSearchParams({
      Date: testDate.replace(/-/g, ''),
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
        console.log(`${testDate}: ${limitUpCount}只涨停 ${limitUpCount > 0 ? '✓ 有数据' : '✗ 无数据'}`);
      }
    } catch (error) {
      console.log(`${testDate}: ✗ 请求失败`);
    }

    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('');
  console.log('【诊断结论】');
  console.log('问题原因分析:');

  if (currentHour < 15) {
    console.log('❌ 当前时间 < 15:00，get7TradingDaysFromCalendar会排除今天（10-14）');
    console.log('❌ 向前查找7天会从10-13往前推，可能查到10-13, 10-11, 10-10...');
    console.log('❌ 但如果10-13被排除，最新数据只能是10-11');
  } else {
    console.log('✓ 当前时间 >= 15:00，理论上应该包含今天');
    console.log('需要检查其他原因（可能是Tushare交易日历API的问题）');
  }

  console.log('');
  console.log('【建议修复方案】');
  console.log('1. 如果希望始终显示最新可用数据（不论时间）:');
  console.log('   修改 enhanced-trading-calendar.ts，移除15:00限制');
  console.log('');
  console.log('2. 如果希望保持15:00逻辑但确保10-13显示:');
  console.log('   检查Tushare交易日历是否正确返回10-13作为交易日');
  console.log('');
  console.log('3. 临时测试方案:');
  console.log('   手动访问 /api/stocks?date=2025-10-13&mode=7days');
  console.log('   查看API是否能正确处理10-13数据');
};

diagnoseDateIssue().catch(console.error);
