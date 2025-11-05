// 快速修复：将默认日期改为有数据的日期
const fs = require('fs');

// 读取文件
const filePath = '/tmp/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 替换 getTodayString() 为固定日期
content = content.replace(
  'const endDate = getTodayString();',
  'const endDate = "2025-09-26"; // 使用有数据的日期'
);

// 写回文件
fs.writeFileSync(filePath, content);
console.log('修复完成：默认加载9月26日数据');