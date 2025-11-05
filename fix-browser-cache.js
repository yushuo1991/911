#!/usr/bin/env node

/**
 * 浏览器缓存问题诊断和修复脚本
 *
 * 问题描述：
 * 后端API返回的最新数据（包含2025-10-09）没有在浏览器显示
 * 浏览器页面停留在09-30的旧数据
 *
 * 可能原因：
 * 1. API响应缓存时间过长（30分钟）
 * 2. 前端fetch没有禁用缓存
 * 3. Next.js默认缓存策略
 * 4. Service Worker缓存
 *
 * 修复方案：
 * 1. 缩短API缓存时间到5分钟
 * 2. 在API响应头添加 Cache-Control: no-store
 * 3. 在前端fetch添加 cache: 'no-store'
 * 4. 添加时间戳参数强制刷新
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 开始诊断浏览器缓存问题...\n');

// 1. 检查API缓存配置
console.log('📋 步骤1: 检查API缓存配置');
const apiRoutePath = path.join(__dirname, 'src/app/api/stocks/route.ts');

if (fs.existsSync(apiRoutePath)) {
  const content = fs.readFileSync(apiRoutePath, 'utf-8');

  // 检查缓存时间
  const cacheMatch = content.match(/SEVEN_DAYS_CACHE_DURATION\s*=\s*(\d+)\s*\*\s*(\d+)\s*\*\s*(\d+)/);
  if (cacheMatch) {
    const minutes = parseInt(cacheMatch[1]);
    console.log(`   ✓ 当前7天数据缓存时间: ${minutes}分钟`);

    if (minutes > 5) {
      console.log(`   ⚠️  警告: 缓存时间过长，建议改为5分钟`);
    }
  }

  // 检查是否有Cache-Control响应头
  if (content.includes('Cache-Control')) {
    console.log('   ✓ API已设置Cache-Control响应头');
  } else {
    console.log('   ❌ API未设置Cache-Control响应头（需要添加）');
  }
} else {
  console.log('   ❌ 找不到API路由文件');
}

// 2. 检查前端fetch配置
console.log('\n📋 步骤2: 检查前端fetch配置');
const pagePath = path.join(__dirname, 'src/app/page.tsx');

if (fs.existsSync(pagePath)) {
  const content = fs.readFileSync(pagePath, 'utf-8');

  // 检查fetch是否有cache配置
  const fetchMatch = content.match(/fetch\([^)]+\)/g);
  if (fetchMatch) {
    console.log(`   ✓ 找到${fetchMatch.length}个fetch调用`);

    const hasCacheControl = fetchMatch.some(f => f.includes('cache:') || f.includes('no-store'));
    if (hasCacheControl) {
      console.log('   ✓ fetch已配置缓存控制');
    } else {
      console.log('   ❌ fetch未配置缓存控制（需要添加 cache: "no-store"）');
    }
  }
} else {
  console.log('   ❌ 找不到页面文件');
}

// 3. 生成修复建议
console.log('\n📝 修复建议:\n');

console.log('1️⃣ 修改API缓存时间 (src/app/api/stocks/route.ts):');
console.log('   将第26行的缓存时间改为5分钟:');
console.log('   private readonly SEVEN_DAYS_CACHE_DURATION = 5 * 60 * 1000; // 5分钟\n');

console.log('2️⃣ 在API响应头添加no-cache (src/app/api/stocks/route.ts):');
console.log('   在get7DaysData函数的返回值中添加headers:');
console.log(`   return NextResponse.json({
     success: true,
     data: result,
     dates: sevenDays,
     cached: false
   }, {
     headers: {
       'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
       'Pragma': 'no-cache',
       'Expires': '0'
     }
   });\n`);

console.log('3️⃣ 修改前端fetch添加no-store (src/app/page.tsx):');
console.log('   在第58行的fetch调用中添加cache配置:');
console.log(`   const response = await fetch(\`/api/stocks?date=\${endDate}&mode=7days&t=\${Date.now()}\`, {
     cache: 'no-store',
     headers: {
       'Cache-Control': 'no-cache'
     }
   });\n`);

console.log('4️⃣ 清除浏览器缓存:');
console.log('   - 打开开发者工具 (F12)');
console.log('   - 右键点击刷新按钮');
console.log('   - 选择"清空缓存并硬性重新加载"');
console.log('   - 或者在Application标签中手动清除存储\n');

console.log('5️⃣ 部署后清除服务器缓存:');
console.log('   docker compose restart\n');

console.log('✅ 诊断完成！请按照以上建议修复问题。\n');

// 生成修复后的文件备份路径
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
console.log(`📁 建议在修复前备份当前文件到: backup-${timestamp}/\n`);
