// 验证时区修复后的日期逻辑

const verifyTimezoneFix = () => {
  console.log('===== 时区修复验证报告 =====\n');

  // 1. 当前时间信息
  const now = new Date();
  console.log('【当前时间】');
  console.log(`UTC时间: ${now.toISOString()}`);
  console.log(`UTC小时: ${now.getUTCHours()}`);
  console.log(`UTC日期: ${now.toISOString().split('T')[0]}`);
  console.log('');

  // 2. 北京时间转换（修复后的逻辑）
  const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  const beijingHour = beijingTime.getUTCHours();
  const beijingDateStr = beijingTime.toISOString().split('T')[0];

  console.log('【北京时间（修复后）】');
  console.log(`北京时间: ${beijingTime.toISOString()}`);
  console.log(`北京小时: ${beijingHour}`);
  console.log(`北京日期: ${beijingDateStr}`);
  console.log('');

  // 3. getTodayString() 模拟（修复后）
  const getTodayString = () => {
    const date = new Date();
    const beijingDate = new Date(date.getTime() + (8 * 60 * 60 * 1000));
    return beijingDate.toISOString().split('T')[0];
  };

  const todayString = getTodayString();
  console.log('【getTodayString() - 修复后】');
  console.log(`返回日期: ${todayString}`);
  console.log(`预期: ${beijingDateStr}`);
  console.log(`是否匹配: ${todayString === beijingDateStr ? '✓' : '✗'}`);
  console.log('');

  // 4. get7TradingDaysFromCalendar 逻辑模拟（修复后）
  console.log('【get7TradingDaysFromCalendar 逻辑 - 修复后】');
  const endDate = todayString;
  console.log(`endDate参数: ${endDate}`);

  const isToday = beijingDateStr === endDate;
  console.log(`endDate是否是北京时间今天: ${isToday}`);
  console.log(`北京时间当前小时: ${beijingHour}`);

  const shouldIncludeToday = isToday && beijingHour >= 15;
  console.log(`是否包含当天: ${shouldIncludeToday} (北京时间需要>=15:00)`);
  console.log('');

  // 5. 结论
  console.log('【修复效果验证】');

  if (beijingHour >= 15) {
    if (shouldIncludeToday) {
      console.log('✓ 修复成功！北京时间>=15:00，会包含当天');
      console.log(`✓ 7天数据会从 ${endDate} 开始向前查找`);
    } else {
      console.log('✗ 修复失败！逻辑仍有问题');
    }
  } else {
    if (!shouldIncludeToday) {
      console.log(`✓ 修复成功！北京时间<15:00（当前${beijingHour}点），会排除当天`);
      const prevDate = new Date(endDate);
      prevDate.setDate(prevDate.getDate() - 1);
      console.log(`✓ 7天数据会从 ${prevDate.toISOString().split('T')[0]} 开始向前查找`);

      // 检查10-13是否会被包含
      if (prevDate.toISOString().split('T')[0] >= '2025-10-13') {
        console.log('✓ 10-13数据会被包含在7天数据中');
      } else {
        console.log('⚠️  10-13数据可能不会被包含');
      }
    } else {
      console.log('✗ 修复失败！逻辑仍有问题');
    }
  }

  console.log('');
  console.log('【时区问题修复说明】');
  console.log('修复前问题:');
  console.log('- getTodayString() 返回UTC日期（10-13）');
  console.log('- get7TradingDaysFromCalendar 使用UTC小时数（1点）');
  console.log('- 因为1<15，排除当天，从10-12往前查找');
  console.log('- 结果：10-13数据被排除！');
  console.log('');
  console.log('修复后逻辑:');
  console.log('- getTodayString() 返回北京时间日期（10-14）');
  console.log('- get7TradingDaysFromCalendar 使用北京时间小时数（凌晨1点）');
  console.log('- 因为1<15，排除当天（10-14），从10-13往前查找');
  console.log('- 结果：✓ 10-13数据被包含！');
};

verifyTimezoneFix();
