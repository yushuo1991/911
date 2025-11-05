// 诊断时区问题
// 用于检查getTodayString和get7TradingDaysFromCalendar的时区逻辑

console.log('=== 时区诊断开始 ===\n');

// 模拟当前代码的getTodayString逻辑
function getTodayString() {
  const date = new Date();
  const beijingDate = new Date(date.getTime() + (8 * 60 * 60 * 1000));
  return beijingDate.toISOString().split('T')[0];
}

// 模拟当前代码的时间判断逻辑
function checkShouldIncludeToday() {
  const now = new Date();
  const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  const beijingHour = beijingTime.getUTCHours();
  const beijingDateStr = beijingTime.toISOString().split('T')[0];
  
  console.log('当前系统时间:', now.toString());
  console.log('系统时区偏移(分钟):', now.getTimezoneOffset());
  console.log('当前UTC时间:', now.toUTCString());
  console.log('当前本地时间:', now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
  console.log('');
  console.log('计算后的beijingTime:', beijingTime.toISOString());
  console.log('beijingTime.getUTCHours():', beijingHour);
  console.log('beijingDateStr:', beijingDateStr);
  console.log('');
  
  const endDate = getTodayString();
  const isToday = beijingDateStr === endDate;
  const shouldIncludeToday = isToday && beijingHour >= 17;
  
  console.log('getTodayString() 返回:', endDate);
  console.log('isToday:', isToday);
  console.log('shouldIncludeToday (>=17:00):', shouldIncludeToday);
  
  return { shouldIncludeToday, beijingHour, beijingDateStr, endDate };
}

// 正确的北京时间获取方法
function getCorrectBeijingTime() {
  const now = new Date();
  // 方法1: 使用toLocaleString
  const beijingTimeStr = now.toLocaleString('zh-CN', { 
    timeZone: 'Asia/Shanghai',
    hour12: false
  });
  
  // 方法2: 手动计算（考虑系统时区）
  const utcTime = now.getTime();
  const utcOffset = now.getTimezoneOffset() * 60 * 1000; // 系统时区偏移（毫秒）
  const beijingOffset = 8 * 60 * 60 * 1000; // 北京时区偏移（毫秒）
  const beijingTime = new Date(utcTime + utcOffset + beijingOffset);
  
  console.log('\n=== 正确的北京时间获取方法 ===');
  console.log('方法1 (toLocaleString):', beijingTimeStr);
  console.log('方法2 (手动计算):', beijingTime.toISOString());
  console.log('北京时间小时数:', beijingTime.getUTCHours());
  console.log('北京时间日期:', beijingTime.toISOString().split('T')[0]);
  
  return beijingTime;
}

// 运行诊断
const result = checkShouldIncludeToday();
const correctTime = getCorrectBeijingTime();

console.log('\n=== 问题分析 ===');
console.log('问题1: 如果服务器在非UTC时区运行，直接加8小时会导致时间不准确');
console.log('问题2: 需要先转换到UTC，再加8小时，才能得到正确的北京时间');
console.log('');
console.log('当前代码逻辑:');
console.log('  系统时间 + 8小时 = "北京时间"');
console.log('  这在服务器为UTC时区时正确，但在其他时区会出错');
console.log('');
console.log('修复方案:');
console.log('  1. 先获取UTC时间: now.getTime() + now.getTimezoneOffset() * 60000');
console.log('  2. 再加北京偏移: utcTime + (8 * 60 * 60 * 1000)');
console.log('  或直接使用: toLocaleString("zh-CN", {timeZone: "Asia/Shanghai"})');

console.log('\n=== 时区诊断结束 ===');

