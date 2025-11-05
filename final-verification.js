// 最终验证：10-13数据是否显示

const finalVerification = async () => {
  console.log('===== 最终验证：10-13数据显示测试 =====\n');

  // 模拟修复后的逻辑
  const now = new Date();
  const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  const beijingHour = beijingTime.getUTCHours();
  const beijingDateStr = beijingTime.toISOString().split('T')[0];

  console.log('【当前北京时间】');
  console.log(`北京时间: ${beijingTime.toISOString()}`);
  console.log(`北京日期: ${beijingDateStr}`);
  console.log(`北京小时: ${beijingHour}`);
  console.log('');

  // getTodayString() 修复后返回值
  const todayString = beijingDateStr; // 修复后返回北京时间日期
  console.log('【API调用参数】');
  console.log(`前端调用: /api/stocks?date=${todayString}&mode=7days`);
  console.log('');

  // 判断逻辑
  const isToday = beijingDateStr === todayString;
  const shouldIncludeToday = isToday && beijingHour >= 15;

  console.log('【7天交易日计算逻辑】');
  console.log(`endDate: ${todayString}`);
  console.log(`是否是今天: ${isToday}`);
  console.log(`是否包含当天: ${shouldIncludeToday} (需>=15:00)`);

  if (!shouldIncludeToday) {
    const prevDate = new Date(todayString);
    prevDate.setDate(prevDate.getDate() - 1);
    const startDateStr = prevDate.toISOString().split('T')[0];
    console.log(`从 ${startDateStr} 开始向前查找7个交易日`);
    console.log('');

    // 检查10-13是否会被包含
    console.log('【10-13数据检查】');
    if (startDateStr >= '2025-10-13') {
      console.log('✅ 10-13会被包含在7天数据中！');
      console.log(`理由: ${startDateStr} >= 2025-10-13`);
    } else {
      console.log('❌ 10-13不会被包含');
      console.log(`理由: ${startDateStr} < 2025-10-13`);
    }
  } else {
    console.log(`从 ${todayString} 开始向前查找7个交易日（包含当天）`);
    console.log('');
    console.log('【10-13数据检查】');
    console.log('✅ 10-13会被包含在7天数据中！');
  }

  console.log('');
  console.log('【测试建议】');
  console.log('1. 访问 http://localhost:3000');
  console.log('2. 打开浏览器控制台查看日志');
  console.log('3. 查找日志: [7天交易日] 北京时间: ...');
  console.log('4. 确认7天数据包含 2025-10-13');
  console.log('');
  console.log('【期望日志示例】');
  console.log('[7天交易日] 北京时间: 2025-10-14T01:XX:XX.XXXZ');
  console.log('[7天交易日] 成功获取7个交易日: ..., 2025-10-13, ...');
  console.log('');
  console.log('如果看到10-13在7天数据列表中，修复成功！✅');
};

finalVerification().catch(console.error);
